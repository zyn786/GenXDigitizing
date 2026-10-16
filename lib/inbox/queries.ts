// @ts-nocheck
/**
 * The unified inbox read/write layer.
 *
 * `conversations` and `conversation_messages` (migration 057) have been written
 * since the omnichannel work landed — `lib/channels/inbound.ts` records every
 * WhatsApp, Instagram and Facebook message into them — but nothing ever read
 * them. Migration 057's own comment says "The unified inbox reads this table";
 * this is that reader.
 *
 * Every function here takes the caller's session client, never the service-role
 * client. That is deliberate: migration 057 grants `admin` and `crm` access to
 * these three tables through RLS and nobody else, so passing a user-scoped
 * client makes the database enforce the audience rather than trusting this
 * module — or its callers — to remember. `assertInboxStaff` is a second lock on
 * the same door, not the only one.
 */

import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/supabase/get-user";
import type { SimpleUser } from "@/lib/supabase/get-user";
import { recordLeadEvent } from "@/lib/lead-events";

/** Roles migration 057 admits to the inbox tables. */
export const INBOX_ROLES = ["admin", "crm"] as const;

export function isInboxStaff(role: string | undefined | null): boolean {
  return !!role && (INBOX_ROLES as readonly string[]).includes(role);
}

export class NotInboxStaffError extends Error {
  constructor() {
    super("Not authorised for the inbox");
    this.name = "NotInboxStaffError";
  }
}

/**
 * The current user, having proved they are inbox staff.
 *
 * `getAdminUser()` is misnamed — it returns ANY authenticated user with a
 * profile, including customers. It is not a gate, so this checks the role
 * explicitly rather than inheriting a false sense of safety from the name.
 */
export async function assertInboxStaff(): Promise<SimpleUser> {
  const user = await getAdminUser();
  if (!isInboxStaff(user.role)) throw new NotInboxStaffError();
  return user;
}

export type ConversationStatus = "open" | "snoozed" | "closed";

export interface InboxContact {
  id: string;
  displayName: string | null;
  email: string | null;
  externalId: string;
  leadId: string | null;
  lastSeenAt: string | null;
}

export interface InboxThread {
  id: string;
  channel: string;
  subject: string | null;
  status: ConversationStatus;
  unreadCount: number;
  lastMessageAt: string | null;
  createdAt: string;
  contact: InboxContact | null;
  /** Staff owner. Always null until migration 063 is applied. */
  assignedTo: string | null;
  /** Last message body, trimmed for the list. Null when the thread is empty. */
  preview: string | null;
  previewDirection: "inbound" | "outbound" | null;
}

/**
 * Assignments for a set of threads, or an empty map when the column is absent.
 *
 * Fetched separately from the thread query on purpose: naming `assigned_to` in
 * the main select would make the whole inbox fail on a database that has not
 * had migration 063 applied. A failure here degrades to "nobody is assigned",
 * which is also the correct default.
 */
async function fetchAssignments(ids: string[]): Promise<Record<string, string | null>> {
  if (ids.length === 0) return {};
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("conversations")
      .select("id, assigned_to")
      .in("id", ids);
    if (error) return {};
    const out: Record<string, string | null> = {};
    for (const row of data ?? []) out[row.id] = row.assigned_to ?? null;
    return out;
  } catch {
    return {};
  }
}

export interface InboxMessage {
  id: string;
  direction: "inbound" | "outbound";
  body: string | null;
  attachments: unknown;
  provider: string | null;
  sentBy: string | null;
  externalId: string | null;
  createdAt: string;
}

export interface InboxNote {
  id: string;
  body: string;
  authorId: string | null;
  createdAt: string;
}

export interface InboxStaff {
  id: string;
  fullName: string | null;
  email: string;
  role: string;
}

export interface InboxCapabilities {
  /** conversations.assigned_to exists (migration 063). */
  assignment: boolean;
  /** conversation_notes exists (migration 063). */
  notes: boolean;
}

export interface InboxFilters {
  channel?: string;
  status?: string;
  unreadOnly?: boolean;
  search?: string;
  limit?: number;
}

/**
 * Which optional parts of the inbox the database can actually support.
 *
 * Migration 063 is additive and may not be applied yet. Rather than issue a
 * query naming a column or table that does not exist — which PostgREST answers
 * with an error that would take the entire inbox down — the app asks first and
 * hides what is unavailable. The inbox works either way; it just does less.
 *
 * Checked once per request alongside the real query rather than cached, so
 * applying the migration starts the features without a redeploy.
 */
