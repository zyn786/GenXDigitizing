// @ts-nocheck
/**
 * Postgres/PostgREST error classification.
 *
 * A missing column surfaces differently depending on where the query runs:
 *   - direct Postgres:  `column "x" does not exist`
 *   - PostgREST schema cache: `Could not find the 'x' column of 'y' in the schema cache`
 *
 * Both mean "this migration hasn't been applied", and code that only matches the
 * first silently skips its fallback path — which is exactly how earlier imports
 * failed with a raw schema-cache error instead of degrading.
 */

/** True when the error is a missing column or table (i.e. an unapplied migration). */
export function isMissingColumn(error: any): boolean {
  if (!error) return false;
  var message = String(error.message || error.details || error || "");
  return /does not exist/i.test(message) || /could not find/i.test(message);
}
