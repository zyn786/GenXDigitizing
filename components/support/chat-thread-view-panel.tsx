"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Download, FileText, Paperclip, Pencil, Search, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ChatAttachmentRecord, ChatPresenceRecord, ChatThreadDetail, PendingChatAttachment } from "@/lib/chat/types";

/* ── Image MIME detection ── */
function isImageMime(mimeType: string) {
  return /^image\/(jpeg|png|webp|gif)$/i.test(mimeType);
}

/* ── Format bytes ── */
function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── Attachment chip with optional image preview ── */
function AttachmentItem({ attachment }: { attachment: ChatAttachmentRecord }) {
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const isImage = isImageMime(attachment.mimeType);

  const fetchViewUrl = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/chat/attachments/${attachment.id}/view`);
      if (!res.ok) { setError(true); return; }
      const data = (await res.json()) as { viewUrl?: string };
      if (data.viewUrl) setViewUrl(data.viewUrl);
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [attachment.id]);

  function handleDownload() {
    if (viewUrl) window.open(viewUrl, "_blank", "noopener");
    else fetchViewUrl().then(() => {
      // After fetch, re-trigger download via the updated viewUrl
      // We use a timeout to let state settle
      setTimeout(() => {
        // Re-fetch to get fresh URL for download
        fetch(`/api/chat/attachments/${attachment.id}/view`)
          .then(r => r.json())
          .then((d: { viewUrl?: string }) => {
            if (d.viewUrl) window.open(d.viewUrl, "_blank", "noopener");
          })
          .catch(() => {});
      }, 100);
    });
  }

  // Eager-load preview URL for images — intentional init-side-effect
  useEffect(() => {
    if (isImage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchViewUrl();
    }
  }, [isImage, fetchViewUrl]);

  if (isImage && loading) {
    return (
      <div className="flex h-40 w-full items-center justify-center rounded-xl border border-border/30 bg-background/20">
        <span className="text-xs text-muted-foreground">Loading preview…</span>
      </div>
    );
  }

  if (isImage && error) {
    return <FileChip attachment={attachment} onDownload={handleDownload} />;
  }

  if (isImage && viewUrl) {
    return (
      <div className="group relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={viewUrl}
          alt={attachment.fileName}
          className="max-h-64 w-full rounded-xl border border-border/30 object-cover"
          onError={() => setError(true)}
          loading="lazy"
        />
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between rounded-b-xl bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
          <span className="truncate text-[10px] text-white/80">{attachment.fileName}</span>
          <button
            type="button"
            onClick={handleDownload}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white transition hover:bg-white/30"
            aria-label="Download"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return <FileChip attachment={attachment} onDownload={handleDownload} />;
}

function FileChip({
  attachment,
  onDownload,
}: {
  attachment: ChatAttachmentRecord;
  onDownload: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onDownload}
      className="inline-flex items-center gap-2 rounded-lg border border-border/30 bg-background/30 px-2.5 py-1.5 text-[11px] transition hover:bg-background/50"
    >
      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="max-w-[140px] truncate">{attachment.fileName}</span>
      <span className="shrink-0 text-muted-foreground/60">{formatBytes(attachment.sizeBytes)}</span>
      <Download className="h-3 w-3 shrink-0 text-muted-foreground/60" />
    </button>
  );
}

type Props = {
  mode: "client" | "admin";
  actorId: string;
  thread: ChatThreadDetail | null;
  presences: ChatPresenceRecord[];
  typingNames: string[];
  draft: string;
  sending: boolean;
  error: string | null;
  internalOnly: boolean;
  pendingAttachments: PendingChatAttachment[];
  editingMessageId: string | null;
  editingDraft: string;
  savingEdit: boolean;
  setDraft: (value: string) => void;
  setInternalOnly: (value: boolean) => void;
  setEditingDraft: (value: string) => void;
  onSend: () => void;
  onAttachClick: () => void;
  onStartEdit: (messageId: string, body: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onBack: () => void;
};

function formatReceiptLabel(status: { deliveredAt: string | null; seenAt: string | null } | null) {
  if (!status) return "";
  if (status.seenAt) return "Seen";
  if (status.deliveredAt) return "Delivered";
  return "";
}

function canEditMessage(mode: "client" | "admin", actorId: string, message: NonNullable<ChatThreadDetail>["messages"][number]) {
  if (message.senderUserId !== actorId) return false;
  if (mode === "admin") return true;
  if (!message.clientEditableUntil) return false;
  return new Date(message.clientEditableUntil).getTime() > Date.now();
}

function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatThreadViewPanel({
  mode, actorId, thread, presences, typingNames,
  draft, sending, error, internalOnly, pendingAttachments,
  editingMessageId, editingDraft, savingEdit,
  setDraft, setInternalOnly, setEditingDraft,
  onSend, onAttachClick, onStartEdit, onCancelEdit, onSaveEdit,
  onBack,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [thread?.messages, pendingAttachments.length]);

  const headerSubtitle = useMemo(() => {
    if (!thread) return null;
    if (thread.thread.type === "ORDER") return "Order conversation";
    if (thread.thread.type === "INVOICE") return "Invoice conversation";
    return mode === "client" ? "General support" : "Support queue";
  }, [mode, thread]);

  /* ── Search ── */
  const [searchQuery, setSearchQuery] = useState("");

  const { filteredMessages, matchCount } = useMemo(() => {
    const messages = thread?.messages ?? [];
    if (!searchQuery.trim()) {
      return { filteredMessages: messages, matchCount: 0 };
    }
    const q = searchQuery.toLowerCase();
    const matches = messages.filter((m) => {
      if (m.body && m.body.toLowerCase().includes(q)) return true;
      if (m.attachments.some((a) => a.fileName.toLowerCase().includes(q))) return true;
      return false;
    });
    return { filteredMessages: matches, matchCount: matches.length };
  }, [thread?.messages, searchQuery]);

  function highlightMatch(text: string): React.ReactNode {
    if (!searchQuery.trim()) return text;
    const q = searchQuery;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="rounded-sm bg-amber-400/30 px-0.5 text-inherit">{text.slice(idx, idx + q.length)}</mark>
        {highlightMatch(text.slice(idx + q.length))}
      </>
    );
  }

  /* ── No thread selected ── */
  if (!thread) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="max-w-sm rounded-xl border border-border/60 bg-muted/20 px-6 py-10 text-center">
          <p className="text-base font-semibold">Select a conversation</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Choose a conversation from the list to view messages.
          </p>
        </div>
      </div>
    );
  }

  const onlineCount = presences.filter((item) => item.status === "ONLINE").length;

  // Enter sends, Shift+Enter for newline
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sending && (draft.trim() || pendingAttachments.length > 0)) {
        onSend();
      }
    }
  }

  return (
    <section className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-border/60 px-4 py-3">
        <div className="flex items-start gap-3">
          {/* Back button — mobile only */}
          <button
            type="button"
            onClick={onBack}
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/30 transition hover:bg-muted/60 lg:hidden"
            aria-label="Back to conversation list"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">{headerSubtitle}</p>
              {onlineCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-px text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {onlineCount} online
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-base font-semibold">{thread.thread.subject}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {thread.thread.assignedToName ?? "Support queue"}
            </p>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="shrink-0 border-b border-border/40 px-4 py-2">
        <div className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages…"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
          />
          {searchQuery.trim() && (
            <>
              <span className="shrink-0 text-[11px] text-muted-foreground">{matchCount} match{matchCount !== 1 ? "es" : ""}</span>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted/40 hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-4 [scrollbar-width:thin]">
        {thread.messages.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
            No messages yet. Start the conversation below.
          </div>
        ) : searchQuery.trim() && filteredMessages.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
            No messages match &ldquo;{searchQuery}&rdquo;.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMessages.map((message) => {
              const mine = message.senderUserId === actorId;
              const receiptLabel = formatReceiptLabel(message.receipt);
              const editable = canEditMessage(mode, actorId, message);
              const isInternal = message.visibility === "INTERNAL_ONLY";

              return (
                <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm ${
                      mine
                        ? "bg-primary text-primary-foreground"
                        : isInternal
                          ? "border border-amber-500/20 bg-amber-500/5"
                          : "border border-border/60 bg-muted/20"
                    }`}
                  >
                    {/* Sender + edit */}
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] ${mine ? "opacity-70" : "font-medium"}`}>
                        {message.senderName}
                      </span>
                      {isInternal && (
                        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-1.5 py-px text-[9px] text-amber-600 dark:text-amber-400">
                          Internal
                        </span>
                      )}
                      {editable && editingMessageId !== message.id && (
                        <button
                          type="button"
                          onClick={() => onStartEdit(message.id, message.body ?? "")}
                          className="ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] opacity-50 transition hover:opacity-100"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                      )}
                    </div>

                    {/* Message body or edit form */}
                    {editingMessageId === message.id ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          value={editingDraft}
                          onChange={(e) => setEditingDraft(e.target.value)}
                          className="min-h-[5rem] w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <div className="flex gap-2">
                          <Button variant="default" size="sm" shape="pill" onClick={onSaveEdit} disabled={savingEdit || !editingDraft.trim()}>
                            {savingEdit ? "Saving…" : "Save"}
                          </Button>
                          <Button variant="outline" size="sm" shape="pill" onClick={onCancelEdit}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      message.body && (
                        <p className="mt-1 whitespace-pre-wrap break-words">
                          {searchQuery.trim() ? highlightMatch(message.body) : message.body}
                        </p>
                      )
                    )}

                    {/* Attachments */}
                    {message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map((a) => (
                          <AttachmentItem key={a.id} attachment={a} />
                        ))}
                      </div>
                    )}

                    {/* Timestamp + receipt */}
                    <p className={`mt-1.5 text-[10px] ${mine ? "opacity-50" : "opacity-40"}`}>
                      {formatMessageTime(message.createdAt)}
                      {receiptLabel && ` · ${receiptLabel}`}
                      {message.editCount > 0 && " · edited"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {typingNames.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground italic">
            {typingNames.join(", ")} typing…
          </p>
        )}
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-border/60 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        {/* Pending attachments */}
        {pendingAttachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {pendingAttachments.map((a) => (
              <span
                key={a.tempId}
                className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground"
              >
                {a.fileName}
              </span>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Composer row */}
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={onAttachClick}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/20 text-muted-foreground transition hover:bg-muted/40 hover:text-foreground"
            aria-label="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="min-h-[2.5rem] max-h-32 flex-1 resize-none rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            placeholder={mode === "admin" ? "Reply or leave internal note…" : "Write a message…"}
          />

          <Button
            onClick={onSend}
            disabled={sending || (!draft.trim() && pendingAttachments.length === 0)}
            variant="premium"
            shape="pill"
            size="default"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">{sending ? "Sending" : "Send"}</span>
          </Button>
        </div>

        {/* Footer row */}
        {mode === "admin" ? (
          <label className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={internalOnly}
              onChange={(e) => setInternalOnly(e.target.checked)}
              className="accent-primary rounded"
            />
            Send as internal note
          </label>
        ) : (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Attachments up to 200 MB. You can edit messages for 1 minute.
          </p>
        )}
      </div>
    </section>
  );
}
