/**
 * How long a lead may sit before someone should act.
 *
 * These live in their own module with no imports at all, because two very
 * different consumers need the same numbers:
 *
 *   - lib/supabase/attention.ts  (server) — what the admin panel calls "waiting"
 *   - lib/follow-up.ts           (shared) — when the engine chases
 *
 * follow-up.ts is imported by a client component (the CRM board sets a lead's
 * follow-up date when its stage changes). When it imported these from
 * attention.ts, it pulled that module's `createAdminClient` — and therefore
 * `next/headers` — into the browser bundle, which fails the production build
 * with "You're importing a component that needs next/headers".
 *
 * Constants with no dependencies cannot do that. Keep this file import-free.
 */

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** An open lead with no reply for longer than this is "unanswered". */
export const UNANSWERED_LEAD_MS = 45 * MINUTE;

/** A lead with no movement for this long needs a human nudge. */
export const STALE_LEAD_MS = 3 * DAY;

/** A sent quote with no movement for this long is worth chasing. */
export const QUOTE_CHASE_MS = 2 * DAY;

/** A customer whose last order is older than this is a re-engagement candidate. */
export const INACTIVE_CLIENT_DAYS = 60;

/** Re-exported so a caller computing a window does not redefine the units. */
export const TIMING_UNITS = { MINUTE, HOUR, DAY } as const;
