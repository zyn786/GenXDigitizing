// @ts-nocheck
"use client";

import { useState, useRef, useCallback, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import DOMPurify from "dompurify";
import {
  stripTags,
  bodyTextOf as bodyText,
  buildQuote as buildQuoteText,
  buildQuoteHtml,
  toHtmlBody,
  looksLikeHtml,
} from "@/lib/email-text";
import {
  Send,
  Loader2,
  CheckCircle2,
  X,
  Mail,
  Inbox,
  Search,
  ArrowLeft,
  Reply,
  Paperclip,
  Menu,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  MailOpen,
  AlertTriangle,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

/* ── tokens ─────────────────────────────────────────── */
var cTxt = "var(--txt)";
var cTxt2 = "var(--txt2)";
var cTxt3 = "var(--txt3)";
var cSurf = "var(--surface)";
var cBord = "var(--border)";
var cBord2 = "var(--border2)";
var cElev = "var(--elevated)";

/* ── from addresses ─────────────────────────────────── */
var FROM_OPTIONS = [
  { email: "support@genxdigitizing.com", label: "Support" },
  { email: "noreply@genxdigitizing.com", label: "No-Reply" },
  { email: "orders@genxdigitizing.com", label: "Orders" },
  { email: "billing@genxdigitizing.com", label: "Billing" },
];

/** Must match MAX_BYTES in app/api/admin/email/upload. */
var MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;

/* ── color palette ──────────────────────────────────── */
var CLR = {
  blue: { bg: "rgba(59,130,246,0.1)", icon: "#3B82F6", text: "#1D4ED8" },
  green: { bg: "rgba(16,185,129,0.1)", icon: "#10B981", text: "#047857" },
  purple: { bg: "rgba(139,92,246,0.1)", icon: "#8B5CF6", text: "#6D28D9" },
  orange: { bg: "rgba(249,115,22,0.1)", icon: "#F97316", text: "#C2410C" },
  red: { bg: "rgba(239,68,68,0.1)", icon: "#EF4444", text: "#B91C1C" },
  amber: { bg: "rgba(245,158,11,0.12)", icon: "#F59E0B", text: "#B45309" },
};

var inpStyle: React.CSSProperties = {
  width: "100%",
  background: cElev,
  border: "1px solid " + cBord2,
  borderRadius: 10,
  padding: "10px 14px",
  color: cTxt,
  fontSize: 13,
  outline: "none",
  fontFamily: "Inter, sans-serif",
  boxSizing: "border-box",
};

/* ── types ──────────────────────────────────────────── */
type SentEmail = {
  id: string;
  to_email: string;
  from_email?: string;
  subject: string;
  body: string;
  sent_at: string;
  resend_id?: string;
  attachments_meta?: string;
  message_id?: string;
  thread_id?: string;
  in_reply_to?: string;
  references?: string;
};
type ReceivedEmail = {
  id: string;
  from_email: string;
  to_email: string;
  cc_emails?: string;
  subject: string;
  body_html?: string;
  body_text?: string;
  received_at: string;
  attachments_meta?: string;
  is_read?: boolean;
  sender_name?: string;
  message_id?: string;
  resend_id?: string;
  thread_id?: string;
  in_reply_to?: string;
  references?: string;
};
type ThreadRow = {
  thread_id: string;
  last_at: string;
  first_at: string;
  message_count: number;
  unread_count: number;
};
type AnyMessage = ReceivedEmail & SentEmail & { direction: "in" | "out"; at: string };
type AttachFile = {
  key: string;
  filename: string;
  size: number;
  content_type: string;
  path?: string;
  status: "uploading" | "ready" | "error";
  error?: string;
};

/* ── helpers ────────────────────────────────────────── */
function fmtDate(iso: string) {
  var d = new Date(iso);
  var now = new Date();
  var isToday = d.toDateString() === now.toDateString();
  var time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (isToday) return time;
  var diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 1) return "Yesterday";
  if (diff < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtFullDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Kept in lib/email-text.ts: these run during render, including the server-side
// pass, so they must not touch the DOM.

function trunc(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function avLetter(email: string) {
  var name = (email || "").split("@")[0] || "";
  return (name[0] || "?").toUpperCase();
}

function avColor(email: string) {
  var colors = [
    "#3B82F6",
    "#10B981",
    "#8B5CF6",
    "#F97316",
    "#EC4899",
    "#06B6D4",
    "#EF4444",
    "#6366F1",
  ];
  var hash = 0;
  for (var i = 0; i < (email || "").length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function fmtSize(bytes: number) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function senderLabel(m: any) {
  if (!m) return "";
  if (m.direction === "out") return "You";
  return m.sender_name || m.from_email || "";
}

/** The address of the other party in a message. */
function counterparty(m: any) {
  return m.direction === "out" ? m.to_email || "" : m.from_email || "";
}

/**
 * Attachments are stored two ways:
 *  - inbound: JSON metadata from Resend (id + filename + size)
 *  - sent: JSON written at send time (filename + storage path + size)
 * Older sent rows may hold a plain comma-separated list — handle both.
 */
function parseAttachments(
  raw?: string
): Array<{ filename: string; size?: number; id?: string; path?: string }> {
  if (!raw) return [];
  var text = String(raw).trim();
  if (text.charAt(0) === "[") {
    try {
      var parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      /* fall through */
    }
  }
  return text
    .split(",")
    .map(function (n) {
      return { filename: n.trim() };
    })
    .filter(function (a) {
      return a.filename;
    });
}

/**
 * Is this attachment something a browser can render inline?
 *
 * Prefers the stored content_type — Resend gives one for every inbound file —
 * and falls back to the extension, because older sent rows carry only a
 * filename. SVG is deliberately excluded: it can carry script.
 */
function isImageAttachment(f: any): boolean {
  var name = String((f && f.filename) || "").toLowerCase();
  if (/\.svg$/.test(name)) return false;
  if (f && typeof f.content_type === "string" && f.content_type.indexOf("image/") === 0) {
    return f.content_type !== "image/svg+xml";
  }
  return /\.(png|jpe?g|gif|webp|bmp|avif|heic|heif)$/.test(name);
}

/**
 * Thumbnail for an image attachment. `src` serves the bytes same-origin, so the
 * session cookie authorises it; the anchor adds inline=1 so the full-size view
 * opens in a tab instead of downloading.
 */
function AttachThumb({
  src,
  href,
  filename,
  size,
}: {
  src: string;
  href: string;
  filename: string;
  size?: number;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={"Open " + filename}
      style={{
        display: "block",
        width: 190,
        textDecoration: "none",
        border: "1px solid " + cBord2,
        borderRadius: 10,
        overflow: "hidden",
        background: "var(--surface)",
      }}
    >
      <img
        src={src}
        alt={filename}
        loading="lazy"
        style={{
          display: "block",
          width: "100%",
          height: 132,
          objectFit: "cover",
          background: "#0b1220",
        }}
      />
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 9px",
          fontSize: 11,
          fontWeight: 600,
          color: cTxt2,
        }}
      >
        <Paperclip size={11} style={{ flexShrink: 0 }} />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {filename}
        </span>
        {size ? (
          <span style={{ color: cTxt3, fontWeight: 400, marginLeft: "auto", flexShrink: 0 }}>
            {fmtSize(size)}
          </span>
        ) : null}
      </span>
    </a>
  );
}

/**
 * A file staged for sending — uploading, ready, or failed. Images show a
 * thumbnail once the upload has produced a storage path; everything else stays
 * a compact chip. Used by both the compose form and the inline reply box.
 */
function PendingAttachChip({ a, onRemove }: { a: any; onRemove: () => void }) {
  var removeBtn = (
    <button
      type="button"
      onClick={onRemove}
      title="Remove"
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        color: cTxt3,
        padding: "0 2px",
        display: "flex",
      }}
    >
      <X size={12} />
    </button>
  );

  if (a.status === "ready" && a.path && isImageAttachment(a)) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-start" }}>
        <AttachThumb
          src={"/api/admin/email/attachment?path=" + encodeURIComponent(a.path)}
          filename={a.filename}
          size={a.size}
          href={"/api/admin/email/attachment?path=" + encodeURIComponent(a.path) + "&inline=1"}
        />
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: cTxt3 }}>
          Ready to send {removeBtn}
        </span>
      </div>
    );
  }

  var tint = a.status === "error" ? CLR.red : a.status === "uploading" ? CLR.amber : CLR.blue;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        background: tint.bg,
        borderRadius: 8,
        border: "1px solid " + tint.icon + "33",
        fontSize: 11,
        color: tint.text,
        fontWeight: 600,
      }}
    >
      {a.status === "uploading" ? (
        <Loader2 size={11} className="animate-spin" />
      ) : (
        <Paperclip size={11} />
      )}
      {a.filename}
      <span style={{ color: cTxt3, fontWeight: 400 }}>({fmtSize(a.size)})</span>
      {a.status === "error" && <span style={{ fontWeight: 700 }}>{a.error}</span>}
      {removeBtn}
    </div>
  );
}

