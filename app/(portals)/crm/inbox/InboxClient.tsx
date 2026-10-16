"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  RefreshCw,
  Inbox as InboxIcon,
  Mail,
  MessageCircle,
  Instagram,
  Facebook,
  ExternalLink,
  AlertCircle,
  StickyNote,
  Plus,
  Send,
} from "lucide-react";

/* ── Types mirroring lib/inbox/queries ─────────────────────── */

interface InboxContact {
  id: string;
  displayName: string | null;
  email: string | null;
  externalId: string;
  leadId: string | null;
  lastSeenAt: string | null;
}

interface InboxThread {
  id: string;
  channel: string;
  subject: string | null;
  status: "open" | "snoozed" | "closed";
  unreadCount: number;
  lastMessageAt: string | null;
  createdAt: string;
  contact: InboxContact | null;
  assignedTo: string | null;
  preview: string | null;
  previewDirection: "inbound" | "outbound" | null;
}

interface InboxNote {
  id: string;
  body: string;
  authorId: string | null;
  createdAt: string;
}

interface InboxStaff {
  id: string;
  fullName: string | null;
  email: string;
  role: string;
}

/** What the database can support right now; migration 063 is additive. */
interface InboxCapabilities {
  assignment: boolean;
  notes: boolean;
}

/**
 * Whether this thread can be replied to, decided by the server.
 *
 * Mirrored rather than recomputed: the 24-hour window and the list of channels
 * with a send path are rules about what the provider will accept, and a second
 * copy in the browser would eventually disagree with the one that matters.
 */
interface ReplyContext {
  channel: string;
  allowed: boolean;
  reason?: "unsupported_channel" | "no_inbound" | "window_closed";
  message: string;
  windowClosesAt: string | null;
  maxLength: number;
}

interface InboxMessage {
  id: string;
  direction: "inbound" | "outbound";
  body: string | null;
  attachments: unknown;
  provider: string | null;
  sentBy: string | null;
  externalId: string | null;
  createdAt: string;
}

const CHANNEL_FILTERS = [
  { key: "all", label: "All", icon: InboxIcon },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "facebook", label: "Facebook", icon: Facebook },
  { key: "email", label: "Email", icon: Mail },
] as const;

const CHANNEL_EMOJI: Record<string, string> = {
  whatsapp: "💬",
  instagram: "📸",
  facebook: "👍",
  email: "✉️",
  website: "🌐",
};

