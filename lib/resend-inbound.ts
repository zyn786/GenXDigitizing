// @ts-nocheck
/**
 * Resend inbound (received) email helpers.
 *
 * Shared by the `email.received` webhook (app/api/admin/email-inbound) and the
 * on-demand importer (app/api/admin/email/sync) so the two can't drift.
 *
 * Resend webhooks carry metadata only — no body, no headers, no attachments.
 * The body comes from `GET /emails/receiving/{id}`, which is why every path
 * here that stores a message also fetches it.
 */

import { resolveThreadId, normalizeMessageId } from "@/lib/email-threads";
import { isMissingColumn } from "@/lib/db-errors";

export const RESEND_API = "https://api.resend.com";

/** Pull the display name out of a `From` header like `Jane Doe <jane@x.com>`. */
export function parseSenderName(fromHeader: string | null | undefined): string | null {
  if (!fromHeader) return null;
  var m = /^\s*"?([^"<]*?)"?\s*<[^>]+>\s*$/.exec(fromHeader);
  var name = m && m[1] ? m[1].trim() : "";
  return name || null;
}

/** Read a header case-insensitively — Resend lowercases keys, but not always. */
export function headerValue(headers: any, name: string): string | null {
  if (!headers) return null;
  var wanted = name.toLowerCase();
  var keys = Object.keys(headers);
  for (var i = 0; i < keys.length; i++) {
    if (keys[i].toLowerCase() === wanted) {
      var v = headers[keys[i]];
      if (v == null) return null;
      return Array.isArray(v) ? v.join(" ") : String(v);
    }
  }
  return null;
}

function apiKey(): string | null {
  var key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[resend-inbound] RESEND_API_KEY not set — storing metadata only");
    return null;
  }
  return key;
}

/**
 * Fetch a received email's full content.
 * `html_format=cid` avoids the default `data_uri`, which inlines every image as
 * base64 and can reach 100MB — far too large for a text column.
 */
