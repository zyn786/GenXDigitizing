/**
 * One-off: rewrite legacy `sent_emails.attachments_meta` values.
 *
 * Rows written before the send-email route stored only a comma-joined list of
 * filenames, which is why the Sent view could not render previews or download
 * links after a refetch. The files themselves are still in the `artwork`
 * bucket under `email-attachments/<timestamp>-<sanitised-name>`, so the paths
 * can be recovered by matching each stored filename to its object.
 *
 * This writes to the production database, so it defaults to a dry run:
 *
 *   node scripts/backfill-email-attachments.mjs
 *       → shows the plan, writes nothing
 *
 *   node scripts/backfill-email-attachments.mjs --apply
 *       → updates attachments_meta to JSON [{filename,path,content_type,size}]
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

const BUCKET = "artwork";
const PREFIX = "email-attachments";
const ROW_PAGE = 500;
const LIST_PAGE = 100;
/** Upload happens seconds to minutes before send; a little clock skew is fine. */
const SEND_SKEW_MS = 60 * 1000;

const apply = process.argv.includes("--apply");

function loadEnvLocal() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const value = m[2].replace(/^["']|["']$/g, "");
    if (!process.env[m[1]]) process.env[m[1]] = value;
  }
}
loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const MIME = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  avif: "image/avif",
  svg: "image/svg+xml",
};

function mimeFor(name) {
  const ext = String(name).toLowerCase().split(".").pop() || "";
  return MIME[ext] || "application/octet-stream";
}

/** Must match app/api/admin/email/upload/route.ts. */
function safeName(name) {
  return String(name).replace(/[^a-zA-Z0-9._-]/g, "_");
}

/** Collect every object under a prefix, including nested folders. */
async function listAll(prefix) {
  const found = [];
  for (let offset = 0; ; offset += LIST_PAGE) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(prefix, { limit: LIST_PAGE, offset });
    if (error) throw new Error(`list "${prefix}" failed: ${error.message}`);
    if (!data?.length) break;

    for (const entry of data) {
      const path = `${prefix}/${entry.name}`;
      if (entry.id === null) found.push(...(await listAll(path)));
      else found.push({ path, metadata: entry.metadata ?? {} });
    }
    if (data.length < LIST_PAGE) break;
  }
  return found;
}

async function loadLegacyRows() {
  const rows = [];
  for (let from = 0; ; from += ROW_PAGE) {
    const { data, error } = await supabase
      .from("sent_emails")
      .select("id,to_email,subject,sent_at,attachments_meta")
      .not("attachments_meta", "is", null)
      .order("sent_at", { ascending: true })
      .range(from, from + ROW_PAGE - 1);
    if (error) throw new Error(`sent_emails select failed: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < ROW_PAGE) break;
  }
  return rows.filter((r) => {
    const text = String(r.attachments_meta || "").trim();
    if (!text.startsWith("[")) return true; // legacy comma list
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) && parsed.length > 0 && parsed.every((a) => !a?.path);
    } catch {
      return true;
    }
  });
}

function namesFrom(meta) {
  const text = String(meta || "").trim();
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map((a) => a.filename).filter(Boolean);
  } catch {
    /* legacy comma list */
  }
  return text
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);
}

async function main() {
  console.log(`row scan: sent_emails with legacy attachments_meta`);
  console.log(apply ? "mode:     APPLY\n" : "mode:     dry run (pass --apply to write)\n");

  const objects = await listAll(PREFIX);
  console.log(`storage objects under ${BUCKET}/${PREFIX}/: ${objects.length}\n`);

  // name suffix → candidates, newest first
  const bySuffix = new Map();
  for (const obj of objects) {
    const m = obj.path.match(/^email-attachments\/(\d+)-([^/]+)$/);
    if (!m) continue;
    const ts = Number(m[1]);
    const suffix = m[2];
    const list = bySuffix.get(suffix) || [];
    list.push({ ...obj, ts });
    bySuffix.set(suffix, list);
  }
  for (const list of bySuffix.values()) list.sort((a, b) => b.ts - a.ts);

  const used = new Set();
  const rows = await loadLegacyRows();
  console.log(`legacy rows found: ${rows.length}\n`);

  let changed = 0;
  let unmatchedTotal = 0;

  for (const row of rows) {
    const sentAt = Date.parse(row.sent_at) || 0;
    const names = namesFrom(row.attachments_meta);
    const rebuilt = [];
    let rowChanged = false;
    let rowUnmatched = 0;

    for (const filename of names) {
      const candidates = bySuffix.get(safeName(filename)) || [];
      const available = candidates.filter((c) => !used.has(c.path));
      // The file must have existed before the send. Allow a minute of clock
      // skew, then take the newest such copy — the same filenames are often
      // sent twice in quick succession, and "nearest by absolute time" would
      // swap the two batches. Only when nothing predates the send fall back
      // to the closest copy either side.
      let pick =
        available
          .filter((c) => c.ts <= sentAt + SEND_SKEW_MS)
          .sort((a, b) => b.ts - a.ts)[0] || null;
      if (!pick && available.length) {
        pick = available.sort((a, b) => Math.abs(a.ts - sentAt) - Math.abs(b.ts - sentAt))[0];
      }

      if (pick) {
        used.add(pick.path);
        rebuilt.push({
          filename,
          path: pick.path,
          content_type: pick.metadata?.mimetype || mimeFor(filename),
          size: pick.metadata?.size,
        });
        rowChanged = true;
      } else {
        rebuilt.push({ filename });
        rowUnmatched++;
      }
    }

    unmatchedTotal += rowUnmatched;
    if (!rowChanged) {
      console.log(`SKIP  ${row.sent_at}  ${row.to_email}  — no objects matched`);
      continue;
    }

    changed++;
    console.log(
      `${apply ? "WRITE" : "PLAN "} ${row.sent_at}  ${row.to_email}  ` +
        `${rebuilt.length} file(s)${rowUnmatched ? `, ${rowUnmatched} unmatched` : ""}`
    );
    for (const a of rebuilt) {
      console.log(`        ${a.path || "(no object)"}  ←  ${a.filename}`);
    }

    if (apply) {
      const { error } = await supabase
        .from("sent_emails")
        .update({ attachments_meta: JSON.stringify(rebuilt) })
        .eq("id", row.id)
        // Optimistic guard: never clobber a row that changed after we read it.
        .eq("attachments_meta", row.attachments_meta);
      if (error) throw new Error(`update ${row.id} failed: ${error.message}`);
    }
  }

  console.log(`\nrows ${apply ? "updated" : "would update"}: ${changed}`);
  console.log(`files with no matching object: ${unmatchedTotal}`);
  if (!apply) console.log("\nDry run — nothing written. Re-run with --apply.");
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