function AttachmentChips({ message }: { message: any }) {
  var files = parseAttachments(message.attachments_meta);
  if (files.length === 0) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
      {files.map(function (f, i) {
        var href = null;
        if (message.direction === "in" && message.resend_id && f.id) {
          href =
            "/api/admin/email/attachment?email=" +
            encodeURIComponent(message.resend_id) +
            "&id=" +
            encodeURIComponent(f.id);
        } else if (f.path) {
          href = "/api/admin/email/attachment?path=" + encodeURIComponent(f.path);
        }

        // Images preview inline. Only when we can actually resolve the bytes —
        // legacy sent rows store a bare filename with no storage path, and
        // there is nothing to point an <img> at.
        if (href && isImageAttachment(f)) {
          return (
            <AttachThumb
              key={i}
              src={href}
              filename={f.filename}
              size={f.size}
              href={href + (href.indexOf("?") === -1 ? "?" : "&") + "inline=1"}
            />
          );
        }

        var inner = (
          <>
            <Paperclip size={12} />
            <span
              style={{
                maxWidth: 220,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {f.filename}
            </span>
            {f.size ? (
              <span style={{ color: cTxt3, fontWeight: 400 }}>{fmtSize(f.size)}</span>
            ) : null}
            {href ? <Download size={12} style={{ opacity: 0.7 }} /> : null}
          </>
        );
        var style: React.CSSProperties = {
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 11px",
          background: CLR.blue.bg,
          borderRadius: 8,
          border: "1px solid rgba(59,130,246,0.2)",
          fontSize: 11,
          color: CLR.blue.text,
          fontWeight: 600,
          textDecoration: "none",
        };
        return href ? (
          <a key={i} href={href} style={style}>
            {inner}
          </a>
        ) : (
          <span key={i} style={style}>
            {inner}
          </span>
        );
      })}
    </div>
  );
}

/** Gmail-style quoted reply — see lib/email-text.ts. */
const buildQuote = buildQuoteText;

/* ── Pagination ──────────────────────────────────────── */
function Pagination({
  page,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  var totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  var pages: number[] = [];
  var start = Math.max(1, page - 3);
  var end = Math.min(totalPages, page + 3);
  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push(-1);
  }
  for (var i = start; i <= end; i++) pages.push(i);
  if (end < totalPages) {
    if (end < totalPages - 1) pages.push(-1);
    pages.push(totalPages);
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        padding: "10px 12px",
        borderTop: "1px solid " + cBord,
        flexWrap: "wrap",
      }}
    >
      <button
        type="button"
        className="email-tap"
        disabled={page <= 1}
        onClick={function () {
          onPage(page - 1);
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 30,
          height: 30,
          borderRadius: 8,
          border: "none",
          background: "transparent",
          color: page <= 1 ? cBord2 : cTxt2,
          cursor: page <= 1 ? "default" : "pointer",
          fontSize: 13,
        }}
      >
        <ChevronLeft size={15} />
      </button>
      {pages.map(function (p, idx) {
        if (p === -1)
          return (
            <span
              key={"dots" + idx}
              style={{ width: 30, textAlign: "center", color: cTxt3, fontSize: 12 }}
            >
              …
            </span>
          );
        var active = p === page;
        return (
          <button
            key={p}
            type="button"
            onClick={function () {
              onPage(p);
            }}
            className="email-tap"
            style={{
              minWidth: 30,
              height: 30,
              borderRadius: 8,
              border: "none",
              background: active ? CLR.blue.icon : "transparent",
              color: active ? "#fff" : cTxt2,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: active ? 700 : 500,
              fontFamily: "Inter, sans-serif",
              padding: "0 6px",
              transition: "all 0.1s",
            }}
          >
            {p}
          </button>
        );
      })}
      <button
        type="button"
        className="email-tap"
        disabled={page >= totalPages}
        onClick={function () {
          onPage(page + 1);
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 30,
          height: 30,
          borderRadius: 8,
          border: "none",
          background: "transparent",
          color: page >= totalPages ? cBord2 : cTxt2,
          cursor: page >= totalPages ? "default" : "pointer",
          fontSize: 13,
        }}
      >
        <ChevronRight size={15} />
      </button>
      <span style={{ fontSize: 10, color: cTxt3, marginLeft: 8 }}>
        {total} total · {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}
      </span>
    </div>
  );
}

/* ── component ──────────────────────────────────────── */
/** Stable identity for defaulted array props — see the destructuring below. */
const EMPTY_ARRAY: never[] = [];

interface Props {
  userId: string;
  sentEmails: SentEmail[];
  receivedEmails: ReceivedEmail[];
  threads?: ThreadRow[];
  replies?: ThreadRow[];
  threadMessages?: AnyMessage[];
  /** Addresses that actually receive mail, discovered from the data. */
  addresses?: string[];
  sentTotal: number;
  receivedTotal: number;
  repliesTotal?: number;
  unreadCount?: number;
  unreadReplies?: number;
  migrationMissing?: boolean;
  loadError?: string | null;
  sentPage: number;
  inboxPage: number;
  repliesPage?: number;
  pageSize: number;
}