export async function fetchReceivedEmail(emailId: string) {
  var key = apiKey();
  if (!key || !emailId) return null;

  try {
    var res = await fetch(
      RESEND_API + "/emails/receiving/" + encodeURIComponent(emailId) + "?html_format=cid",
      { headers: { Authorization: "Bearer " + key } }
    );
    if (!res.ok) {
      console.error(
        "[resend-inbound] Body fetch failed:",
        res.status,
        (await res.text()).slice(0, 300)
      );
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("[resend-inbound] Body fetch threw:", err);
    return null;
  }
}

/** List received emails, newest first. Returns [] on any failure. */
export async function listReceivedEmails(limit: number = 100) {
  var key = apiKey();
  if (!key) return { emails: [], error: "RESEND_API_KEY is not configured" };

  try {
    var res = await fetch(RESEND_API + "/emails/receiving?limit=" + limit, {
      headers: { Authorization: "Bearer " + key },
    });
    if (!res.ok) {
      var detail = (await res.text()).slice(0, 300);
      console.error("[resend-inbound] List failed:", res.status, detail);
      return { emails: [], error: "Resend API returned " + res.status };
    }
    var json = await res.json();
    return { emails: json.data || [], error: null };
  } catch (err: any) {
    console.error("[resend-inbound] List threw:", err);
    return { emails: [], error: err?.message || "Request failed" };
  }
}

/**
 * Store one received email, then enrich it with the body.
 *
 * The metadata row is written first so a message is never lost to a failed
 * body fetch. Upsert on `resend_id` keeps webhook redeliveries and sync runs
 * idempotent (requires the unique index from migration 037).
 *
 * @returns { id, created } — created is false when the message already existed.
 */
export async function importReceivedEmail(supabase: any, meta: any) {
  var emailId = meta.email_id || meta.id || null;

  var attachments = Array.isArray(meta.attachments) ? meta.attachments : [];
  var attachmentMeta =
    attachments.length > 0
      ? JSON.stringify(
          attachments.map(function (a: any) {
            return { id: a.id, filename: a.filename, content_type: a.content_type, size: a.size };
          })
        )
      : null;

  var fromEmail = meta.from || "";
  var toEmail = (Array.isArray(meta.to) ? meta.to.join(", ") : meta.to) || "";
  var ccEmails = (Array.isArray(meta.cc) ? meta.cc.join(", ") : meta.cc) || null;

  // Already imported? Bodies are written once, but always refresh the arrival
  // time — rows imported before this was set are stamped with the import time
  // instead of when the mail actually arrived, and a re-sync corrects them.
  if (emailId) {
    var existing = await supabase
      .from("received_emails")
      .select("id, body_html, body_text")
      .eq("resend_id", emailId)
      .maybeSingle();
    if (existing.error) {
      return { error: existing.error.message, id: null, created: false };
    }
    if (existing.data) {
      if (meta.created_at) {
        await supabase
          .from("received_emails")
          .update({ received_at: meta.created_at })
          .eq("resend_id", emailId);
      }
      // A re-sync of an already-imported message is also what backfills
      // thread_id for rows stored before threading existed, so enrich runs
      // whenever the body is missing OR the row has no thread yet.
      if (!existing.data.body_html && !existing.data.body_text) {
        await enrich(supabase, emailId, meta);
      } else {
        await ensureThreaded(supabase, emailId, meta);
      }
      return { id: existing.data.id, created: false, error: null };
    }
  }

  // message_id / is_read / sender_name come from migration 037. Until it's
  // applied, fall back to the columns migration 036 created so mail still
  // lands — the panel reports the missing migration separately.
  // `received_at` must come from the message itself — without it the column
  // defaults to now(), so a batch import stamps every row with the import time
  // and the whole inbox reads as if it all arrived at once.
  var row: any = {
    from_email: fromEmail,
    to_email: toEmail,
    cc_emails: ccEmails,
    subject: meta.subject || "(no subject)",
    resend_id: emailId,
    message_id: meta.message_id || null,
    attachments_meta: attachmentMeta,
  };
  if (meta.created_at) row.received_at = meta.created_at;

  var written = await supabase.from("received_emails").insert(row).select("id").maybeSingle();

  if (isMissingColumn(written.error)) {
    console.warn(
      "[resend-inbound] Newer columns missing (migration 037?) — inserting with legacy columns"
    );
    var legacyRow: any = {
      from_email: fromEmail,
      to_email: toEmail,
      cc_emails: ccEmails,
      subject: meta.subject || "(no subject)",
      resend_id: emailId,
      attachments_meta: attachmentMeta,
    };
    if (meta.created_at) legacyRow.received_at = meta.created_at;

    written = await supabase.from("received_emails").insert(legacyRow).select("id").maybeSingle();
  }

  if (written.error) {
    return { error: written.error.message, id: null, created: false };
  }

  var id = written.data?.id || null;
  if (emailId) await enrich(supabase, emailId, meta);

  return { id: id, created: true, error: null };
}

/**
 * Backfill `thread_id` on a message that already has its body.
 * Reads the stored `headers` rather than re-fetching from Resend.
 */
async function ensureThreaded(supabase: any, emailId: string, meta: any) {
  var current = await supabase
    .from("received_emails")
    .select("id, thread_id, message_id, subject, from_email, headers")
    .eq("resend_id", emailId)
    .maybeSingle();

  if (current.error || !current.data) return;
  if (current.data.thread_id) return;

  var headers = {};
  try {
    headers = JSON.parse(current.data.headers || "{}");
  } catch (e) {
    headers = {};
  }

  var threadId = await resolveThreadId(supabase, {
    messageId: normalizeMessageId(current.data.message_id || headerValue(headers, "message-id")),
    inReplyTo: headerValue(headers, "in-reply-to"),
    references: headerValue(headers, "references"),
    subject: current.data.subject || meta?.subject || null,
    counterparty: current.data.from_email || meta?.from || null,
  });

  var res = await supabase
    .from("received_emails")
    .update({ thread_id: threadId })
    .eq("id", current.data.id);
  if (res.error && !isMissingColumn(res.error)) {
    console.error("[resend-inbound] Thread backfill failed:", res.error.message);
  }
}

/** Fetch the body for a stored message and write it onto the row. */
async function enrich(supabase: any, emailId: string, meta?: any) {
  var full = await fetchReceivedEmail(emailId);
  if (!full) return;

  var headers = full.headers || {};
  var messageId = normalizeMessageId(headerValue(headers, "message-id") || full.message_id);
  var inReplyTo = headerValue(headers, "in-reply-to");
  var references = headerValue(headers, "references");

  // Which conversation does this belong to? Header match first, subject +
  // counterparty as the fallback — see lib/email-threads.ts.
  var threadId = await resolveThreadId(supabase, {
    messageId: messageId,
    inReplyTo: inReplyTo,
    references: references,
    subject: full.subject || meta?.subject || null,
    counterparty: (meta?.from ? String(meta.from) : null) || null,
  });

  var update: any = {
    body_html: full.html || null,
    body_text: full.text || null,
    sender_name: parseSenderName(headerValue(headers, "from")),
    headers: full.headers ? JSON.stringify(full.headers) : null,
    thread_id: threadId,
    in_reply_to: inReplyTo,
    references: references,
  };
  if (messageId) update.message_id = messageId;

  var res = await supabase.from("received_emails").update(update).eq("resend_id", emailId);

  // sender_name / message_id / thread_id arrive with migrations 037/038 —
  // retry without them so the body (the part that actually matters) is still
  // stored. The panel reports the missing migration separately.
  if (isMissingColumn(res.error)) {
    var legacy: any = {
      body_html: full.html || null,
      body_text: full.text || null,
      headers: full.headers ? JSON.stringify(full.headers) : null,
    };
    res = await supabase.from("received_emails").update(legacy).eq("resend_id", emailId);
  }

  if (res.error) {
    console.error("[resend-inbound] Body update failed:", res.error.message);
  }
}
