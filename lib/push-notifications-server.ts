import webpush from "web-push";

/**
 * Server-side web push.
 *
 * These functions used to `return` early with a console.warn when the VAPID keys
 * were absent — so a deployment with no push credentials looked exactly like a
 * deployment where nobody had subscribed. 28 push subscriptions exist in the
 * database and, with no keys configured, every one of them received nothing and
 * nothing anywhere said so.
 *
 * They now report whether push was actually available, and the caller records
 * it. Delivery is still best-effort — push must never fail the action that
 * triggered it — but "not configured" is now a fact the system knows.
 */

export interface PushResult {
  /** False when VAPID credentials are missing — push is disabled entirely. */
  configured: boolean;
  /** Subscriptions found for the recipients. */
  subscriptions: number;
  sent: number;
  failed: number;
  expiredCleanedUp: number;
}

const EMPTY: PushResult = {
  configured: false,
  subscriptions: 0,
  sent: 0,
  failed: 0,
  expiredCleanedUp: 0,
};

function getVapidKeys() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey };
}

/** Send to a single subscription. Returns the outcome rather than void. */
async function sendToSubscription(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string; url?: string }
): Promise<"sent" | "expired" | "failed"> {
  const keys = getVapidKeys();
  if (!keys) return "failed";

  webpush.setVapidDetails("mailto:order@genxdigitizing.com", keys.publicKey, keys.privateKey);

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify({ ...payload, url: payload.url || "/" })
    );
    return "sent";
  } catch (err: any) {
    // 410 = subscription expired/unsubscribed; 404 = no longer registered.
    if (err?.statusCode === 410 || err?.statusCode === 404) return "expired";
    console.error(
      "[sendToSubscription] web-push failed:",
      err?.statusCode,
      err?.body || err?.message || err
    );
    return "failed";
  }
}

/** Send a push notification to specific users. Always reports what happened. */
export async function sendPushToUsers(
  userIds: string[],
  payload: { title: string; body: string; url?: string }
): Promise<PushResult> {
  const keys = getVapidKeys();
  if (!keys) {
    console.error(
      "[sendPushToUsers] VAPID keys not configured — push is disabled. " +
        "Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY."
    );
    return EMPTY;
  }

  const result: PushResult = { ...EMPTY, configured: true };

  try {
    const { createAdminClient } = await import("@/lib/supabase/server");
    const db = createAdminClient();

    const { data: subscriptions } = await db
      .from("user_push_subscriptions")
      .select("endpoint, p256dh, auth")
      .in("user_id", userIds ?? []);

    if (!subscriptions?.length) return result;
    result.subscriptions = subscriptions.length;

    const expired: string[] = [];
    for (const sub of subscriptions as any[]) {
      const outcome = await sendToSubscription(sub, payload);
      if (outcome === "sent") result.sent++;
      else if (outcome === "expired") expired.push(sub.endpoint);
      else result.failed++;
    }

    // Clean up expired subscriptions
    if (expired.length) {
      await db.from("user_push_subscriptions").delete().in("endpoint", expired);
      result.expiredCleanedUp = expired.length;
    }

    return result;
  } catch (err: any) {
    console.error("[sendPushToUsers]", err?.message ?? err);
    result.failed++;
    return result;
  }
}

/** Send a push notification to all active admins. */
export async function sendPushToAdmins(payload: {
  title: string;
  body: string;
  url?: string;
}): Promise<PushResult> {
  const keys = getVapidKeys();
  if (!keys) {
    console.error("[sendPushToAdmins] VAPID keys not configured — push is disabled.");
    return EMPTY;
  }

  const { createAdminClient } = await import("@/lib/supabase/server");
  const db = createAdminClient();

  const { data: admins } = await db
    .from("users")
    .select("id")
    .eq("role", "admin")
    .eq("is_active", true);
  if (!admins?.length) return { ...EMPTY, configured: true };

  return sendPushToUsers(
    admins.map((a: any) => a.id),
    payload
  );
}