function relative(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function timeOf(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function displayName(t: InboxThread): string {
  return t.contact?.displayName || t.contact?.email || t.contact?.externalId || "Unknown contact";
}

/**
 * A staff member's label, or null when we cannot name them.
 *
 * Null rather than a placeholder id: an assignment to a deactivated account
 * should read as "Unknown", not as a uuid the reader has to interpret.
 */
function staffLabel(list: InboxStaff[], id: string | null): string | null {
  if (!id) return null;
  const hit = list.find((s) => s.id === id);
  return hit ? hit.fullName || hit.email : null;
}

const STATUS_STYLE: Record<string, string> = {
  open: "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/25",
  snoozed: "bg-[#F59E0B]/10 text-[#92400E] border-[#F59E0B]/25",
  closed: "bg-[var(--elevated)] text-[var(--txt3)] border-[var(--border2)]",
};

export function InboxClient({ currentUserId }: { currentUserId: string }) {
  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [channel, setChannel] = useState<string>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [capabilities, setCapabilities] = useState<InboxCapabilities>({
    assignment: false,
    notes: false,
  });
  const [staff, setStaff] = useState<InboxStaff[]>([]);
  const [notes, setNotes] = useState<InboxNote[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  const [reply, setReply] = useState<ReplyContext | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replyWarning, setReplyWarning] = useState<string | null>(null);

  const searchRef = useRef(search);
  searchRef.current = search;

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (channel !== "all") params.set("channel", channel);
      if (unreadOnly) params.set("unread", "true");
      if (searchRef.current.trim()) params.set("q", searchRef.current.trim());

      const res = await fetch(`/api/admin/inbox?${params}`, { cache: "no-store" });
      if (!res.ok)
        throw new Error(res.status === 403 ? "Not authorised" : "Could not load the inbox");
      const data = await res.json();
      setThreads(data.threads ?? []);
      if (data.capabilities) setCapabilities(data.capabilities);
      setStaff(data.staff ?? []);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Could not load the inbox");
    } finally {
      setLoading(false);
    }
  }, [channel, unreadOnly]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // Refresh on an interval so a message that arrives while the tab is open
  // appears without a manual reload. Deliberately slow — this is a staff
  // dashboard, not a chat client, and 30s is enough to notice new work.
  useEffect(() => {
    const id = window.setInterval(load, 30_000);
    return () => window.clearInterval(id);
  }, [load]);

  const openThread = useCallback(async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const res = await fetch(`/api/admin/inbox/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load the conversation");
      const data = await res.json();
      setMessages(data.messages ?? []);
      setNotes(data.notes ?? []);
      setNoteDraft("");
      setNoteError(null);
      setReply(data.reply ?? null);
      setReplyDraft("");
      setReplyError(null);
      setReplyWarning(null);
      if (data.capabilities) setCapabilities(data.capabilities);

      // The list may have been fetched before this thread was assigned
      // elsewhere; the detail is fresher, so it wins.
      if (data.thread) {
        const assignedTo: string | null = data.thread.assignedTo ?? null;
        setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, assignedTo } : t)));
      }

      // Clear the badge in the background; the list reflects it on next load.
      fetch(`/api/admin/inbox/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      })
        .then(() =>
          setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, unreadCount: 0 } : t)))
        )
        .catch(() => {});
    } catch (e: any) {
      setDetailError(e.message || "Could not load the conversation");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const setStatus = useCallback(
    async (id: string, status: InboxThread["status"]) => {
      const previous = threads;
      setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
      try {
        const res = await fetch(`/api/admin/inbox/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error("failed");
      } catch {
        setThreads(previous); // put it back rather than showing a change that did not happen
      }
    },
    [threads]
  );

  const assignTo = useCallback(
    async (id: string, assignedTo: string | null) => {
      const previous = threads;
      setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, assignedTo } : t)));
      try {
        const res = await fetch(`/api/admin/inbox/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignedTo }),
        });
        if (!res.ok) throw new Error("failed");
      } catch {
        setThreads(previous); // put it back rather than showing a change that did not happen
      }
    },
    [threads]
  );

  /**
   * Send a reply to the customer.
   *
   * On success the stored message is appended to the thread. When the server
   * reports the reply went out but could not be recorded, that is shown as a
   * warning and nothing is appended — the history genuinely does not contain
   * it, and inventing a row would make the thread disagree with the database.
   */
  const sendReply = useCallback(
    async (id: string) => {
      const body = replyDraft.trim();
      if (!body || replySending) return;
      setReplySending(true);
      setReplyError(null);
      setReplyWarning(null);
      try {
        const res = await fetch(`/api/admin/inbox/${id}/reply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(data.error || "Could not send the reply");

        if (data.message) setMessages((prev) => [...prev, data.message]);
        if (data.warning) setReplyWarning(data.warning);
        setReplyDraft("");
        if (data.recorded) {
          setThreads((prev) =>
            prev.map((t) =>
              t.id === id ? { ...t, lastMessageAt: new Date().toISOString(), preview: body } : t
            )
          );
        }
      } catch (e: any) {
        setReplyError(e.message || "Could not send the reply");
      } finally {
        setReplySending(false);
      }
    },
    [replyDraft, replySending]
  );

  const addNote = useCallback(
    async (id: string) => {
      const body = noteDraft.trim();
      if (!body || noteSaving) return;
      setNoteSaving(true);
      setNoteError(null);
      try {
        const res = await fetch(`/api/admin/inbox/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Could not save the note");
        if (data.note) setNotes((prev) => [...prev, data.note]);
        setNoteDraft("");
      } catch (e: any) {
        setNoteError(e.message || "Could not save the note");
      } finally {
        setNoteSaving(false);
      }
    },
    [noteDraft, noteSaving]
  );

  const selected = threads.find((t) => t.id === selectedId) ?? null;

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {CHANNEL_FILTERS.map((f) => {
          const active = channel === f.key;
          const Icon = f.icon;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setChannel(f.key)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                active
                  ? "border-[#2563EB] bg-[#2563EB] text-white"
                  : "border-[var(--border2)] bg-[var(--surface)] text-[var(--txt2)] hover:border-[var(--border3)]"
              }`}
            >
              <Icon size={13} />
              {f.label}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setUnreadOnly((v) => !v)}
          aria-pressed={unreadOnly}
          className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
            unreadOnly
              ? "border-[#F97316] bg-[#F97316] text-white"
              : "border-[var(--border2)] bg-[var(--surface)] text-[var(--txt2)] hover:border-[var(--border3)]"
          }`}
        >
          Unread only
        </button>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") load();
          }}
          placeholder="Search name, email or message…"
          aria-label="Search conversations"
          className="min-w-[180px] flex-1 rounded-xl border border-[var(--border2)] bg-[var(--surface)] px-3.5 py-2 text-xs text-[var(--txt)] outline-none placeholder:text-[var(--txt3)] focus:border-[#2563EB] sm:max-w-xs"
        />

        <button
          type="button"
          onClick={() => {
            setLoading(true);
            load();
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border2)] bg-[var(--surface)] px-3.5 py-2 text-xs font-semibold text-[var(--txt2)] transition hover:border-[var(--border3)]"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        {/* ── Thread list ───────────────────────────────── */}
        <section
          aria-label="Conversations"
          className={`overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] ${
            selected ? "hidden lg:block" : ""
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-xs text-[var(--txt3)]">
              <Loader2 size={16} className="animate-spin" /> Loading conversations…
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <AlertCircle size={18} className="text-[#DC2626]" />
              <p className="text-xs text-[var(--txt2)]">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  load();
                }}
                className="text-xs text-[#2563EB] underline"
              >
                Try again
              </button>
            </div>
          ) : threads.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
              <InboxIcon size={20} className="text-[var(--txt3)]" />
              <p className="text-xs font-semibold text-[var(--txt)]">No conversations here</p>
              <p className="max-w-[26ch] text-[11px] leading-relaxed text-[var(--txt3)]">
                {channel !== "all" || unreadOnly
                  ? "Nothing matches these filters. Try All, or clear Unread only."
                  : "Messages from WhatsApp, Instagram and Facebook will appear here as they arrive."}
              </p>
            </div>
          ) : (
            <ul className="max-h-[70vh] divide-y divide-[var(--border)] overflow-y-auto">
              {threads.map((t) => {
                const active = t.id === selectedId;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => openThread(t.id)}
                      aria-current={active ? "true" : undefined}
                      className={`w-full px-4 py-3 text-left transition ${
                        active ? "bg-[var(--elevated)]" : "hover:bg-[var(--elevated)]/60"
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <span aria-hidden="true">{CHANNEL_EMOJI[t.channel] ?? "💬"}</span>
                        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[var(--txt)]">
                          {displayName(t)}
                        </span>
                        {t.unreadCount > 0 && (
                          <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#2563EB] px-1 text-[10px] font-bold text-white">
                            {t.unreadCount}
                          </span>
                        )}
                        <span className="shrink-0 text-[10px] text-[var(--txt3)]">
                          {relative(t.lastMessageAt)}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-[11px] leading-relaxed text-[var(--txt2)]">
                        {t.previewDirection === "outbound" && (
                          <span className="text-[var(--txt3)]">You: </span>
                        )}
                        {t.preview ?? <span className="text-[var(--txt3)]">No messages yet</span>}
                      </p>
                      {/* Ownership at a glance — the whole point of assigning
                          a thread is being able to see who has it. */}
                      {capabilities.assignment && t.assignedTo && (
                        <p className="mt-1 text-[10px] text-[var(--txt3)]">
                          → {staffLabel(staff, t.assignedTo) ?? "Assigned"}
                        </p>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ── Thread detail ─────────────────────────────── */}
        <section
          aria-label="Conversation"
          className={`overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] ${
            selected ? "" : "hidden lg:block"
          }`}
        >
          {!selected ? (
            <div className="flex flex-col items-center gap-2 px-6 py-24 text-center">
              <InboxIcon size={22} className="text-[var(--txt3)]" />
              <p className="text-sm font-semibold text-[var(--txt)]">Pick a conversation</p>
              <p className="max-w-[34ch] text-xs leading-relaxed text-[var(--txt3)]">
                Select a thread to read the full history across every channel.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="text-[11px] text-[#2563EB] underline lg:hidden"
                    >
                      Back
                    </button>
                    <h2 className="truncate text-sm font-bold text-[var(--txt)]">
                      {displayName(selected)}
                    </h2>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_STYLE[selected.status]}`}
                    >
                      {selected.status}
                    </span>
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[var(--txt3)]">
                    <span className="capitalize">{selected.channel}</span>
                    {selected.contact?.email && <span>{selected.contact.email}</span>}
                    {selected.contact?.leadId && (
                      <Link
                        href={`/crm/leads?lead=${selected.contact.leadId}`}
                        className="inline-flex items-center gap-1 text-[#2563EB] hover:underline"
                      >
                        View lead <ExternalLink size={10} />
                      </Link>
                    )}
                  </p>

                  {/* Which placement this thread came through, for context. */}
                  <p className="mt-0.5 text-[10px] text-[var(--txt3)]">
                    Opened {timeOf(selected.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Assignment appears only when migration 063 has been
                      applied; until then the column does not exist and the
                      control would write into nothing. */}
                  {capabilities.assignment ? (
                    <label className="flex items-center gap-2 text-[11px] text-[var(--txt2)]">
                      <span className="sr-only">Assigned to</span>
                      <select
                        value={selected.assignedTo ?? ""}
                        onChange={(e) => assignTo(selected.id, e.target.value || null)}
                        className="max-w-[190px] rounded-lg border border-[var(--border2)] bg-[var(--surface)] px-2.5 py-1.5 text-[11px] text-[var(--txt)] outline-none focus:border-[#2563EB]"
                      >
                        <option value="">Unassigned</option>
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.fullName || s.email}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}

                  <label className="flex items-center gap-2 text-[11px] text-[var(--txt2)]">
                    <span className="sr-only">Status</span>
                    <select
                      value={selected.status}
                      onChange={(e) =>
                        setStatus(selected.id, e.target.value as InboxThread["status"])
                      }
                      className="rounded-lg border border-[var(--border2)] bg-[var(--surface)] px-2.5 py-1.5 text-[11px] text-[var(--txt)] outline-none focus:border-[#2563EB]"
                    >
                      <option value="open">Open</option>
                      <option value="snoozed">Snoozed</option>
                      <option value="closed">Closed</option>
                    </select>
                  </label>
                </div>
              </div>

              {/* Messages */}
              <div className="max-h-[62vh] space-y-3 overflow-y-auto px-4 py-4">
                {detailLoading ? (
                  <div className="flex items-center justify-center gap-2 py-12 text-xs text-[var(--txt3)]">
                    <Loader2 size={15} className="animate-spin" /> Loading history…
                  </div>
                ) : detailError ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-center">
                    <AlertCircle size={17} className="text-[#DC2626]" />
                    <p className="text-xs text-[var(--txt2)]">{detailError}</p>
                    <button
                      type="button"
                      onClick={() => openThread(selected.id)}
                      className="text-xs text-[#2563EB] underline"
                    >
                      Try again
                    </button>
                  </div>
                ) : messages.length === 0 ? (
                  <p className="py-12 text-center text-xs text-[var(--txt3)]">
                    This thread has no messages recorded.
                  </p>
                ) : (
                  messages.map((m) => {
                    const outbound = m.direction === "outbound";
                    return (
                      <div
                        key={m.id}
                        className={outbound ? "flex justify-end" : "flex justify-start"}
                      >
                        <div className="max-w-[85%] sm:max-w-[75%]">
                          <div
                            className={`rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
                              outbound
                                ? "bg-[#2563EB] text-white"
                                : "border border-[var(--border)] bg-[var(--elevated)] text-[var(--txt)]"
                            }`}
                          >
                            {m.body ? (
                              <p className="whitespace-pre-wrap break-words">{m.body}</p>
                            ) : (
                              <p className={outbound ? "text-white/70" : "text-[var(--txt3)]"}>
                                {m.attachments ? "Attachment" : "(no text)"}
                              </p>
                            )}
                          </div>
                          <p
                            className={`mt-1 text-[10px] text-[var(--txt3)] ${
                              outbound ? "text-right" : ""
                            }`}
                          >
                            {timeOf(m.createdAt)}
                            {m.provider ? ` · ${m.provider}` : ""}
                            {outbound && m.sentBy === currentUserId ? " · you" : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Internal notes. Visually separated from the thread above and
                  labelled staff-only, because a note shares the shape of a
                  message and the one thing it must never be mistaken for is
                  something the customer was told. It is stored in its own
                  table for the same reason. */}
              {capabilities.notes ? (
                <div className="bg-[var(--elevated)]/40 border-t border-[var(--border)] px-4 py-3">
                  <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--txt2)]">
                    <StickyNote size={12} />
                    Internal notes
                    <span className="font-normal normal-case text-[var(--txt3)]">
                      · never sent to the customer
                    </span>
                  </h3>

                  {notes.length === 0 ? (
                    <p className="mb-2 text-[11px] text-[var(--txt3)]">No notes yet.</p>
                  ) : (
                    <ul className="mb-2 max-h-[22vh] space-y-2 overflow-y-auto">
                      {notes.map((n) => (
                        <li
                          key={n.id}
                          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
                        >
                          <p className="whitespace-pre-wrap break-words text-[12px] leading-relaxed text-[var(--txt)]">
                            {n.body}
                          </p>
                          <p className="mt-1 text-[10px] text-[var(--txt3)]">
                            {n.authorId === currentUserId
                              ? "You"
                              : (staffLabel(staff, n.authorId) ?? "Staff")}
                            {" · "}
                            {timeOf(n.createdAt)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}

                  <textarea
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addNote(selected.id);
                    }}
                    rows={2}
                    placeholder="Note for the team — not sent to the customer"
                    className="w-full resize-y rounded-xl border border-[var(--border2)] bg-[var(--surface)] px-3 py-2 text-[12px] text-[var(--txt)] outline-none placeholder:text-[var(--txt3)] focus:border-[#2563EB]"
                  />
                  {noteError && <p className="mt-1 text-[11px] text-[#DC2626]">{noteError}</p>}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-[var(--txt3)]">Ctrl/⌘ + Enter to save</span>
                    <button
                      type="button"
                      disabled={!noteDraft.trim() || noteSaving}
                      onClick={() => addNote(selected.id)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#2563EB] px-3.5 py-1.5 text-[11px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {noteSaving ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Plus size={12} />
                      )}
                      Add note
                    </button>
                  </div>
                </div>
              ) : null}

              {/* The reply box, where a reply can actually land — and the
                  reason, where it cannot. Never a box that fails on submit. */}
              <div className="border-t border-[var(--border)] px-4 py-3">
                {reply?.allowed ? (
                  <>
                    <textarea
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendReply(selected.id);
                      }}
                      rows={2}
                      maxLength={reply.maxLength}
                      placeholder={`Reply on ${selected.channel}…`}
                      className="w-full resize-y rounded-xl border border-[var(--border2)] bg-[var(--surface)] px-3 py-2 text-[12px] text-[var(--txt)] outline-none placeholder:text-[var(--txt3)] focus:border-[#2563EB]"
                    />
                    {replyError && <p className="mt-1 text-[11px] text-[#DC2626]">{replyError}</p>}
                    {replyWarning && (
                      <p className="mt-1 text-[11px] text-[#92400E]">{replyWarning}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-[var(--txt3)]">
                        {reply.windowClosesAt
                          ? `Window closes ${timeOf(reply.windowClosesAt)} · Ctrl/⌘ + Enter to send`
                          : "Ctrl/⌘ + Enter to send"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[var(--txt3)]">
                          {replyDraft.trim().length}/{reply.maxLength}
                        </span>
                        <button
                          type="button"
                          disabled={!replyDraft.trim() || replySending}
                          onClick={() => sendReply(selected.id)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#16A34A] px-3.5 py-1.5 text-[11px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {replySending ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Send size={12} />
                          )}
                          Send
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] leading-relaxed text-[var(--txt3)]">
                    {reply?.message ??
                      "Reading and triage only. Replies from here are not implemented for this channel yet."}
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
