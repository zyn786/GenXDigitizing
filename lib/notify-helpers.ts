// @ts-nocheck
/**
 * Notification helpers — unified in-app + push delivery.
 * Use these instead of raw .from("notifications").insert() to also get push.
 */
import { createAdminClient } from "@/lib/supabase/server";

/** Insert in-app notification + trigger web push for specific user(s) */
export async function notifyUser(
  userId: string,
  payload: { type: string; title: string; body: string; action_url?: string }
) {
  const admin = createAdminClient();
  // In-app
  await admin.from("notifications").insert({
    user_id: userId,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    action_url: payload.action_url || null,
  });
  // Push
  const { sendPushToUsers } = await import("@/lib/push-notifications-server");
  await sendPushToUsers([userId], {
    title: payload.title,
    body: payload.body,
    url: payload.action_url || "/",
  });
}

/** Notify all active users with a specific role (admin, client, designer, crm) */
export async function notifyRole(
  role: string,
  payload: { type: string; title: string; body: string; action_url?: string }
) {
  const admin = createAdminClient();
  const { data: users } = await admin.from("users").select("id").eq("role", role).eq("is_active", true);
  if (!users?.length) return;

  const { notifyUsers } = await import("@/lib/notify-server");
  await notifyUsers(users.map((u: any) => u.id), payload);
}
