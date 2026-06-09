// @ts-nocheck
import webpush from "web-push";

function getVapidKeys() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey };
}

/** Send push notification to a single subscription */
async function sendToSubscription(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string; url?: string }
) {
  const keys = getVapidKeys();
  if (!keys) { console.warn("[sendToSubscription] VAPID keys not configured."); return; }

  webpush.setVapidDetails(
    "mailto:hello@genxdigitizing.com",
    keys.publicKey,
    keys.privateKey
  );

  try {
    await webpush.sendNotification(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      JSON.stringify({ ...payload, url: payload.url || "/" })
    );
  } catch (err: any) {
    // 410 = subscription expired/unsubscribed, should be cleaned up
    if (err?.statusCode === 410 || err?.statusCode === 404) {
      return "expired";
    }
    console.error("[sendToSubscription] web-push failed:", err?.statusCode, err?.body || err?.message || err);
  }
}

/** Send push notification to specific user(s) */
export async function sendPushToUsers(
  userIds: string[],
  payload: { title: string; body: string; url?: string }
) {
  const keys = getVapidKeys();
  if (!keys) { console.warn("[sendPushToUsers] VAPID keys not configured."); return; }

  const { createAdminClient } = await import("@/lib/supabase/server");
  const db = createAdminClient();

  const { data: subscriptions } = await db
    .from("user_push_subscriptions")
    .select("endpoint, p256dh, auth")
    .in("user_id", userIds);

  if (!subscriptions?.length) return;

  const expired: string[] = [];
  for (const sub of subscriptions as any[]) {
    const result = await sendToSubscription(sub, payload);
    if (result === "expired") expired.push(sub.endpoint);
  }

  // Clean up expired subscriptions
  if (expired.length) {
    await db.from("user_push_subscriptions").delete().in("endpoint", expired);
  }
}

/** Send push notification to all active admins */
export async function sendPushToAdmins(payload: { title: string; body: string; url?: string }) {
  const keys = getVapidKeys();
  if (!keys) { console.warn("[sendPushToAdmins] VAPID keys not configured."); return; }

  const { createAdminClient } = await import("@/lib/supabase/server");
  const db = createAdminClient();

  const { data: admins } = await db.from("users").select("id").eq("role", "admin").eq("is_active", true);
  if (!admins?.length) return;

  const adminIds = admins.map((a: any) => a.id);
  await sendPushToUsers(adminIds, payload);
}
