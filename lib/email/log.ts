import { createAdminClient } from "@/lib/supabase/server";

/**
 * Record a failed outbound send.
 *
 * Sent mail is logged to `sent_emails` — but only on success (the insert sits
 * after the early return on error). A failed send previously left nothing but a
 * console.error line, so a bounced order confirmation was indistinguishable from
 * a delivered one and the in-app record showed no trace of it at all.
 *
 * Failures go to a separate table rather than `sent_emails` so they cannot
 * pollute the admin email UI, which reads `sent_emails` to build conversations.
 *
 * Never throws: logging must not break the caller's own error handling.
 */
export async function logEmailFailure(params: {
  to: string | string[];
  from: string;
  subject: string;
  error: unknown;
  attempts?: number;
}): Promise<void> {
  try {
    const message =
      params.error instanceof Error
        ? params.error.message
        : typeof params.error === "string"
          ? params.error
          : JSON.stringify(params.error ?? "unknown");

    // The Supabase types in this repo are an ungenerated stub (types/supabase.ts),
    // so a table added after it was written needs the same cast the other
    // non-@ts-nocheck call sites use.
    await createAdminClient()
      .from("email_failures")
      .insert({
        to_email: Array.isArray(params.to) ? params.to.join(", ") : params.to,
        from_email: params.from,
        subject: params.subject,
        error: message.slice(0, 2000),
        attempts: params.attempts ?? 1,
      } as any);
  } catch (err) {
    // Most likely the migration has not been applied yet — degrade quietly
    // rather than masking the original send failure.
    console.error("[email] could not record send failure:", err);
  }
}