export async function inboxCapabilities(): Promise<InboxCapabilities> {
  const supabase = createClient();

  /**
   * True when a select naming this column succeeds.
   *
   * The check is on the RESULT, not on a thrown error, and that is the whole
   * subtlety: postgrest-js resolves with `{ error }` for a missing column —
   * it does not reject. Written as `.then(() => true, () => false)` this probe
   * reports `true` for a column that does not exist, the inbox renders the note
   * composer, and the first `listNotes` call 500s the thread view — the exact
   * failure the probe exists to prevent.
   *
   * A row-level-security refusal is not an error either: it comes back as zero
   * rows. That is fine here, because this asks whether the SCHEMA supports the
   * feature, not whether the caller may use it — `assertInboxStaff` and RLS
   * settle that separately.
   */
  const supports = async (table: string, column: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from(table).select(column).limit(1);
      return !error;
    } catch {
      return false; // network or client fault: assume the feature is absent
    }
  };

  const [assignment, notes] = await Promise.all([
    supports("conversations", "assigned_to"),
    supports("conversation_notes", "id"),
  ]);

  return { assignment, notes };
}

/** Staff who can own a conversation: the roles RLS admits to these tables. */
export async function listStaff(): Promise<InboxStaff[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, role")
    .in("role", [...INBOX_ROLES])
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((u: any) => ({
    id: u.id,
    fullName: u.full_name,
    email: u.email,
    role: u.role,
  }));
}

export async function assignThread(
  conversationId: string,
  assigneeId: string | null
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("conversations")
    .update({ assigned_to: assigneeId })
    .eq("id", conversationId);
  if (error) throw error;
}

export async function listNotes(conversationId: string): Promise<InboxNote[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("conversation_notes")
    .select("id, body, author_id, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((n: any) => ({
    id: n.id,
    body: n.body,
    authorId: n.author_id,
    createdAt: n.created_at,
  }));
}

/**
 * Add a staff note. Notes live in their own table, never in
 * `conversation_messages`: a note is not sent, not counted as a message, and
 * must never appear in anything that reports what the customer was told.
 */
export async function addNote(
  conversationId: string,
  body: string,
  authorId: string
): Promise<InboxNote> {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("A note cannot be empty");

  const supabase = createClient();
  const { data, error } = await supabase
    .from("conversation_notes")
    .insert({ conversation_id: conversationId, body: trimmed, author_id: authorId })
    .select("id, body, author_id, created_at")
    .single();

  if (error) throw error;
  return {
    id: data.id,
    body: data.body,
    authorId: data.author_id,
    createdAt: data.created_at,
  };
}

export interface ReplyTarget {
  conversationId: string;
  channel: string;
  /** The channel's own identifier for this contact — a phone number for WhatsApp. */
  externalId: string | null;
  /** The customer's most recent inbound message, which the reply window is measured from. */
  lastInboundAt: string | null;
  /** The lead this conversation belongs to, for the timeline event. Null if unlinked. */
  leadId: string | null;
  /** How to refer to the customer in a timeline entry. */
  displayName: string | null;
}

/**
 * What a reply would be sent to.
 *
 * Separate from `getThread` because the reply path needs exactly three things
 * and must not depend on the message list loading: which channel, which
 * address, and when the customer last wrote. `lastInboundAt` is read from the
 * messages rather than from `conversations.last_message_at`, which an outbound
 * message also bumps — measuring the window from that would let staff keep a
 * window open by replying into it.
 */
export async function getReplyTarget(conversationId: string): Promise<ReplyTarget | null> {
  const supabase = createClient();

  const { data: row, error } = await supabase
    .from("conversations")
    .select("id, channel, contact:contact_id ( external_id, lead_id, display_name )")
    .eq("id", conversationId)
    .maybeSingle();

  if (error) throw error;
  if (!row) return null;

  const { data: lastInbound, error: inboundErr } = await supabase
    .from("conversation_messages")
    .select("created_at")
    .eq("conversation_id", conversationId)
    .eq("direction", "inbound")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (inboundErr) throw inboundErr;

  const contact = one<any>(row.contact);

  return {
    conversationId: row.id,
    channel: row.channel,
    externalId: contact?.external_id ?? null,
    lastInboundAt: lastInbound?.created_at ?? null,
    leadId: contact?.lead_id ?? null,
    displayName: contact?.display_name ?? null,
  };
}

