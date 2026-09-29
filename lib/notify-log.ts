/**
 * Record a notification that could not be delivered.
 *
 * The notification layer had no failure record at all: `notifyUsers` wrapped
 * everything in a try/catch that only called console.error, so a failed in-app
 * write or a push with no VAPID keys was indistinguishable from a delivered
 * notification. Nothing could answer "did that alert actually go out?".
 *
 * Failures go to their own table rather than `notifications`, so the inbox UI
 * keeps showing only real notifications.
 *
 * Never throws: logging a failure must not become a second failure.
 */

import { createAdminClient } from "@/lib/supabase/server";

export async function recordNotificationFailure(params: {
  channel: "in_app" | "push" | "email";
  reason: string;
  title: string;
  recipientCount: number;
}): Promise<void> {
  try {
    await createAdminClient()
      .from("notification_failures")
      .insert({
        channel: params.channel,
        reason: params.reason.slice(0, 1000),
        title: params.title.slice(0, 300),
        recipient_count: params.recipientCount,
      } as any);
  } catch (err) {
    // Most likely migration 050 has not been applied — degrade quietly rather
    // than masking the original delivery failure.
    console.error("[notify-log] could not record failure:", err);
  }
}
