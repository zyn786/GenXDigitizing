/**
 * The reference a customer is given when they submit a request without an
 * account, and that the team uses to find them again.
 *
 * Why this exists: the upload wizard generated its reference in the browser
 * (`GX-` + Date.now().toString(36)) and never sent it anywhere. The
 * confirmation screen displayed it and the WhatsApp template repeated it, but
 * the string was not in the database, so a customer quoting it got a blank
 * look and staff had nothing to search. That is worse than no reference at all
 * — the customer believes they have a receipt.
 *
 * The format is generated on the server, written to the lead's notes (there is
 * no dedicated column, and the notes column is where every other structured
 * fact about a lead already lives — see lib/lead-artwork), and returned to the
 * browser so the screen shows the real one.
 *
 * The alphabet omits 0/O/1/I/L because these get read aloud over the phone and
 * typed from a screenshot.
 *
 * Pure and dependency-free — the format is the whole contract.
 */

/** Unambiguous alphabet: no 0/O/1/I/L. */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const REF_LENGTH = 6;
const PREFIX = "GX-";

/**
 * A fresh reference. Collisions are possible in principle (32^6 ≈ 1.07e9), but
 * the reference is never used alone — a lookup also requires the customer's
 * email address — so a collision is not an exposure.
 */
export function generateLeadReference(): string {
  const bytes = new Uint8Array(REF_LENGTH);
  // globalThis.crypto is available in every runtime this app deploys to (Node
  // 18+, the edge runtime, and the browser), so there is no fallback branch to
  // get wrong.
  globalThis.crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < REF_LENGTH; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return PREFIX + out;
}

/**
 * Normalise what a human typed. References get copied out of a chat message or
 * read off a screen, so accept lowercase, stray spaces, and a missing prefix.
 */
export function normaliseLeadReference(input: string | null | undefined): string | null {
  if (!input) return null;
  const cleaned = input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/^GX/, "");
  if (cleaned.length !== REF_LENGTH) return null;
  for (const ch of cleaned) if (!ALPHABET.includes(ch)) return null;
  return PREFIX + cleaned;
}

/** The notes line that records a reference, so the writer and reader agree. */
export function formatLeadReferenceLine(reference: string): string {
  return `Reference: ${reference}`;
}

/**
 * Read the reference back out of a lead's notes.
 *
 * Accepts a reference anywhere in the text (it is written as the first line by
 * both write sites, but a staff member may paste it into a note too), and
 * validates the shape so an unrelated "Reference: ..." line cannot masquerade
 * as one.
 */
export function parseLeadReference(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const m = notes.match(/Reference:\s*(GX-[A-Za-z0-9]{6})/i);
  return m ? normaliseLeadReference(m[1]) : null;
}