/**
 * Put a sent reply on the lead's timeline.
 *
 * Without this the timeline shows every message the customer sent and none of
 * the answers, which reads as an unanswered enquiry — the exact impression the
 * `chat_reply` event exists to prevent, pointed the other way.
 *
 * Best-effort by design, matching `recordLeadEvent`'s contract: the reply has
 * already reached the customer by the time this runs, so a failure here is
 * logged and swallowed rather than reported as a failed send.
 */
export async function recordReplySentEvent(input: {
  leadId: string;
  channel: string;
  body: string;
  actorId: string | null;
  actorLabel: string | null;
  conversationId: string;
}): Promise<{ ok: boolean; error?: string }> {
  return recordLeadEvent(createClient(), {
    leadId: input.leadId,
    type: "reply_sent",
    actorId: input.actorId,
    actorLabel: input.actorLabel,
    summary: `${input.channel} reply: "${input.body.slice(0, 80)}"`,
    metadata: { channel: input.channel, conversationId: input.conversationId },
  });
}

/**
 * Store a message we sent.
 *
 * Called AFTER the provider accepts it, never before: a row here means the
 * message went out, so writing first would show staff a reply the customer
 * never received. The provider's message id is stored as `external_id`, which
 * the unique index makes a no-op if this is somehow called twice.
 *
 * `unread_count` is deliberately untouched — we already know what we said.
 */
export async function recordOutbound(
  conversationId: string,
  message: {
    body: string;
    provider: string;
    externalId: string | null;
    sentBy: string | null;
  }
): Promise<InboxMessage> {
  const supabase = createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("conversation_messages")
    .insert({
      conversation_id: conversationId,
      direction: "outbound",
      body: message.body,
      provider: message.provider,
      external_id: message.externalId,
      sent_by: message.sentBy,
      created_at: now,
    })
    .select("id, direction, body, attachments, provider, sent_by, external_id, created_at")
    .single();

  if (error) throw error;

  await supabase.from("conversations").update({ last_message_at: now }).eq("id", conversationId);

  return {
    id: data.id,
    direction: data.direction,
    body: data.body,
    attachments: data.attachments,
    provider: data.provider,
    sentBy: data.sent_by,
    externalId: data.external_id,
    createdAt: data.created_at,
  };
}

/** PostgREST returns embedded to-one relations as an object or a 1-element array. */
function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function previewOf(body: string | null | undefined, limit = 140): string | null {
  if (!body) return null;
  const flat = body.replace(/\s+/g, " ").trim();
  if (!flat) return null;
  return flat.length > limit ? `${flat.slice(0, limit - 1)}…` : flat;
}

/**
 * Threads for the inbox list, newest activity first.
 *
 * Two round trips rather than one nested select: PostgREST can embed the last
 * message per conversation, but only with per-foreign-table ordering and limits
 * that are easy to get subtly wrong. Fetching the previews separately is
 * predictable and the second query is bounded by the first.
 */
