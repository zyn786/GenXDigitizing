// @ts-nocheck
/**
 * Gmail-style conversation threading.
 *
 * A thread is identified by RFC message ids. When a message arrives:
 *
 *   1. Its `References` / `In-Reply-To` ids are matched against messages we
 *      already stored (inbound `received_emails.message_id` or our own
 *      outbound `sent_emails.message_id`). A hit adopts that thread. This is
 *      the real path — every genuine reply carries these headers.
 *   2. Otherwise the normalised subject plus the counterparty is matched
 *      against recent mail, including mail we *sent* — that's what groups an
 *      out-of-office reply with the cold email it answers, since the reply
 *      references a Message-ID we never recorded for historical sends.
 *   3. Otherwise the message starts a new thread.
 *
 * Subject matching is a fallback, so it can merge unrelated mail that happens
 * to share a subject with the same person. That trade-off is deliberate.
 */

/** How far back the subject fallback looks. */
export const FALLBACK_WINDOW_DAYS = 30;

/** How many recent messages the subject fallback scans. */
const FALLBACK_SCAN_LIMIT = 300;

/**
 * Leading reply/forward markers, including the ones out-of-office autoresponders
 * use ("Automatic reply:", "Auto-Subreply:", "Out of office:").
 */
const SUBJECT_PREFIX = new RegExp(
  "^\\s*(" +
    "(re|fwd|fw|aw|sv|vs|antw|ref|rif)" +
    "|(automatic\\s+reply|auto[\\s-]?reply|autoreply|automatic\\s+response)" +
    "|(out\\s+of\\s+(the\\s+)?office)" +
    "|(undeliverable|delivery\\s+(status\\s+)?notification|read\\s*:)" +
  ")\\s*(\\[\\d+\\])?\\s*:\\s*",
  "i"
);

/** Strip every leading `Re:` / `Fwd:` / `Automatic reply:` layer, then normalise. */
export function normalizeSubject(subject: string | null | undefined): string {
  if (!subject) return "";
  var s = String(subject);
  // Loop so `Re: Fwd: Re: x` fully unwraps. Bounded to avoid pathological input.
  for (var i = 0; i < 10; i++) {
    var next = s.replace(SUBJECT_PREFIX, "");
    if (next === s) break;
    s = next;
  }
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

/** Pull every `<id@host>` token out of a References / In-Reply-To value. */
export function extractMessageIds(
  references?: string | string[] | null,
  inReplyTo?: string | null
): string[] {
  var ids: string[] = [];

  function collect(value: any) {
    if (!value) return;
    var text = Array.isArray(value) ? value.join(" ") : String(value);
    var matches = text.match(/<[^<>\s]+@[^<>\s]+>/g);
    if (!matches) return;
    for (var i = 0; i < matches.length; i++) {
      if (ids.indexOf(matches[i]) === -1) ids.push(matches[i]);
    }
  }

  collect(references);
  collect(inReplyTo);
  return ids;
}

/** Extract a single message id from a `Message-ID` header value. */
export function normalizeMessageId(value: string | null | undefined): string | null {
  if (!value) return null;
  var ids = extractMessageIds(value, null);
  if (ids.length > 0) return ids[0];
  var trimmed = String(value).trim();
  return trimmed || null;
}

function newThreadId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return "t-" + crypto.randomUUID();
  return "t-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
}

/**
 * Find the thread a message belongs to, creating one if nothing matches.
 *
 * Side effect: when the subject fallback matches a message we *sent*, that row
 * adopts the thread id too, so the original outreach shows up inside the
 * conversation alongside the reply.
 */
export async function resolveThreadId(
  supabase: any,
  msg: {
    messageId?: string | null;
    inReplyTo?: string | null;
    references?: string | string[] | null;
    subject?: string | null;
    /** Address of the other party: sender for inbound, recipient for outbound. */
    counterparty?: string | null;
  }
): Promise<string> {
  var ids = extractMessageIds(msg.references, msg.inReplyTo);

  // ── 1. Header match against anything we already stored ──
  if (ids.length > 0) {
    var inboundHit = await supabase
      .from("received_emails")
      .select("thread_id")
      .in("message_id", ids)
      .not("thread_id", "is", null)
      .limit(1)
      .maybeSingle();
    if (inboundHit?.data?.thread_id) return inboundHit.data.thread_id;

    var sentHit = await supabase
      .from("sent_emails")
      .select("thread_id")
      .in("message_id", ids)
      .not("thread_id", "is", null)
      .limit(1)
      .maybeSingle();
    if (sentHit?.data?.thread_id) return sentHit.data.thread_id;
  }

  // ── 2. Subject + counterparty fallback ──
  var norm = normalizeSubject(msg.subject);
  var counterparty = (msg.counterparty || "").toLowerCase().trim();

  if (norm && counterparty) {
    var since = new Date(Date.now() - FALLBACK_WINDOW_DAYS * 86400000).toISOString();

    var recentInbound = await supabase
      .from("received_emails")
      .select("thread_id, subject, from_email")
      .not("thread_id", "is", null)
      .gte("received_at", since)
      .order("received_at", { ascending: false })
      .limit(FALLBACK_SCAN_LIMIT);

    var inboundMatch = (recentInbound?.data || []).find(function (r: any) {
      return normalizeSubject(r.subject) === norm &&
             (r.from_email || "").toLowerCase().trim() === counterparty;
    });
    if (inboundMatch?.thread_id) return inboundMatch.thread_id;

    // Mail we sent to this party with the same subject — an out-of-office auto
    // reply answers one of these, and those rows predate the threading columns.
    var recentSent = await supabase
      .from("sent_emails")
      .select("id, thread_id, subject, to_email, resend_id")
      .gte("sent_at", since)
      .order("sent_at", { ascending: false })
      .limit(FALLBACK_SCAN_LIMIT);

    var sentMatch = (recentSent?.data || []).find(function (r: any) {
      return normalizeSubject(r.subject) === norm &&
             (r.to_email || "").toLowerCase().trim() === counterparty;
    });

    if (sentMatch) {
      var threadId = sentMatch.thread_id || ("s-" + (sentMatch.resend_id || sentMatch.id));
      if (!sentMatch.thread_id) {
        // Adopt it, so the original message joins the conversation.
        await supabase.from("sent_emails").update({ thread_id: threadId }).eq("id", sentMatch.id);
      }
      return threadId;
    }
  }

  // ── 3. New thread ──
  return normalizeMessageId(msg.messageId) || newThreadId();
}

/** Chronological sort helper — threads read oldest → newest, like Gmail. */
export function byTimeAsc(a: any, b: any): number {
  return new Date(a.at).getTime() - new Date(b.at).getTime();
}
