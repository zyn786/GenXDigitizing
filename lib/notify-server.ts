// @ts-nocheck
/** Server-only: insert in-app notification AND send push to users (all roles).
 *  Import ONLY from API routes / server components — NOT from client components.
 */
export async function notifyUsers(
  userIds: string[],
  payload: {
    type: string;
    title: string;
    body: string;
    action_url?: string;
  }
) {
  try {
    // In-app notification
    const { createAdminClient } = await import("@/lib/supabase/server");
    const db = createAdminClient();
    await db.from("notifications").insert(
      userIds.map((uid) => ({
        user_id: uid,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        action_url: payload.action_url || null,
      }))
    );

    // Web push notification
    const { sendPushToUsers } = await import("@/lib/push-notifications-server");
    await sendPushToUsers(userIds, {
      title: payload.title,
      body: payload.body,
      url: payload.action_url || "/",
    });
  } catch (err) {
    console.error("[notifyUsers]", err);
  }
}
