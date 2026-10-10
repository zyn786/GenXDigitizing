/**
 * Turnaround → SLA deadline. The single source of truth.
 *
 * This rule previously existed in four places that disagreed:
 *   - app/(portals)/client/new-order/NewOrderWizard.tsx  (big ? 12 : urgent ? 3 : rush ? 6 : 24)
 *   - app/(portals)/client/new-order/QuickOrder.tsx      (byte-identical copy)
 *   - app/api/crm/convert-to-order/route.ts              (ignored big designs entirely → 24h)
 *   - lib/utils.ts  calculateSLADeadline                 (canonical, but dead code —
 *                                                        referenced only by its own test)
 *
 * The values here match `calculateSLADeadline` and its tests, which record the
 * intended behaviour: a big design gets 12h whatever the turnaround speed, and
 * the client wizards' short-circuit happened to agree for the three real cases.
 * `convert-to-order` was the outlier and used to give a Jumbo standard order 24h
 * where every other path gave 12h.
 *
 * Note the rule is deliberately counterintuitive — a big design gets a SHORTER
 * window than standard (12h vs 24h). That is the existing, tested intent; it is
 * preserved here rather than "corrected" without a product decision.
 *
 * Deadline math is pure UTC epoch arithmetic, so it is timezone-independent.
 * It is still computed on the client (from the customer's device clock) on the
 * order-creation paths — moving that server-side is the remaining structural fix.
 */

/** Hours allowed per turnaround, before the big-design override. */
export const TURNAROUND_HOURS = {
  standard: 24,
  rush: 6,
  urgent: 3,
} as const;

/** A big design gets this much time regardless of the turnaround speed. */
export const BIG_DESIGN_HOURS = 12;

/**
 * Order statuses where WE still owe the customer work, so the original deadline
 * still applies. `review` is admin QA — work we owe. Excluded: `approved`
 * (waiting on the customer), `revision` (awaiting triage, and its deadline is
 * reset when a revision is assigned), and the terminal states.
 *
 * shared because the SLA cron and the admin attention panel must agree on what
 * "at risk" means — two definitions of the same window is how an order gets
 * chased in one place and ignored in another.
 */
export const SLA_ACTIVE_STATUSES = ["submitted", "assigned", "in_progress", "review"] as const;

/** At-risk thresholds, in milliseconds before the deadline. */
export const SLA_WARNING_MS = 2 * 60 * 60 * 1000;
export const SLA_URGENT_MS = 30 * 60 * 1000;

export type Turnaround = keyof typeof TURNAROUND_HOURS;

/** Hours allowed for this order. */
export function turnaroundHours(
  turnaround: string | null | undefined,
  isBigDesign?: boolean | null
): number {
  if (isBigDesign) return BIG_DESIGN_HOURS;
  if (turnaround === "urgent") return TURNAROUND_HOURS.urgent;
  if (turnaround === "rush") return TURNAROUND_HOURS.rush;
  return TURNAROUND_HOURS.standard;
}

/**
 * ISO deadline for an order placed now.
 * `now` is injectable so the rule can be tested without clock mocking.
 */
export function computeDeadline(
  turnaround: string | null | undefined,
  isBigDesign?: boolean | null,
  now: number = Date.now()
): string {
  return new Date(now + turnaroundHours(turnaround, isBigDesign) * 3_600_000).toISOString();
}
