"use client";

import { useEffect, useMemo, useRef } from "react";
import { Paperclip, Pencil, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ChatPresenceRecord, ChatThreadDetail, PendingChatAttachment } from "@/lib/chat/types";

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

export function ChatThreadViewPanel({
  mode, actorId, thread, presences, typingNames,
  draft, sending, error, internalOnly, pendingAttachments,
  editingMessageId, editingDraft, savingEdit,
  setDraft, setInternalOnly, setEditingDraft,
  onSend, onAttachClick, onStartEdit, onCancelEdit, onSaveEdit,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [thread?.messages, pendingAttachments.length]);

  const headerSubtitle = useMemo(() => {
    if (!thread) return null;
    if (thread.thread.type === "ORDER") return "Order-linked conversation";
    if (thread.thread.type === "INVOICE") return "Invoice-linked conversation";
    return mode === "client" ? "General support" : "Shared support queue";
  }, [mode, thread]);

  if (!thread) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="max-w-md rounded-[2rem] border border-border/60 bg-card/70 p-8 text-center">
          <p className="text-lg font-semibold">Select a thread</p>
          <p className="mt-2 text-sm text-muted-foreground">Choose a conversation from the left panel to view messages.</p>
        </div>
      </div>
    );
  }

  const onlineCount = presences.filter((item) => item.status === "ONLINE").length;

  return (
    <section className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border/60 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">{headerSubtitle}</p>
            <p className="mt-1 text-xl font-semibold">{thread.thread.subject}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {thread.thread.assignedToName ? `Assigned to ${thread.thread.assignedToName}` : "Support queue"}
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {onlineCount} online
          </span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollerRef} className="flex-1 space-y-4 overflow-y-auto p-5">
        {thread.messages.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            No messages yet. Start the conversation below.
          </div>
        ) : (
          thread.messages.map((message) => {
            const mine = message.senderUserId === actorId;
            const receiptLabel = formatReceiptLabel(message.receipt);
            const editable = canEditMessage(mode, actorId, message);

            return (
              <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm ${
                    mine
                      ? "bg-primary text-primary-foreground"
                      : message.visibility === "INTERNAL_ONLY"
                        ? "border border-amber-500/20 bg-amber-500/10"
                        : "border border-border/60 bg-muted/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs opacity-70">
                      {message.senderName}
                      {message.visibility === "INTERNAL_ONLY" && " · Internal only"}
                    </p>
                    {editable && editingMessageId !== message.id && (
                      <button type="button" onClick={() => onStartEdit(message.id, message.body ?? "")} className="inline-flex items-center gap-1 text-[11px] opacity-60 transition hover:opacity-100">
                        <Pencil className="h-3.5 w-3.5" />Edit
                      </button>
                    )}
                  </div>

                  {editingMessageId === message.id ? (
                    <div className="mt-3 space-y-3">
                      <textarea value={editingDraft} onChange={(e) => setEditingDraft(e.target.value)} placeholder="Edit your message" className="min-h-24 w-full rounded-2xl border border-border/60 bg-background/50 px-3 py-2 text-sm text-foreground" />
                      <div className="flex gap-2">
                        <Button variant="default" size="sm" shape="pill" onClick={onSaveEdit} disabled={savingEdit || !editingDraft.trim()}>
                          {savingEdit ? "Saving" : "Save"}
                        </Button>
                        <Button variant="outline" size="sm" shape="pill" onClick={onCancelEdit}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 whitespace-pre-wrap">{message.body}</p>
                  )}

                  {message.attachments.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {message.attachments.map((a) => (
                        <div key={a.id} className="rounded-xl border border-border/40 bg-background/40 px-3 py-1.5 text-xs">{a.fileName}</div>
                      ))}
                    </div>
                  )}

                  <p className="mt-2 text-[11px] opacity-50">
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {receiptLabel ? ` · ${receiptLabel}` : ""}
                    {message.editCount > 0 ? " · edited" : ""}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {typingNames.length > 0 && (
          <p className="text-xs text-muted-foreground">{typingNames.join(", ")} typing...</p>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border/60 p-4">
        {pendingAttachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {pendingAttachments.map((a) => (
              <span key={a.tempId} className="rounded-full border border-border/60 bg-muted/60 px-3 py-1 text-xs text-muted-foreground">{a.fileName}</span>
            ))}
          </div>
        )}

        {error && (
          <div className="mb-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>
        )}

        <div className="flex items-end gap-3">
          <Button type="button" variant="outline" size="default" onClick={onAttachClick}>
            <Paperclip className="mr-1.5 h-4 w-4" />Attach
          </Button>

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-11 flex-1 rounded-2xl border border-input bg-card/70 px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder={mode === "admin" ? "Reply or leave internal note" : "Write a message"}
          />

          <Button onClick={onSend} disabled={sending || (!draft.trim() && pendingAttachments.length === 0)} variant="premium" shape="pill">
            <Send className="mr-1.5 h-4 w-4" />{sending ? "Sending" : "Send"}
          </Button>
        </div>

        {mode === "admin" ? (
          <label className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={internalOnly} onChange={(e) => setInternalOnly(e.target.checked)} className="accent-primary" />
            Send as internal note
          </label>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">Attachments up to 200 MB. You can edit your messages for 1 minute.</p>
        )}
      </div>
    </section>
  );
}
