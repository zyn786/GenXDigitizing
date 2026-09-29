/**
 * Guards for routes that sign or serve a CALLER-SUPPLIED storage key.
 *
 * `signStorageUrl` authenticates with the service-role client, which bypasses
 * storage RLS. Any route that signs a key taken from a query parameter is
 * therefore the only gate in front of that object — and it must constrain the
 * key to an explicit prefix allowlist. Without this, a single endpoint will
 * happily sign order artwork, paid output files, and admin email attachments
 * for anyone who knows or guesses the storage path.
 *
 * Pure functions, no Supabase import — keep this module dependency-free so the
 * rules stay trivially testable.
 */

/** Path shapes that must never be signed, regardless of prefix. */
export function isSafeStoragePath(key: string | null | undefined): boolean {
  if (!key) return false;
  if (key.length > 512) return false;
  if (key.includes("..")) return false;
  if (key.startsWith("/")) return false;
  if (key.includes("\\")) return false;
  if (key.includes("\0")) return false;
  return true;
}

/** Legacy S3 rows are stored as "s3::<key>" (see S3_PREFIX in lib/storage.ts). */
const LEGACY_S3_PREFIX = "s3::";

/**
 * Strip the legacy `s3::` marker so the underlying path can be allowlisted.
 * Sign the ORIGINAL key — signStorageUrl's legacy fallback depends on the marker.
 */
export function stripLegacyPrefix(key: string): string {
  return key.startsWith(LEGACY_S3_PREFIX) ? key.slice(LEGACY_S3_PREFIX.length) : key;
}

/**
 * True only when `key` is under one of `allowedPrefixes` and contains no
 * traversal. Prefixes are matched literally — pass them with the trailing
 * slash (e.g. "chat/") so "chatter/" cannot match.
 *
 * Tolerates the legacy `s3::` marker, which does not change which object is
 * reachable and so must not be usable to escape the allowlist.
 */
export function isServableKey(
  key: string | null | undefined,
  allowedPrefixes: readonly string[]
): boolean {
  if (!isSafeStoragePath(key)) return false;
  const candidate = stripLegacyPrefix(key as string);
  if (!isSafeStoragePath(candidate)) return false;
  return allowedPrefixes.some((prefix) => candidate.startsWith(prefix));
}
