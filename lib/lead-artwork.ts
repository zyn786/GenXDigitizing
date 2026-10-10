/**
 * How an uploaded artwork file is recorded in `crm_leads.notes` and read back
 * out again when the lead is converted into an order.
 *
 * There is no join table between a lead and its uploads, so the notes text IS
 * the record. That made the format a de-facto interface between three routes
 * that never agreed on it:
 *
 *   - app/api/contact/route.ts      wrote  "Artwork: a.png (1.2MB)" + "Download: /api/chat/upload?key=…"
 *   - app/api/upload/guest-order    wrote  "- a.png (1.2MB) — /api/chat/upload?key=…"
 *   - app/api/crm/convert-to-order  read   only the first format, first file only
 *
 * So every lead created by the guest upload wizard — the main conversion path —
 * reached conversion with NO artwork attached: the order was created, the
 * designer opened it, and the file was missing. Nothing surfaced an error
 * (the attach block simply did not run) and staff saw "Order created!".
 *
 * Both write sites now emit LINES_FROM here and convert-to-order reads with
 * parseLeadArtwork, which accepts both formats so leads already sitting in the
 * database keep working. Multiple files are supported — the old reader used a
 * non-global `.match`, so even contact-form leads only ever attached file #1.
 *
 * Deliberately dependency-free and pure: the format is the whole contract.
 */

/** One uploaded artwork file, as recorded on a lead. */
export interface LeadArtworkFile {
  /** Original filename as the customer supplied it. */
  name: string;
  /** Decoded Supabase Storage key (no query string, no leading slash). */
  key: string;
  /** Size in KB when known — the notes line carries it, so it is best-effort. */
  sizeKb: number | null;
}

/** The path convert-to-order and the chat upload API both serve files through. */
const DOWNLOAD_PATH = "/api/chat/upload?key=";

/**
 * Parse a "12.3MB" / "512KB" / "900 bytes" fragment into KB.
 * Returns null rather than guessing when the unit is unrecognised.
 */
function parseSizeKb(raw: string): number | null {
  const m = raw.trim().match(/^([\d.]+)\s*(b|kb|mb|gb)?$/i);
  if (!m) return null;
  const value = parseFloat(m[1]);
  if (!Number.isFinite(value)) return null;
  switch ((m[2] || "b").toLowerCase()) {
    case "gb":
      return Math.round(value * 1024 * 1024);
    case "mb":
      return Math.round(value * 1024);
    case "kb":
      return Math.round(value);
    default:
      return Math.round(value / 1024);
  }
}

/** Strip the "1.2MB" parenthetical from the end of a filename, if present. */
function splitNameAndSize(raw: string): { name: string; sizeKb: number | null } {
  const m = raw.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
  if (m) {
    const sizeKb = parseSizeKb(m[2]);
    if (sizeKb !== null) return { name: m[1].trim() || "artwork", sizeKb };
  }
  return { name: raw.trim() || "artwork", sizeKb: null };
}

/** Extract the storage key from a `/api/chat/upload?key=…` URL fragment. */
function keyFromDownloadUrl(url: string): string | null {
  const at = url.indexOf("key=");
  if (at === -1) return null;
  // The URL always ends the line, but a trailing space or markdown punctuation
  // would otherwise land inside the key.
  const encoded = url
    .slice(at + 4)
    .trim()
    .replace(/[)\].,;]+$/, "");
  if (!encoded) return null;
  try {
    const decoded = decodeURIComponent(encoded);
    // The key is fed to a service-role signed URL. Refuse anything that could
    // escape its prefix — same rules as lib/storage-keys.ts.
    if (!decoded || decoded.startsWith("/") || decoded.includes("..")) return null;
    if (decoded.includes("\\") || decoded.includes("\0")) return null;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Read every artwork file recorded on a lead's notes.
 *
 * Accepts both formats ever written:
 *   canonical  "Artwork: a.png (1.2MB)"  followed by  "Download: /api/chat/upload?key=…"
 *   legacy     "- a.png (1.2MB) — /api/chat/upload?key=…"
 *
 * A "Download:" line is also honoured on its own (name falls back), so a note
 * that lost its header line still yields the file rather than nothing.
 */
export function parseLeadArtwork(notes: string | null | undefined): LeadArtworkFile[] {
  if (!notes) return [];

  const files: LeadArtworkFile[] = [];
  const seen = new Set<string>();
  let pendingName: string | null = null;
  let pendingSizeKb: number | null = null;

  const push = (name: string, sizeKb: number | null, key: string) => {
    if (seen.has(key)) return; // never attach the same object twice
    seen.add(key);
    files.push({ name, key, sizeKb });
  };

  for (const line of notes.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Canonical header line — the Download line that follows carries the key.
    if (/^Artwork:/i.test(trimmed)) {
      const split = splitNameAndSize(trimmed.replace(/^Artwork:\s*/i, ""));
      pendingName = split.name;
      pendingSizeKb = split.sizeKb;
      continue;
    }

    // Legacy single-line form: "… — /api/chat/upload?key=…"
    if (/^[-•*]\s/.test(trimmed) && trimmed.includes(DOWNLOAD_PATH)) {
      const beforeDash = trimmed.split(/\s+[—–-]\s+/)[0].replace(/^[-•*]\s*/, "");
      const split = splitNameAndSize(beforeDash);
      const key = keyFromDownloadUrl(trimmed);
      if (key) push(split.name, split.sizeKb, key);
      pendingName = null;
      pendingSizeKb = null;
      continue;
    }

    if (/^Download:/i.test(trimmed)) {
      const key = keyFromDownloadUrl(trimmed);
      if (key) push(pendingName ?? "artwork-from-lead", pendingSizeKb, key);
      pendingName = null;
      pendingSizeKb = null;
      continue;
    }

    // Any other line ends the current record — never let a header from one
    // file pair with an unrelated download line further down the notes.
    pendingName = null;
    pendingSizeKb = null;
  }

  return files;
}

/**
 * Render the canonical notes lines for uploaded files.
 *
 * Used by both write sites (contact form, guest upload wizard) so the reader
 * above has exactly one shape to trust going forward.
 */
export function formatLeadArtworkLines(
  files: { name: string; key: string; size?: number | null }[]
): string[] {
  const lines: string[] = [];
  for (const file of files) {
    const name = file.name || "artwork";
    let size = "";
    if (typeof file.size === "number" && file.size > 0) {
      // Switch units below 1MB: embroidery files (DST/PES/EXP) are routinely a
      // few KB, and "0.0MB" would erase the only size signal staff get.
      size =
        file.size >= 1024 * 1024
          ? ` (${(file.size / 1024 / 1024).toFixed(1)}MB)`
          : ` (${Math.max(1, Math.round(file.size / 1024))}KB)`;
    }
    lines.push(`Artwork: ${name}${size}`);
    lines.push(`Download: ${DOWNLOAD_PATH}${encodeURIComponent(file.key)}`);
  }
  return lines;
}