export async function listThreads(filters: InboxFilters = {}): Promise<InboxThread[]> {
  const supabase = createClient();
  const limit = Math.min(Math.max(filters.limit ?? 50, 1), 200);

  let query = supabase
    .from("conversations")
    .select(
      `id, channel, subject, status, unread_count, last_message_at, created_at,
       contact:contact_id ( id, display_name, email, external_id, lead_id, last_seen_at )`
    )
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (filters.channel && filters.channel !== "all") query = query.eq("channel", filters.channel);
  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
  // Threads with no activity yet have last_message_at = null and are not unread.
  if (filters.unreadOnly) query = query.gt("unread_count", 0);

  const { data: rows, error } = await query;
  if (error) throw error;

  const threads: InboxThread[] = (rows ?? []).map((row: any) => {
    const contact = one<any>(row.contact);
    return {
      id: row.id,
      channel: row.channel,
      subject: row.subject,
      status: row.status,
      unreadCount: row.unread_count ?? 0,
      lastMessageAt: row.last_message_at,
      createdAt: row.created_at,
      contact: contact
        ? {
            id: contact.id,
            displayName: contact.display_name,
            email: contact.email,
            externalId: contact.external_id,
            leadId: contact.lead_id,
            lastSeenAt: contact.last_seen_at,
          }
        : null,
      assignedTo: null,
      preview: null,
      previewDirection: null,
    };
  });

  if (threads.length === 0) return threads;

  const assignments = await fetchAssignments(threads.map((t) => t.id));
  for (const thread of threads) thread.assignedTo = assignments[thread.id] ?? null;

  const { data: msgs } = await supabase
    .from("conversation_messages")
    .select("conversation_id, body, direction, created_at")
    .in(
      "conversation_id",
      threads.map((t) => t.id)
    )
    .order("created_at", { ascending: false });

  // Ordered newest-first, so the first row seen for a thread is its latest.
  const latest = new Map<string, { body: string | null; direction: "inbound" | "outbound" }>();
  for (const m of msgs ?? []) {
    if (!latest.has(m.conversation_id)) {
      latest.set(m.conversation_id, { body: m.body, direction: m.direction });
    }
  }
  for (const thread of threads) {
    const hit = latest.get(thread.id);
    if (hit) {
      thread.preview = previewOf(hit.body);
      thread.previewDirection = hit.direction;
    }
  }

  // Search runs over the preview rather than the whole thread: the list has
  // already been fetched, and a database-side full-text search across message
  // bodies is a different query shape that would ignore the limit above.
  const needle = filters.search?.trim().toLowerCase();
  if (!needle) return threads;
  return threads.filter((t) => {
    const hay = [
      t.contact?.displayName,
      t.contact?.email,
      t.contact?.externalId,
      t.subject,
      t.preview,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(needle);
  });
}

export interface InboxThreadDetail {
  thread: InboxThread;
  messages: InboxMessage[];
}

export async function getThread(conversationId: string): Promise<InboxThreadDetail | null> {
  const supabase = createClient();

  const { data: row, error } = await supabase
    .from("conversations")
    .select(
      `id, channel, subject, status, unread_count, last_message_at, created_at,
       contact:contact_id ( id, display_name, email, external_id, lead_id, last_seen_at )`
    )
    .eq("id", conversationId)
    .maybeSingle();

  if (error) throw error;
  if (!row) return null;

  const contact = one<any>(row.contact);

  const { data: msgs, error: msgErr } = await supabase
    .from("conversation_messages")
    .select("id, direction, body, attachments, provider, sent_by, external_id, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(500);

  if (msgErr) throw msgErr;

  const messages: InboxMessage[] = (msgs ?? []).map((m: any) => ({
    id: m.id,
    direction: m.direction,
    body: m.body,
    attachments: m.attachments,
    provider: m.provider,
    sentBy: m.sent_by,
    externalId: m.external_id,
    createdAt: m.created_at,
  }));

  return {
    thread: {
      id: row.id,
      channel: row.channel,
      subject: row.subject,
      status: row.status,
      unreadCount: row.unread_count ?? 0,
      lastMessageAt: row.last_message_at,
      createdAt: row.created_at,
      contact: contact
        ? {
            id: contact.id,
            displayName: contact.display_name,
            email: contact.email,
            externalId: contact.external_id,
            leadId: contact.lead_id,
            lastSeenAt: contact.last_seen_at,
          }
        : null,
      assignedTo: (await fetchAssignments([row.id]))[row.id] ?? null,
      preview: messages.length ? previewOf(messages[messages.length - 1].body) : null,
      previewDirection: messages.length ? messages[messages.length - 1].direction : null,
    },
    messages,
  };
}

/**
 * Clear the unread badge.
 *
 * Guarded on `unread_count > 0` so opening a thread that is already read is a
 * no-op rather than a write — the inbox calls this every time a thread is
 * opened, and an unconditional UPDATE would touch `conversations` on every
 * click.
 */
export async function markThreadRead(conversationId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("conversations")
    .update({ unread_count: 0 })
    .eq("id", conversationId)
    .gt("unread_count", 0);
  if (error) throw error;
}

export async function setThreadStatus(
  conversationId: string,
  status: ConversationStatus
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("conversations")
    .update({ status })
    .eq("id", conversationId);
  if (error) throw error;
}

/** Unread totals per channel, for the filter chips. */
export async function unreadByChannel(): Promise<Record<string, number>> {
  const supabase = createClient();
  const { data, error } = await supabase.from("conversations").select("channel, unread_count");
  if (error) throw error;

  const out: Record<string, number> = {};
  for (const row of data ?? []) {
    out[row.channel] = (out[row.channel] ?? 0) + (row.unread_count ?? 0);
  }
  return out;
}
