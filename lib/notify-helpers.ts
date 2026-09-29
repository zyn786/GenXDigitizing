// @ts-nocheck
/**
 * Back-compat shims.
 *
 * These used to be a SECOND implementation of notification delivery, with no
 * try/catch — unlike lib/notify-server.ts, which swallowed everything. The same
 * failure therefore behaved differently depending on which module a route
 * imported, and neither recorded that a notification was lost.
 *
 * They now delegate to the single hardened implementation, so existing imports
 * keep working and every path gets the same behaviour: inactive recipients are
 * dropped, failures are recorded, and the result says what actually happened.
 */
export { notifyUser, notifyUsers, notifyRole } from "@/lib/notify-server";
export type { NotifyPayload, NotifyResult } from "@/lib/notify-server";
