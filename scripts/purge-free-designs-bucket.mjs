/**
 * One-off: empty (and optionally drop) the 'free-designs' storage bucket.
 *
 * This deletes real customer-facing files and CANNOT be undone outside a
 * Supabase backup. It therefore defaults to a dry run.
 *
 *   node --env-file=.env.local scripts/purge-free-designs-bucket.mjs
 *       → lists what would be deleted, deletes nothing
 *
 *   node --env-file=.env.local scripts/purge-free-designs-bucket.mjs --confirm
 *       → deletes every object in the bucket
 *
 *   node --env-file=.env.local scripts/purge-free-designs-bucket.mjs --confirm --drop-bucket
 *       → also removes the bucket itself (run AFTER applying migration 045)
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

const BUCKET = "free-designs";
const PAGE = 100;
const DELETE_BATCH = 100;

const confirm = process.argv.includes("--confirm");
const dropBucket = process.argv.includes("--drop-bucket");

// --env-file only covers one file; load .env.local too when it wasn't passed.
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

/** Recursively collect every object path under `prefix`. */
async function listAll(prefix = "") {
  const found = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(prefix, { limit: PAGE, offset });
    if (error) throw new Error(`list "${prefix || "/"}" failed: ${error.message}`);
    if (!data?.length) break;

    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      // Folders come back with a null id and no metadata.
      if (entry.id === null) found.push(...(await listAll(path)));
      else found.push(path);
    }
    if (data.length < PAGE) break;
  }
  return found;
}

async function main() {
  console.log(`bucket: ${BUCKET}`);
  console.log(confirm ? "mode:   DELETE" : "mode:   dry run (pass --confirm to delete)\n");

  let objects;
  try {
    objects = await listAll();
  } catch (err) {
    // A missing bucket is the expected end state — not a failure.
    if (/not found/i.test(err.message)) {
      console.log("Bucket does not exist. Nothing to purge.");
      return;
    }
    throw err;
  }

  console.log(`objects found: ${objects.length}`);
  for (const p of objects.slice(0, 20)) console.log(`  ${p}`);
  if (objects.length > 20) console.log(`  … and ${objects.length - 20} more`);

  if (!objects.length) {
    console.log("\nBucket is already empty.");
  } else if (!confirm) {
    console.log(`\nDry run — nothing deleted. Re-run with --confirm to remove ${bytes} object(s).`);
    return;
  } else {
    let deleted = 0;
    for (let i = 0; i < objects.length; i += DELETE_BATCH) {
      const batch = objects.slice(i, i + DELETE_BATCH);
      const { error } = await supabase.storage.from(BUCKET).remove(batch);
      if (error) throw new Error(`remove failed at offset ${i}: ${error.message}`);
      deleted += batch.length;
      console.log(`deleted ${deleted}/${objects.length}`);
    }

    // Verify rather than trust the API's silence.
    const remaining = await listAll();
    if (remaining.length) {
      console.error(`\n${remaining.length} object(s) remain — NOT dropping the bucket.`);
      process.exitCode = 1;
      return;
    }
    console.log("\nAll objects removed, verified empty.");
  }

  if (dropBucket) {
    if (!confirm) {
      console.log("--drop-bucket ignored without --confirm.");
      return;
    }
    const { error } = await supabase.storage.deleteBucket(BUCKET);
    if (error) {
      console.error(`Failed to drop bucket: ${error.message}`);
      process.exitCode = 1;
      return;
    }
    console.log(`Bucket "${BUCKET}" dropped.`);
  } else if (objects.length) {
    console.log("Bucket left in place. Re-run with --drop-bucket to remove it.");
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