export function EmailComposer({
  userId,
  sentEmails: initSent,
  receivedEmails: initRecv,
  // Default to a shared constant rather than a fresh `[]`. A new array literal
  // in a default parameter is a NEW identity on every render, which would make
  // the resync effects below fire on every render and loop forever.
  threads: initThreads = EMPTY_ARRAY,
  replies: initReplies = EMPTY_ARRAY,
  threadMessages: initMessages = EMPTY_ARRAY,
  addresses = EMPTY_ARRAY,
  sentTotal,
  receivedTotal,
  repliesTotal = 0,
  unreadCount: initUnread = 0,
  unreadReplies: initUnreadReplies = 0,
  migrationMissing = false,
  loadError = null,
  sentPage,
  inboxPage,
  repliesPage = 1,
  pageSize,
}: Props) {
  var router = useRouter();
  var searchParams = useSearchParams();
  // Drives the progress bar during server round trips (pagination, resend sync).
  var [isPending, startTx] = useTransition();

  /* state */
  var [folder, setFolder] = useState("inbox");
  var [openThreadId, setOpenThreadId] = useState<string | null>(null);
  var [openSentId, setOpenSentId] = useState<string | null>(null);
  var [search, setSearch] = useState("");
  var [addressFilter, setAddressFilter] = useState<string | null>(null);
  var [showList, setShowList] = useState(true);
  var [sidebarOpen, setSidebarOpen] = useState(false);

  /* compose */
  var [to, setTo] = useState("");
  var [from, setFrom] = useState(FROM_OPTIONS[0].email);
  var [subject, setSubject] = useState("");
  var [message, setMessage] = useState("");
  var [sending, setSending] = useState(false);
  var [sentOk, setSentOk] = useState(false);
  var [attachments, setAttachments] = useState<AttachFile[]>([]);

  /* inline reply — lives inside the conversation, never the compose tab */
  var [replyText, setReplyText] = useState("");
  var [replyAttachments, setReplyAttachments] = useState<AttachFile[]>([]);
  var [replySending, setReplySending] = useState(false);
  var [showQuote, setShowQuote] = useState(false);
  var replyFileRef = useRef(null);

  var [sentList, setSentList] = useState(initSent);
  var [threadList, setThreadList] = useState(initThreads);
  var [replyList, setReplyList] = useState(initReplies);
  var [messages, setMessages] = useState(initMessages);
  var [unread, setUnread] = useState(initUnread);
  var [unreadReplies, setUnreadReplies] = useState(initUnreadReplies);
  var [sentOffset, setSentOffset] = useState(0);
  var [syncing, setSyncing] = useState(false);

  /* ── Keeping local state in step with the server ────────────────────────
     The lists below are seeded from props but also mutated locally for
     optimistic updates, so the UI responds before the server round trip lands:
     a just-sent mail is prepended, an unread count decrements, a reply is
     appended.

     The page used to paper over the resulting staleness by passing a `key` that
     remounted this entire component whenever a page number changed. That worked,
     at the cost of scroll position, any open draft, and the selected folder —
     `folder` re-initialised to "inbox", so paginating while in Sent bounced you
     back to the inbox.

     Re-seeding from props when the server sends new data keeps the optimistic
     behaviour and drops the remount. Each effect keys on the prop identity the
     server component hands down, which changes only when the data does.

     `sentOffset` is the one piece of pure local bookkeeping: it bumps the sent
     total so a new mail is counted immediately. It must reset whenever the
     server's own count arrives, or the total double-counts. */
  useEffect(
    function () {
      setSentList(initSent);
      setSentOffset(0);
    },
    [initSent]
  );
  useEffect(
    function () {
      setThreadList(initThreads);
    },
    [initThreads]
  );
  useEffect(
    function () {
      setReplyList(initReplies);
    },
    [initReplies]
  );
  useEffect(
    function () {
      setMessages(initMessages);
    },
    [initMessages]
  );
  useEffect(
    function () {
      setUnread(initUnread);
    },
    [initUnread]
  );
  useEffect(
    function () {
      setUnreadReplies(initUnreadReplies);
    },
    [initUnreadReplies]
  );
  var fileRef = useRef(null);

  /* ── derived: which conversations exist, and their display fields ── */
  var threadsById: Record<string, AnyMessage[]> = {};
  messages.forEach(function (m) {
    var key = m.thread_id || "solo-" + m.id;
    (threadsById[key] = threadsById[key] || []).push(m);
  });

  function buildConversation(t: any, tab: string) {
    var msgs = threadsById[t.thread_id] || [];
    var last = msgs[msgs.length - 1];
    var inbound = msgs.filter(function (m) {
      return m.direction === "in";
    });
    var firstInbound = inbound[0] || msgs[0];

    // Which of our addresses this conversation arrived at. Replies go out from
    // it, so mail to orders@ is answered from orders@ rather than support@.
    var threadAddresses: string[] = [];
    inbound.forEach(function (m) {
      String(m.to_email || "")
        .split(",")
        .forEach(function (part) {
          var addr = part.trim().toLowerCase();
          if (addr && threadAddresses.indexOf(addr) === -1) threadAddresses.push(addr);
        });
    });

    return {
      thread_id: t.thread_id,
      tab: tab,
      addresses: threadAddresses,
      address: threadAddresses[0] || null,
      last_at: t.last_at,
      count: t.message_count,
      unread: t.unread_count,
      subject: firstInbound?.subject || last?.subject || "(no subject)",
      // Who the conversation is with: the other party of the first inbound message.
      party: firstInbound
        ? firstInbound.sender_name || firstInbound.from_email
        : last
          ? last.to_email
          : "",
      partyEmail: firstInbound ? firstInbound.from_email : last ? last.to_email : "",
      preview: last ? bodyText(last) : "",
      lastFrom: last ? senderLabel(last) : "",
      messages: msgs,
    };
  }

  var conversations = threadList
    .map(function (t: any) {
      return buildConversation(t, "inbox");
    })
    .concat(
      replyList.map(function (t: any) {
        return buildConversation(t, "replies");
      })
    );

  // Which addresses to offer as filters — from the data, so a new Resend
  // address appears here on its own.
  var knownAddresses =
    addresses.length > 0
      ? addresses
      : Array.from(
          new Set(
            conversations
              .map(function (c) {
                return c.address;
              })
              .filter(Boolean)
          )
        );

  // Composer sender choices: the standard four, plus anything discovered, so a
  // newly added address is immediately usable without a code change.
  var fromChoices = FROM_OPTIONS.concat(
    knownAddresses
      .filter(function (a: string) {
        return !FROM_OPTIONS.some(function (f) {
          return f.email === a;
        });
      })
      .map(function (a: string) {
        return { email: a, label: a.split("@")[0] };
      })
  );

  var filteredThreads = conversations.filter(function (c) {
    // Replies live only in their own tab; the Inbox is mail that arrived on
    // its own, so nothing appears twice.
    if (c.tab !== (folder === "replies" ? "replies" : "inbox")) return false;
    if (addressFilter && c.addresses.indexOf(addressFilter) === -1) return false;
    if (!search) return true;
    var q = search.toLowerCase();
    return (
      (c.subject || "").toLowerCase().indexOf(q) !== -1 ||
      (c.party || "").toLowerCase().indexOf(q) !== -1 ||
      (c.partyEmail || "").toLowerCase().indexOf(q) !== -1 ||
      c.messages.some(function (m) {
        return bodyText(m).toLowerCase().indexOf(q) !== -1;
      })
    );
  });

  var filteredSent = sentList.filter(function (e) {
    if (!search) return true;
    var q = search.toLowerCase();
    return (
      (e.subject || "").toLowerCase().indexOf(q) !== -1 ||
      (e.to_email || "").toLowerCase().indexOf(q) !== -1 ||
      (e.body || "").toLowerCase().indexOf(q) !== -1
    );
  });

  var openThread =
    conversations.find(function (c) {
      return c.thread_id === openThreadId;
    }) || null;
  var openSent =
    sentList.find(function (e) {
      return e.id === openSentId;
    }) || null;

  /* ── attachments ────────────────────────────────── */
  /** Upload files to storage; `setList` is the compose or inline-reply list. */
  function uploadFiles(files: FileList, setList: any) {
    if (!files || files.length === 0) return;

    for (var i = 0; i < files.length; i++) {
      (function (file) {
        var key = file.name + "-" + file.size + "-" + Date.now() + "-" + i;

        if (file.size > MAX_ATTACHMENT_BYTES) {
          toast.error(
            '"' + file.name + '" is ' + fmtSize(file.size) + " — the limit is 4MB per file."
          );
          return;
        }

        setList(function (prev) {
          return prev.concat([
            {
              key: key,
              filename: file.name,
              size: file.size,
              content_type: file.type || "application/octet-stream",
              status: "uploading",
            },
          ]);
        });

        var form = new FormData();
        form.append("file", file);

        fetch("/api/admin/email/upload", { method: "POST", body: form })
          .then(function (r) {
            return r.json().then(function (d) {
              return { ok: r.ok, status: r.status, d: d };
            });
          })
          .then(function (res) {
            setList(function (prev) {
              return prev.map(function (a) {
                if (a.key !== key) return a;
                if (!res.ok || !res.d.path) {
                  return {
                    ...a,
                    status: "error",
                    error: res.d.error || "Upload failed (" + res.status + ")",
                  };
                }
                return { ...a, status: "ready", path: res.d.path };
              });
            });
            if (!res.ok) toast.error(res.d.error || "Upload failed");
          })
          .catch(function () {
            setList(function (prev) {
              return prev.map(function (a) {
                return a.key === key ? { ...a, status: "error", error: "Upload failed" } : a;
              });
            });
            toast.error('Upload failed for "' + file.name + '"');
          });
      })(files[i]);
    }
  }

  function handleAttach(e) {
    uploadFiles(e.target.files, setAttachments);
    e.target.value = "";
  }

  function handleReplyAttach(e) {
    uploadFiles(e.target.files, setReplyAttachments);
    e.target.value = "";
  }

  function removeAttach(key: string) {
    setAttachments(function (prev) {
      return prev.filter(function (a) {
        return a.key !== key;
      });
    });
  }

  function removeReplyAttach(key: string) {
    setReplyAttachments(function (prev) {
      return prev.filter(function (a) {
        return a.key !== key;
      });
    });
  }

  /* ── send ───────────────────────────────────────── */
  function doSend() {
    if (!to.trim() || !subject.trim() || !message.trim()) {
      toast.error("Fill all fields");
      return;
    }

    if (
      attachments.some(function (a) {
        return a.status === "uploading";
      })
    ) {
      toast.error("Still uploading — one moment");
      return;
    }
    if (
      attachments.some(function (a) {
        return a.status === "error";
      })
    ) {
      toast.error("Remove the failed attachment first");
      return;
    }

    var ready = attachments.filter(function (a) {
      return a.status === "ready";
    });

    setSending(true);
    fetch("/api/admin/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: to.trim(),
        subject: subject.trim(),
        message: message.trim(),
        userId: userId,
        from: from.trim(),
        // New mail starts its own conversation server-side.
        attachments: ready.map(function (a) {
          return { path: a.path, filename: a.filename, content_type: a.content_type, size: a.size };
        }),
      }),
    })
      .then(function (r) {
        return r.text().then(function (text) {
          var data = null;
          try {
            data = JSON.parse(text);
          } catch (e) {}
          return { ok: r.ok, status: r.status, data: data, text: text };
        });
      })
      .then(function (res) {
        if (!res.ok) {
          var reason =
            (res.data && res.data.error) || res.text || "Request failed (" + res.status + ")";
          toast.error(
            res.status === 413 ? "Too large to send — attachments are limited to 4MB each." : reason
          );
          return;
        }
        if (res.data && res.data.error) {
          toast.error(res.data.error);
          return;
        }

        var entry = {
          id: (res.data && res.data.id) || crypto.randomUUID(),
          to_email: to.trim(),
          from_email: from.trim(),
          subject: subject.trim(),
          body: message.trim(),
          sent_at: new Date().toISOString(),
          resend_id: res.data && res.data.id,
          attachments_meta: ready.length
            ? JSON.stringify(
                ready.map(function (a) {
                  return { filename: a.filename, path: a.path, size: a.size };
                })
              )
            : null,
        };
        setSentList(function (p) {
          return [entry].concat(p);
        });
        setSentOffset(function (o) {
          return o + 1;
        });
        setSentOk(true);
        toast.success("Email sent");
      })
      .catch(function (err) {
        toast.error(err?.message || "Network error");
      })
      .finally(function () {
        setSending(false);
      });
  }

  function resetCompose() {
    setTo("");
    setFrom(FROM_OPTIONS[0].email);
    setSubject("");
    setMessage("");
    setAttachments([]);
    setSentOk(false);
    setFolder("inbox");
    setShowList(true);
    setOpenThreadId(null);
    setOpenSentId(null);
  }

  /** The message a reply in this conversation answers. */
  function replyTarget(c: any) {
    if (!c) return null;
    var inbound = c.messages.filter(function (m: any) {
      return m.direction === "in";
    });
    return inbound[inbound.length - 1] || c.messages[c.messages.length - 1] || null;
  }

  /**
   * Send a reply from inside the conversation — no compose tab.
   *
   * The box starts empty (like Gmail's inline reply) and the original is
   * appended as a quote at send time, so the recipient still gets context.
   */
  function sendInlineReply(c: any) {
    var target = replyTarget(c);
    if (!target) {
      toast.error("Nothing to reply to");
      return;
    }
    if (!replyText.trim()) {
      toast.error("Write a message first");
      return;
    }

    if (
      replyAttachments.some(function (a) {
        return a.status === "uploading";
      })
    ) {
      toast.error("Still uploading — one moment");
      return;
    }
    if (
      replyAttachments.some(function (a) {
        return a.status === "error";
      })
    ) {
      toast.error("Remove the failed attachment first");
      return;
    }

    var ready = replyAttachments.filter(function (a) {
      return a.status === "ready";
    });
    var subj = target.subject || c.subject || "";

    // Built as HTML: the typed part keeps its line breaks, and the original is
    // quoted behind a grey rule the way Gmail does it, rather than as raw "> ".
    var body = toHtmlBody(replyText.trim()) + buildQuoteHtml(target);

    // Thread the outgoing reply: locally via threadId, and for the recipient's
    // client via In-Reply-To / References.
    var refs = target.references
      ? target.references + " " + (target.message_id || "")
      : target.message_id || "";

    // Reply from the address this conversation arrived at, so mail to orders@
    // is answered from orders@. Falls back to the compose default.
    var replyFrom = c.address || from.trim();

    setReplySending(true);
    fetch("/api/admin/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: counterparty(target),
        subject: /^re:/i.test(subj) ? subj : "Re: " + subj,
        message: body,
        userId: userId,
        from: replyFrom,
        inReplyTo: target.message_id || undefined,
        references: refs.trim() || undefined,
        threadId: c.thread_id,
        attachments: ready.map(function (a) {
          return { path: a.path, filename: a.filename, content_type: a.content_type, size: a.size };
        }),
      }),
    })
      .then(function (r) {
        return r.text().then(function (text) {
          var data = null;
          try {
            data = JSON.parse(text);
          } catch (e) {}
          return { ok: r.ok, status: r.status, data: data, text: text };
        });
      })
      .then(function (res) {
        if (!res.ok) {
          var reason =
            (res.data && res.data.error) || res.text || "Request failed (" + res.status + ")";
          toast.error(
            res.status === 413 ? "Too large to send — attachments are limited to 4MB each." : reason
          );
          return;
        }
        if (res.data && res.data.error) {
          toast.error(res.data.error);
          return;
        }

        var entry = {
          id: (res.data && res.data.id) || crypto.randomUUID(),
          to_email: counterparty(target),
          from_email: replyFrom,
          subject: /^re:/i.test(subj) ? subj : "Re: " + subj,
          body: body,
          sent_at: new Date().toISOString(),
          resend_id: res.data && res.data.id,
          thread_id: c.thread_id,
          attachments_meta: ready.length
            ? JSON.stringify(
                ready.map(function (a) {
                  return { filename: a.filename, path: a.path, size: a.size };
                })
              )
            : null,
        };

        // Show it in the conversation immediately.
        setMessages(function (prev) {
          return prev.concat([{ ...entry, direction: "out", at: entry.sent_at }]);
        });
        var bumpCount = function (prev: any) {
          return prev.map(function (t: any) {
            return t.thread_id === c.thread_id
              ? { ...t, message_count: (t.message_count || 0) + 1, last_at: entry.sent_at }
              : t;
          });
        };
        setThreadList(bumpCount);
        setReplyList(bumpCount);
        setSentList(function (p) {
          return [entry].concat(p);
        });
        setSentOffset(function (o) {
          return o + 1;
        });

        setReplyText("");
        setReplyAttachments([]);
        setShowQuote(false);
        toast.success("Reply sent");
      })
      .catch(function (err) {
        toast.error(err?.message || "Network error");
      })
      .finally(function () {
        setReplySending(false);
      });
  }

  function openThreadById(id: string) {
    setOpenThreadId(id);
    setOpenSentId(null);
    setShowList(false);
    markThreadRead(id, true);
  }

  function markThreadRead(threadId: string, isRead: boolean) {
    var t = threadList.find(function (x) {
      return x.thread_id === threadId;
    });
    if (!t) return;
    if (isRead && !t.unread_count) return;

    var bump = function (prev: any) {
      return prev.map(function (x: any) {
        return x.thread_id === threadId ? { ...x, unread_count: isRead ? 0 : x.message_count } : x;
      });
    };
    var inReplies = replyList.some(function (x: any) {
      return x.thread_id === threadId;
    });

    setThreadList(bump);
    setReplyList(bump);
    if (inReplies)
      setUnreadReplies(function (u) {
        return Math.max(0, u + (isRead ? -1 : 1));
      });
    else
      setUnread(function (u) {
        return Math.max(0, u + (isRead ? -1 : 1));
      });

    fetch("/api/admin/email/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId: threadId, is_read: isRead }),
    }).catch(function () {
      /* optimistic — a refresh resyncs */
    });
  }

  function markAllRead() {
    if (unread === 0 && unreadReplies === 0) return;
    var clear = function (prev: any) {
      return prev.map(function (t: any) {
        return { ...t, unread_count: 0 };
      });
    };
    setThreadList(clear);
    setReplyList(clear);
    setUnread(0);
    setUnreadReplies(0);
    fetch("/api/admin/email/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (d) {
        if (d && d.error) {
          toast.error(d.error);
          return;
        }
        toast.success("All conversations marked read");
      })
      .catch(function () {
        toast.error("Could not mark all read");
      });
  }

  function syncFromResend() {
    if (syncing) return;
    setSyncing(true);
    fetch("/api/admin/email/sync", { method: "POST" })
      .then(function (r) {
        return r.json().then(function (d) {
          return { ok: r.ok, d: d };
        });
      })
      .then(function (res) {
        var d = res.d || {};
        if (!res.ok || d.error) {
          toast.error(d.error || "Sync failed");
          return;
        }
        if (d.imported > 0) {
          toast.success("Imported " + d.imported + " email" + (d.imported === 1 ? "" : "s"));
          // Inside a transition so the spinner below has something to report.
          startTx(function () {
            router.refresh();
          });
        } else {
          toast.success("Already up to date — " + d.seen + " checked");
        }
      })
      .catch(function () {
        toast.error("Sync failed");
      })
      .finally(function () {
        setSyncing(false);
      });
  }

  function goToList() {
    setShowList(true);
    setOpenThreadId(null);
    setOpenSentId(null);
  }

  function navFolder(f: string) {
    setFolder(f);
    setOpenThreadId(null);
    setOpenSentId(null);
    setSearch("");
    setShowList(true);
    setSentOk(false);
    setSidebarOpen(false);
  }

  function startCompose() {
    setFolder("compose");
    setSentOk(false);
    setShowList(false);
    setSidebarOpen(false);
    setTo("");
    setSubject("");
    setMessage("");
    setAttachments([]);
  }

  /* pagination */
  var curPage = folder === "replies" ? repliesPage : folder === "inbox" ? inboxPage : sentPage;
  var curTotal =
    folder === "replies"
      ? repliesTotal
      : folder === "inbox"
        ? receivedTotal
        : sentTotal + sentOffset;
  var goPage = useCallback(
    function (p: number) {
      var params = new URLSearchParams(searchParams.toString());
      var key =
        folder === "replies" ? "repliesPage" : folder === "inbox" ? "inboxPage" : "sentPage";
      if (p <= 1) params.delete(key);
      else params.set(key, String(p));
      // Pagination is a server round trip. Wrapping it in a transition gives
      // isPending a value to drive the progress bar — previously the list just sat
      // there with no indication anything was happening.
      startTx(function () {
        router.push("?" + params.toString(), { scroll: false });
      });
    },
    [folder, searchParams, router]
  );

  var showCompose = folder === "compose";
  var showThreadDetail = !showList && !!openThread && (folder === "inbox" || folder === "replies");
  var showSentDetail = !showList && !!openSent && folder === "sent";
  var showDetail = showThreadDetail || showSentDetail;

  /* ═══════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════ */
  return (
    <div className="email-client">
      {/*
        One style block, deliberately. This markup previously carried three
        separate <style> injections with overlapping rules — the mobile overrides
        were split across all three, two of them using !important to fight each
        other, so the effective layout could not be read from any single place.

        Two real bugs fixed here:
          · `min-height: 560px` was never unset on mobile. `height` shrank to
            100dvh-100px but the floor stayed, so once the on-screen keyboard
            opened (or on a short viewport) the container refused to shrink and
            `overflow: hidden` clipped the composer with no way to scroll to it.
          · Icon-only buttons were 16-30px, well under a comfortable touch
            target, which is most of why the mobile view felt fiddly.
      */}
      <style
        dangerouslySetInnerHTML={{
          __html:
            "\n.email-client { display:flex; height:calc(100vh - 140px); position:relative; min-height:560px; border-radius:16px; overflow:hidden; background:" +
            cSurf +
            "; border:1px solid " +
            cBord +
            "; }\n" +
            ".email-sidebar { width:200px; flex-shrink:0; border-right:1px solid " +
            cBord +
            "; display:flex; flex-direction:column; background:rgba(0,0,0,0.01); }\n" +
            ".email-main { flex:1; display:flex; flex-direction:column; min-width:0; }\n" +
            ".email-list-panel { width:400px; flex-shrink:0; border-right:1px solid " +
            cBord +
            "; display:flex; flex-direction:column; }\n" +
            ".email-detail-panel { flex:1; display:flex; flex-direction:column; min-width:0; }\n" +
            ".email-body img { max-width:100%; height:auto; }\n" +
            ".email-body table { max-width:100%; }\n" +
            ".email-body a { word-break:break-word; }\n" +
            ".email-body { overflow-wrap:anywhere; }\n" +
            ".efld { display:block; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:" +
            cTxt3 +
            "; margin-bottom:5px; }\n" +
            ".email-row { transition: background-color 0.12s; }\n" +
            // Indeterminate progress bar for server round trips.
            ".email-progress { height:2px; flex-shrink:0; background-image:linear-gradient(90deg, transparent, #2563EB, transparent); background-size:40% 100%; background-repeat:no-repeat; animation:email-progress 1.1s linear infinite; }\n" +
            "@keyframes email-progress { 0% { background-position:-40% 0 } 100% { background-position:140% 0 } }\n" +
            "@media (prefers-reduced-motion: reduce) { .email-progress { animation:none; background-image:linear-gradient(90deg, transparent, #2563EB, transparent); background-size:100% 100%; } }\n" +
            // Rows carry their state in an inline `background`, which a class rule
            // cannot override. background-IMAGE composites on top of background-COLOR,
            // so this tints any row on hover without fighting the selected/unread fill.
            ".email-row:hover { background-image: linear-gradient(rgba(0,0,0,0.04), rgba(0,0,0,0.04)); }\n" +
            "\n@media (max-width: 768px) {\n" +
            "  .email-client { flex-direction:column; height:calc(100dvh - 100px); min-height:0; border-radius:12px; }\n" +
            "  .email-sidebar { display:none; }\n" +
            "  .email-sidebar.open { display:flex; position:fixed; z-index:40; top:0; left:0; bottom:0; width:264px; box-shadow:4px 0 20px rgba(0,0,0,0.2); padding-bottom:env(safe-area-inset-bottom); }\n" +
            "  .email-sidebar-backdrop { display:block !important; }\n" +
            "  .email-mobile-header { display:flex !important; }\n" +
            "  .email-list-panel { width:100%; border-right:none; }\n" +
            // padding-bottom keeps the composer's action row clear of the iOS home indicator
            "  .email-detail-panel { width:100%; position:absolute; inset:0; z-index:10; background:" +
            cSurf +
            "; padding-bottom:env(safe-area-inset-bottom); }\n" +
            // Comfortable touch targets for icon-only controls
            "  .email-tap { min-width:44px; min-height:44px; display:inline-flex; align-items:center; justify-content:center; }\n" +
            "}\n" +
            "@media (min-width: 769px) and (max-width: 1100px) {\n  .email-list-panel { width:300px; }\n}\n",
        }}
      />

      {/* ═══ SIDEBAR BACKDROP (mobile) ═══ */}
      {sidebarOpen && (
        <div
          className="email-sidebar-backdrop"
          onClick={function () {
            setSidebarOpen(false);
          }}
          style={{
            display: "none",
            position: "fixed",
            inset: 0,
            zIndex: 35,
            background: "rgba(0,0,0,0.3)",
          }}
        />
      )}

      {/* ═══ MOBILE HEADER ═══════════════════════ */}
      <div
        className="email-mobile-header"
        style={{
          display: "none",
          padding: "8px 12px",
          borderBottom: "1px solid " + cBord,
          alignItems: "center",
          gap: 8,
        }}
      >
        <button
          type="button"
          onClick={function () {
            setSidebarOpen(!sidebarOpen);
          }}
          className="email-tap"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: cTxt,
            padding: 4,
            display: "flex",
          }}
          aria-label="Open folders"
        >
          <Menu size={20} />
        </button>
        {/* The title takes the free space so the actions land on the right. They
            used to sit INSIDE this span, where marginLeft:auto does nothing —
            a span is inline, so it was never a flex child. */}
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 15,
            fontWeight: 700,
            color: cTxt,
            fontFamily: "Syne, sans-serif",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {showCompose
            ? "Compose"
            : folder === "inbox"
              ? "Inbox"
              : folder === "replies"
                ? "Replies"
                : "Sent"}
        </span>
        {!showCompose && showList && (
          <button
            type="button"
            onClick={startCompose}
            className="email-tap"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: CLR.blue.icon,
              border: "none",
              cursor: "pointer",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "Inter, sans-serif",
              padding: "6px 12px",
              borderRadius: 8,
            }}
          >
            <Mail size={13} /> Compose
          </button>
        )}
        {!showCompose && !showList && (
          <button
            type="button"
            onClick={goToList}
            className="email-tap"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: CLR.blue.icon,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
              padding: 0,
            }}
          >
            <ArrowLeft size={14} /> List
          </button>
        )}
      </div>

      {/* ═══ SIDEBAR ══════════════════════════════ */}
      <div className={"email-sidebar" + (sidebarOpen ? " open" : "")}>
        <div style={{ padding: "14px 12px" }}>
          <button
            type="button"
            onClick={startCompose}
            style={{
              width: "100%",
              padding: "10px 16px",
              borderRadius: 12,
              border: "none",
              background:
                folder === "compose"
                  ? "linear-gradient(135deg, #1D4ED8, #6D28D9)"
                  : "linear-gradient(135deg, #2563EB, #7C3AED)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
              transition: "all 0.15s",
            }}
          >
            <Mail size={14} /> Compose
          </button>
        </div>
        <div style={{ flex: 1, padding: "0 8px" }}>
          {[
            {
              key: "inbox",
              label: "Inbox",
              count: unread,
              icon: <Inbox size={16} />,
              accent: unread > 0,
            },
            {
              key: "replies",
              label: "Replies",
              count: unreadReplies,
              icon: <Reply size={16} />,
              accent: unreadReplies > 0,
            },
            {
              key: "sent",
              label: "Sent",
              count: sentTotal + sentOffset,
              icon: <Send size={16} />,
              accent: false,
            },
          ].map(function (f) {
            var act = folder === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={function () {
                  navFolder(f.key);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 10,
                  marginBottom: 2,
                  border: "none",
                  background: act ? CLR.blue.bg : "transparent",
                  color: act ? CLR.blue.text : cTxt2,
                  fontSize: 13,
                  fontWeight: act ? 700 : 500,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  transition: "all 0.12s",
                }}
              >
                <span style={{ color: act ? CLR.blue.icon : cTxt3, display: "flex" }}>
                  {f.icon}
                </span>
                <span style={{ flex: 1, textAlign: "left" }}>{f.label}</span>
                {f.count > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: 20,
                      background: act || f.accent ? CLR.blue.icon : cBord2,
                      color: act || f.accent ? "#fff" : cTxt3,
                      minWidth: 20,
                      textAlign: "center",
                    }}
                  >
                    {f.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div style={{ padding: 12, borderTop: "1px solid " + cBord }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: cTxt3,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: 6,
            }}
          >
            Send from
          </div>
          <div style={{ fontSize: 11, color: cTxt2, fontWeight: 600 }}>
            support@genxdigitizing.com
          </div>
          <div style={{ fontSize: 10, color: cTxt3, marginTop: 1 }}>via Resend</div>
        </div>
      </div>

      {/* ═══ MAIN ════════════════════════════════ */}
      <div className="email-main">
        {(loadError || migrationMissing) && (
          <div
            style={{
              padding: "10px 16px",
              borderBottom: "1px solid " + cBord,
              background: migrationMissing ? CLR.amber.bg : CLR.red.bg,
              color: migrationMissing ? CLR.amber.text : CLR.red.text,
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            <span>
              {migrationMissing
                ? "Conversation threading needs database migration 038. Until it's applied the inbox stays a flat list. Run supabase/migrations/038_email_threading.sql."
                : "Could not load mail: " + loadError}
            </span>
          </div>
        )}

        {/* ── COMPOSE VIEW ──────────────────────── */}
        {showCompose && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
            <div
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid " + cBord,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <button
                type="button"
                onClick={function () {
                  navFolder("inbox");
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: cTxt2,
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "Inter, sans-serif",
                  padding: 0,
                }}
              >
                <ArrowLeft size={14} /> Back
              </button>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: cTxt,
                  fontFamily: "Syne, sans-serif",
                }}
              >
                New Message
              </span>
            </div>

            {sentOk ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 20,
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: CLR.green.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 16px",
                    }}
                  >
                    <CheckCircle2 size={32} style={{ color: CLR.green.icon }} />
                  </div>
                  <h3
                    style={{
                      fontFamily: "Syne, sans-serif",
                      fontSize: 20,
                      fontWeight: 700,
                      color: cTxt,
                      margin: "0 0 4px",
                    }}
                  >
                    Message Sent
                  </h3>
                  <p style={{ fontSize: 13, color: cTxt2, margin: "0 0 24px" }}>
                    Delivered to <strong>{to}</strong>
                  </p>
                  <div
                    style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}
                  >
                    <button
                      type="button"
                      onClick={resetCompose}
                      style={{
                        padding: "10px 20px",
                        borderRadius: 10,
                        border: "1px solid " + cBord,
                        background: cSurf,
                        color: cTxt,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Back to Inbox
                    </button>
                    <button
                      type="button"
                      onClick={function () {
                        setSentOk(false);
                        setTo("");
                        setSubject("");
                        setMessage("");
                        setAttachments([]);
                        setReplyContext(null);
                      }}
                      style={{
                        padding: "10px 20px",
                        borderRadius: 10,
                        border: "none",
                        background: "linear-gradient(135deg, #2563EB, #7C3AED)",
                        color: "#fff",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Send Another
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
                <div style={{ maxWidth: 700 }}>
                  <div style={{ marginBottom: 14 }}>
                    <label className="efld">From</label>
                    <select
                      style={{ ...inpStyle, cursor: "pointer", appearance: "auto" }}
                      value={from}
                      onChange={function (e) {
                        setFrom(e.target.value);
                      }}
                    >
                      {fromChoices.map(function (f) {
                        return (
                          <option key={f.email} value={f.email}>
                            {f.label} &lt;{f.email}&gt;
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label className="efld">To</label>
                    <input
                      style={inpStyle}
                      type="text"
                      placeholder="recipient@example.com — commas for multiple"
                      value={to}
                      onChange={function (e) {
                        setTo(e.target.value);
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label className="efld">Subject</label>
                    <input
                      style={inpStyle}
                      type="text"
                      placeholder="Email subject..."
                      value={subject}
                      onChange={function (e) {
                        setSubject(e.target.value);
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <textarea
                      style={{
                        ...inpStyle,
                        minHeight: 260,
                        resize: "vertical",
                        lineHeight: 1.7,
                        fontFamily: "Inter, monospace",
                      }}
                      placeholder="Write your message...&#10;Supports HTML for rich formatting."
                      value={message}
                      onChange={function (e) {
                        setMessage(e.target.value);
                      }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                      <span style={{ fontSize: 10, color: cTxt3 }}>HTML supported</span>
                      <span style={{ fontSize: 10, color: cTxt3 }}>{message.length} chars</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <input
                        ref={fileRef}
                        type="file"
                        multiple
                        onChange={handleAttach}
                        style={{ display: "none" }}
                      />
                      <button
                        type="button"
                        onClick={function () {
                          fileRef.current && fileRef.current.click();
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "7px 14px",
                          borderRadius: 8,
                          border: "1px dashed " + cBord2,
                          background: "transparent",
                          color: cTxt2,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        <Paperclip size={13} /> Attach files
                      </button>
                      <span style={{ fontSize: 11, color: cTxt3 }}>Max 4MB each</span>
                    </div>
                    {attachments.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {attachments.map(function (a) {
                          return (
                            <PendingAttachChip
                              key={a.key}
                              a={a}
                              onRemove={function () {
                                removeAttach(a.key);
                              }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={function () {
                        navFolder("inbox");
                      }}
                      style={{
                        padding: "10px 18px",
                        borderRadius: 10,
                        border: "1px solid " + cBord,
                        background: "transparent",
                        color: cTxt2,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "Inter, sans-serif",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <X size={14} /> Discard
                    </button>
                    <button
                      type="button"
                      onClick={doSend}
                      disabled={sending}
                      style={{
                        padding: "10px 28px",
                        borderRadius: 10,
                        border: "none",
                        background: sending
                          ? "#94A3B8"
                          : "linear-gradient(135deg, #2563EB, #7C3AED)",
                        color: "#fff",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: sending ? "not-allowed" : "pointer",
                        fontFamily: "Inter, sans-serif",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {sending ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Sending...
                        </>
                      ) : (
                        <>
                          <Send size={14} /> Send
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── LIST + DETAIL ──────────────────────── */}
        {!showCompose && (
          <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
            <div
              className="email-list-panel"
              style={{ display: showList || !showDetail ? "flex" : "none" }}
            >
              {isPending && <div className="email-progress" aria-hidden="true" />}

              {/* Search + actions */}
              <div
                style={{
                  padding: "10px 12px",
                  borderBottom: "1px solid " + cBord,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
                  <Search
                    size={14}
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: cTxt3,
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    style={{
                      ...inpStyle,
                      paddingLeft: 34,
                      paddingTop: 7,
                      paddingBottom: 7,
                      fontSize: 12,
                    }}
                    placeholder={"Search " + folder + "..."}
                    value={search}
                    onChange={function (e) {
                      setSearch(e.target.value);
                    }}
                  />
                </div>
                {(folder === "inbox" || folder === "replies") && (
                  <>
                    {(folder === "replies" ? unreadReplies : unread) > 0 && (
                      <button
                        type="button"
                        onClick={markAllRead}
                        title="Mark all read"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "7px 9px",
                          borderRadius: 9,
                          border: "1px solid " + cBord2,
                          background: "transparent",
                          color: cTxt2,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "Inter, sans-serif",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <MailOpen size={13} /> {folder === "replies" ? unreadReplies : unread}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={syncFromResend}
                      disabled={syncing}
                      title="Import received mail from Resend"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "7px 10px",
                        borderRadius: 9,
                        border: "1px solid " + cBord2,
                        background: "transparent",
                        color: syncing ? cTxt3 : CLR.blue.text,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: syncing ? "default" : "pointer",
                        fontFamily: "Inter, sans-serif",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <RefreshCw size={13} className={syncing ? "animate-spin" : ""} /> Sync
                    </button>
                  </>
                )}
              </div>

              {/* Address filter — only meaningful with more than one address */}
              {(folder === "inbox" || folder === "replies") && knownAddresses.length > 1 && (
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    padding: "8px 12px",
                    borderBottom: "1px solid " + cBord,
                    overflowX: "auto",
                  }}
                  className="scrollbar-none"
                >
                  {[null].concat(knownAddresses).map(function (addr: any) {
                    var active = addressFilter === addr;
                    return (
                      <button
                        key={addr || "all"}
                        type="button"
                        onClick={function () {
                          setAddressFilter(addr);
                        }}
                        style={{
                          flexShrink: 0,
                          padding: "4px 10px",
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "Inter, sans-serif",
                          border: "1px solid " + (active ? "transparent" : cBord2),
                          background: active ? CLR.blue.icon : "transparent",
                          color: active ? "#fff" : cTxt2,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {addr ? addr.split("@")[0] + "@" : "All"}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* List */}
              <div style={{ flex: 1, overflow: "auto" }}>
                {folder === "inbox" || folder === "replies" ? (
                  filteredThreads.length === 0 ? (
                    <div style={{ padding: 32, textAlign: "center" }}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          background: CLR.blue.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 12px",
                        }}
                      >
                        <Inbox size={22} style={{ color: CLR.blue.icon }} />
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: cTxt, margin: "0 0 4px" }}>
                        {search
                          ? "No matches"
                          : folder === "replies"
                            ? "No replies yet"
                            : "Inbox empty"}
                      </p>
                      <p style={{ fontSize: 12, color: cTxt3, margin: 0 }}>
                        {search
                          ? "Try different search"
                          : folder === "replies"
                            ? "Conversations where someone answered an email you sent show up here."
                            : loadError
                              ? "Mail could not be loaded — see the notice above"
                              : "No mail yet — try Sync to import from Resend"}
                      </p>
                      {!search && folder === "inbox" && (
                        <button
                          type="button"
                          onClick={syncFromResend}
                          disabled={syncing}
                          style={{
                            marginTop: 14,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 14px",
                            borderRadius: 9,
                            border: "none",
                            background: CLR.blue.icon,
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: syncing ? "default" : "pointer",
                            fontFamily: "Inter, sans-serif",
                          }}
                        >
                          <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />{" "}
                          {syncing ? "Syncing…" : "Sync from Resend"}
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredThreads.map(function (c) {
                      var isSel = openThreadId === c.thread_id;
                      var isUnread = c.unread > 0;
                      return (
                        <div
                          key={c.thread_id}
                          onClick={function () {
                            openThreadById(c.thread_id);
                          }}
                          className="email-row"
                          style={{
                            padding: "12px 14px",
                            borderBottom: "1px solid " + cBord,
                            background: isSel
                              ? CLR.blue.bg
                              : isUnread
                                ? "rgba(59,130,246,0.035)"
                                : "transparent",
                            cursor: "pointer",
                            borderLeft: isSel
                              ? "3px solid " + CLR.blue.icon
                              : "3px solid transparent",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                flexShrink: 0,
                                background: avColor(c.partyEmail),
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 14,
                                fontWeight: 700,
                              }}
                            >
                              {avLetter(c.partyEmail)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "baseline",
                                  gap: 8,
                                }}
                              >
                                <span
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    minWidth: 0,
                                  }}
                                >
                                  {isUnread && (
                                    <span
                                      style={{
                                        width: 7,
                                        height: 7,
                                        borderRadius: "50%",
                                        background: CLR.blue.icon,
                                        flexShrink: 0,
                                      }}
                                    />
                                  )}
                                  <span
                                    style={{
                                      fontSize: 13,
                                      fontWeight: isSel || isUnread ? 700 : 600,
                                      color: cTxt,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {c.party}
                                  </span>
                                  {c.count > 1 && (
                                    <span
                                      style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        color: cTxt3,
                                        background: cBord2,
                                        borderRadius: 20,
                                        padding: "1px 6px",
                                        flexShrink: 0,
                                      }}
                                    >
                                      {c.count}
                                    </span>
                                  )}
                                  {knownAddresses.length > 1 && c.address && (
                                    <span
                                      title={"Sent to " + c.address}
                                      style={{
                                        fontSize: 9,
                                        fontWeight: 700,
                                        color: CLR.blue.text,
                                        background: CLR.blue.bg,
                                        borderRadius: 20,
                                        padding: "1px 6px",
                                        flexShrink: 0,
                                        textTransform: "lowercase",
                                      }}
                                    >
                                      {c.address.split("@")[0]}@
                                    </span>
                                  )}
                                </span>
                                <span style={{ fontSize: 11, color: cTxt3, flexShrink: 0 }}>
                                  {fmtDate(c.last_at)}
                                </span>
                              </div>
                              {/* Three levels, so the eye has something to land on:
                                bold sender → medium subject → muted preview. The
                                subject used to go bold for unread too, which made
                                two lines compete — unread is already carried by the
                                dot, the tinted row and the sender weight. */}
                              <div
                                style={{
                                  fontSize: 12.5,
                                  fontWeight: 500,
                                  color: isSel ? CLR.blue.text : cTxt,
                                  marginTop: 3,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {c.subject}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: cTxt3,
                                  marginTop: 2,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {c.lastFrom === "You" ? (
                                  <span style={{ color: cTxt3 }}>You: </span>
                                ) : null}
                                {trunc(c.preview, 70)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )
                ) : filteredSent.length === 0 ? (
                  <div style={{ padding: 32, textAlign: "center" }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: cTxt, margin: "0 0 4px" }}>
                      {search ? "No matches" : "No sent emails"}
                    </p>
                  </div>
                ) : (
                  filteredSent.map(function (email) {
                    var isSel = openSentId === email.id;
                    return (
                      <div
                        key={email.id}
                        onClick={function () {
                          setOpenSentId(email.id);
                          setOpenThreadId(null);
                          setShowList(false);
                        }}
                        className="email-row"
                        style={{
                          padding: "12px 14px",
                          borderBottom: "1px solid " + cBord,
                          background: isSel ? CLR.blue.bg : "transparent",
                          cursor: "pointer",
                          borderLeft: isSel
                            ? "3px solid " + CLR.blue.icon
                            : "3px solid transparent",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: isSel ? 700 : 600,
                              color: cTxt,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {email.to_email}
                          </span>
                          <span style={{ fontSize: 11, color: cTxt3, flexShrink: 0 }}>
                            {fmtDate(email.sent_at)}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 12.5,
                            fontWeight: 500,
                            color: cTxt,
                            marginTop: 3,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {email.subject || "(no subject)"}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: cTxt3,
                            marginTop: 2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {trunc(stripTags(email.body) || "", 70)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {!search && (
                <Pagination page={curPage} total={curTotal} pageSize={pageSize} onPage={goPage} />
              )}
            </div>

            {/* Detail panel */}
            <div className="email-detail-panel" style={{ display: showDetail ? "flex" : "none" }}>
              {showThreadDetail && openThread && (
                <ThreadDetail
                  thread={openThread}
                  onBack={goToList}
                  onUnread={function () {
                    markThreadRead(openThread.thread_id, false);
                    goToList();
                  }}
                  replySlot={
                    <InlineReply
                      thread={openThread}
                      target={replyTarget(openThread)}
                      text={replyText}
                      onText={setReplyText}
                      attachments={replyAttachments}
                      onPickFiles={function () {
                        replyFileRef.current && replyFileRef.current.click();
                      }}
                      onRemoveAttachment={removeReplyAttach}
                      fileInput={
                        <input
                          ref={replyFileRef}
                          type="file"
                          multiple
                          onChange={handleReplyAttach}
                          style={{ display: "none" }}
                        />
                      }
                      showQuote={showQuote}
                      onToggleQuote={function () {
                        setShowQuote(!showQuote);
                      }}
                      sending={replySending}
                      onSend={function () {
                        sendInlineReply(openThread);
                      }}
                    />
                  }
                />
              )}
              {showSentDetail && openSent && <SentDetail email={openSent} onBack={goToList} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Thread detail — the whole conversation, oldest → newest
   ═══════════════════════════════════════════════════════ */
function ThreadDetail({
  thread,
  onBack,
  onUnread,
  replySlot,
}: {
  thread: any;
  onBack: () => void;
  onUnread: () => void;
  replySlot?: React.ReactNode;
}) {
  // Newest expanded; earlier messages collapsed, Gmail-style.
  var [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <>
      <div
        style={{
          padding: "12px 18px",
          borderBottom: "1px solid " + cBord,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="email-tap"
          aria-label="Back to list"
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: cTxt2,
            padding: 0,
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: cTxt,
              fontFamily: "Syne, sans-serif",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {thread.subject}
          </div>
          <div style={{ fontSize: 11, color: cTxt3, marginTop: 1 }}>
            {thread.count} message{thread.count === 1 ? "" : "s"} · {thread.partyEmail}
          </div>
        </div>
        <button
          type="button"
          onClick={onUnread}
          title="Mark as unread"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 12px",
            borderRadius: 8,
            border: "1px solid " + cBord,
            background: cSurf,
            color: cTxt2,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          <MailOpen size={12} /> Unread
        </button>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
        {thread.messages.map(function (m: any, idx: number) {
          var isOut = m.direction === "out";
          var isLast = idx === thread.messages.length - 1;
          var isOpen = isLast || expanded[m.id];
          var who = isOut ? "You" : m.sender_name || m.from_email;
          var address = isOut ? m.from_email : m.from_email;

          return (
            <div
              key={m.id}
              style={{
                marginBottom: 12,
                borderRadius: 12,
                border: "1px solid " + (isOpen ? cBord2 : cBord),
                background: isOut ? "rgba(59,130,246,0.04)" : cElev,
                overflow: "hidden",
              }}
            >
              <button
                type="button"
                onClick={function () {
                  if (!isLast)
                    setExpanded(function (p) {
                      return { ...p, [m.id]: !p[m.id] };
                    });
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  background: "none",
                  border: "none",
                  cursor: isLast ? "default" : "pointer",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: avColor(isOut ? m.from_email || "" : m.from_email),
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {isOut ? "Y" : avLetter(m.from_email)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: cTxt,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {who}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: cTxt3,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isOut ? "to " + m.to_email : ""}
                    </span>
                  </div>
                  {!isOpen && (
                    <div
                      style={{
                        fontSize: 11,
                        color: cTxt3,
                        marginTop: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {trunc(bodyText(m), 90)}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 10, color: cTxt3, flexShrink: 0 }}>
                  {fmtFullDate(m.at)}
                </span>
                {!isLast &&
                  (isOpen ? (
                    <ChevronUp size={14} style={{ color: cTxt3 }} />
                  ) : (
                    <ChevronDown size={14} style={{ color: cTxt3 }} />
                  ))}
              </button>

              {isOpen && (
                <div style={{ padding: "0 14px 14px" }}>
                  {!isOut && m.to_email && (
                    <div style={{ fontSize: 11, color: cTxt3, marginBottom: 8 }}>
                      From: {address} · To: {m.to_email}
                      {m.cc_emails ? " · CC: " + m.cc_emails : ""}
                    </div>
                  )}
                  <div
                    className="email-body"
                    style={{ fontSize: 14, color: cTxt, lineHeight: 1.75 }}
                  >
                    {isOut ? (
                      looksLikeHtml(m.body) ? (
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(m.body) }} />
                      ) : (
                        <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                          {m.body}
                        </div>
                      )
                    ) : m.body_html ? (
                      <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(m.body_html) }} />
                    ) : m.body_text ? (
                      <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {m.body_text}
                      </div>
                    ) : (
                      <p style={{ color: cTxt3, fontSize: 13 }}>
                        No body available for this message.
                      </p>
                    )}
                  </div>
                  <AttachmentChips message={m} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {replySlot}
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   Inline reply — Gmail style, inside the conversation.
   The box starts empty; the original is appended as a quote at send time.
   ═══════════════════════════════════════════════════════ */
function InlineReply({
  thread,
  target,
  text,
  onText,
  attachments,
  onPickFiles,
  onRemoveAttachment,
  fileInput,
  showQuote,
  onToggleQuote,
  sending,
  onSend,
}: {
  thread: any;
  target: any;
  text: string;
  onText: (v: string) => void;
  attachments: AttachFile[];
  onPickFiles: () => void;
  onRemoveAttachment: (key: string) => void;
  fileInput: React.ReactNode;
  showQuote: boolean;
  onToggleQuote: () => void;
  sending: boolean;
  onSend: () => void;
}) {
  if (!target) return null;

  var who = target.sender_name || target.from_email || "this conversation";
  var quote = buildQuote(target).replace(/^\n+/, "");

  function onKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <div
      style={{
        borderTop: "1px solid " + cBord,
        padding: "12px 16px",
        background: cSurf,
        flexShrink: 0,
      }}
    >
      {fileInput}

      <div
        style={{
          border: "1px solid " + cBord2,
          borderRadius: 12,
          background: cElev,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "8px 12px",
            borderBottom: "1px solid " + cBord,
            fontSize: 11,
            color: cTxt3,
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <span>
            Reply to <strong style={{ color: cTxt2 }}>{who}</strong>
          </span>
          <span
            style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5 }}
          >
            <span>from</span>
            <strong
              style={{
                color: CLR.blue.text,
                background: CLR.blue.bg,
                borderRadius: 20,
                padding: "2px 8px",
                fontWeight: 700,
              }}
            >
              {thread.address || "default sender"}
            </strong>
          </span>
        </div>

        <textarea
          value={text}
          onChange={function (e) {
            onText(e.target.value);
          }}
          onKeyDown={onKeyDown}
          placeholder={"Write your reply…"}
          style={{
            width: "100%",
            minHeight: 92,
            maxHeight: 320,
            resize: "vertical",
            border: "none",
            outline: "none",
            background: "transparent",
            padding: "12px 14px",
            color: cTxt,
            fontSize: 13,
            lineHeight: 1.7,
            fontFamily: "Inter, sans-serif",
            boxSizing: "border-box",
          }}
        />

        {showQuote && quote && (
          <div
            style={{
              margin: "0 12px 10px",
              padding: "10px 12px",
              borderRadius: 8,
              background: "rgba(0,0,0,0.03)",
              border: "1px solid " + cBord,
              fontSize: 11.5,
              color: cTxt3,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              maxHeight: 180,
              overflow: "auto",
              fontFamily: "Inter, monospace",
            }}
          >
            {quote}
          </div>
        )}

        {attachments.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "0 12px 10px" }}>
            {attachments.map(function (a) {
              return (
                <PendingAttachChip
                  key={a.key}
                  a={a}
                  onRemove={function () {
                    onRemoveAttachment(a.key);
                  }}
                />
              );
            })}
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 12px",
            borderTop: "1px solid " + cBord,
          }}
        >
          <button
            type="button"
            onClick={onPickFiles}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px dashed " + cBord2,
              background: "transparent",
              color: cTxt2,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
            }}
          >
            <Paperclip size={12} /> Attach
          </button>

          {quote && (
            <button
              type="button"
              onClick={onToggleQuote}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 8px",
                borderRadius: 8,
                border: "none",
                background: "transparent",
                color: cTxt3,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {showQuote ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showQuote ? "Hide quoted text" : "Show quoted text"}
            </button>
          )}

          <span style={{ marginLeft: "auto", fontSize: 10, color: cTxt3 }}>⌘/Ctrl + ↵</span>

          <button
            type="button"
            onClick={onSend}
            disabled={sending || !text.trim()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 18px",
              borderRadius: 9,
              border: "none",
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
              cursor: sending || !text.trim() ? "not-allowed" : "pointer",
              background:
                sending || !text.trim() ? "#94A3B8" : "linear-gradient(135deg, #2563EB, #7C3AED)",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {sending ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Sending…
              </>
            ) : (
              <>
                <Reply size={13} /> Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Sent detail — one outbound message from the flat log
   ═══════════════════════════════════════════════════════ */
function SentDetail({ email, onBack }: { email: any; onBack: () => void }) {
  return (
    <>
      <div
        style={{
          padding: "12px 18px",
          borderBottom: "1px solid " + cBord,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="email-tap"
          aria-label="Back to list"
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: cTxt2,
            padding: 0,
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: cTxt,
              fontFamily: "Syne, sans-serif",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {email.subject || "(no subject)"}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
        <div
          style={{
            marginBottom: 20,
            padding: "14px 16px",
            background: cElev,
            borderRadius: 12,
            border: "1px solid " + cBord2,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: cTxt }}>To: {email.to_email}</div>
          <div style={{ fontSize: 11, color: cTxt3, marginTop: 2 }}>
            {fmtFullDate(email.sent_at)}
          </div>
          {email.from_email && (
            <div style={{ fontSize: 11, color: cTxt3, marginTop: 6 }}>From: {email.from_email}</div>
          )}
          <AttachmentChips message={{ ...email, direction: "out" }} />
        </div>
        <div className="email-body" style={{ fontSize: 14, color: cTxt, lineHeight: 1.75 }}>
          {looksLikeHtml(email.body) ? (
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(email.body) }} />
          ) : (
            <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{email.body}</div>
          )}
        </div>
      </div>
    </>
  );
}
