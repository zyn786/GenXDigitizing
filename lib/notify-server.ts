// @ts-nocheck
/**
 * Server-only notification delivery — the single implementation.
 *
 * Import ONLY from API routes / server components, never from a client component.
 *
 * Previously there were two, with different failure behaviour: this one wrapped
 * everything in a try/catch that only called console.error, while
 * `lib/notify-helpers.ts` had no try/catch at all. So the same failure either
 * vanished or rejected into the caller depending on which helper a route
 * happened to import — and nothing recorded that a notification was ever lost.
 *
 * Every path now goes through `notifyUsers`, which:
 *   · resolves recipients and drops inactive accounts (by-id callers used to
 *     notify deactivated users; only the role lookup filtered on is_active),
 *   · writes the in-app rows,
 *   · attempts push,
 *   · and records any failure so it is visible rather than inferred.
 *
 * Delivery is best-effort by design — a failed notification must never fail the
 * business action that triggered it — but "best-effort" now means "recorded",
 * not "silently dropped".
 */

import { createAdminClient } from "@/lib/supabase/server";
import { recordNotificationFailure } from "@/lib/notify-log";

export interface NotifyPayload {
  type: string;
  title: string;
  body: string;
  action_url?: string;
}

export interface NotifyResult {
  /** Recipients that were active and had a notification row written. */
  delivered: number;
  /** Recipients skipped because the account is inactive or missing. */
  skipped: number;
  pushAttempted: boolean;
  error?: string;
}

/**
 * Notify specific users. Returns what actually happened instead of nothing —
 * callers that care can act on it, callers that don't are unaffected.
 */
export async function notifyUsers(
  userIds: string[],
  payload: NotifyPayload
): Promise<NotifyResult> {
  const result: NotifyResult = { delivered: 0, skipped: 0, pushAttempted: false };

  try {
    const unique = Array.from(new Set((userIds ?? []).filter(Boolean)));
    if (!unique.length) return result;

    const db = createAdminClient();

    // Resolve who is actually allowed to receive this. A deactivated account
    // should not accumulate notifications nobody will read.
    const { data: recipients, error: lookupErr } = await db
      .from("users")
      .select("id, is_active")
      .in("id", unique);

    if (lookupErr) throw lookupErr;

    const active = (recipients ?? [])
      .filter((u: any) => u.is_active !== false)
      .map((u: any) => u.id);
    result.skipped = unique.length - active.length;

    if (!active.length) return result;

    const { error: insertErr } = await db.from("notifications").insert(
      active.map((uid: string) => ({
        user_id: uid,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        action_url: payload.action_url || null,
      })) as any
    );

    if (insertErr) throw insertErr;
    result.delivered = active.length;

    // Push is a separate channel with its own failure modes — a push problem
    // must not undo the in-app rows that already landed.
    try {
      const { sendPushToUsers } = await import("@/lib/push-notifications-server");
      result.pushAttempted = true;
      const push = await sendPushToUsers(active, {
        title: payload.title,
        body: payload.body,
        url: payload.action_url || "/",
      });

      // The push layer reports "not configured" rather than throwing, so a
      // deployment with no VAPID keys looks identical to one where everyone is
      // simply subscribed. Record it.
      if (push && push.configured === false) {
        result.pushAttempted = false;
        await recordNotificationFailure({
          channel: "push",
          reason: "VAPID keys not configured — push is disabled for every recipient",
          title: payload.title,
          recipientCount: active.length,
        });
      }
    } catch (pushErr: any) {
      await recordNotificationFailure({
        channel: "push",
        reason: pushErr?.message ?? String(pushErr),
        title: payload.title,
        recipientCount: active.length,
      });
    }

    return result;
  } catch (err: any) {
    const reason = err?.message ?? String(err);
    console.error("[notifyUsers]", reason);
    await recordNotificationFailure({
      channel: "in_app",
      reason,
      title: payload.title,
      recipientCount: userIds?.length ?? 0,
    });
    result.error = reason;
    return result;
  }
}

/** Notify one user. */
export async function notifyUser(userId: string, payload: NotifyPayload): Promise<NotifyResult> {
  return notifyUsers([userId], payload);
}

/** Notify every active user holding a role (admin, client, designer, crm). */
export async function notifyRole(role: string, payload: NotifyPayload): Promise<NotifyResult> {
  try {
    const db = createAdminClient();
    const { data: users, error } = await db
      .from("users")
      .select("id")
      .eq("role", role)
      .eq("is_active", true);

    if (error) throw error;
    if (!users?.length) return { delivered: 0, skipped: 0, pushAttempted: false };

    return notifyUsers(
      users.map((u: any) => u.id),
      payload
    );
  } catch (err: any) {
    const reason = err?.message ?? String(err);
    console.error("[notifyRole]", role, reason);
    await recordNotificationFailure({
      channel: "in_app",
      reason: `role lookup failed: ${reason}`,
      title: payload.title,
      recipientCount: 0,
    });
    return { delivered: 0, skipped: 0, pushAttempted: false, error: reason };
  }
}
