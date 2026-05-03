"use client";

import { useEffect, useMemo, useRef } from "react";
import { Paperclip, Pencil, Send } from "lucide-react";

import type {
  ChatPresenceRecord,
  ChatThreadDetail,
  PendingChatAttachment,
} from "@/lib/chat/types";

type ChatThreadViewPanelProps = {
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

function formatReceiptLabel(status: {
  deliveredAt: string | null;
  seenAt: string | null;
} | null) {
  if (!status) return "";
  if (status.seenAt) return "Seen";
  if (status.deliveredAt) return "Delivered";
  return "";
}

function canEditMessage(
  mode: "client" | "admin",
  actorId: string,
  message: NonNullable<ChatThreadDetail>["messages"][number]
) {
  if (message.senderUserId !== actorId) return false;
  if (mode === "admin") return true;
  if (!message.clientEditableUntil) return false;
  return new Date(message.clientEditableUntil).getTime() > Date.now();
}

export function ChatThreadViewPanel({
  mode,
  actorId,
  thread,
  presences,
  typingNames,
  draft,
  sending,
  error,
  internalOnly,
  pendingAttachments,
  editingMessageId,
  editingDraft,
  savingEdit,
  setDraft,
  setInternalOnly,
  setEditingDraft,
  onSend,
  onAttachClick,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
}: ChatThreadViewPanelProps) {
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
        <div className="max-w-md rounded-[2rem] border border-border/80 bg-background/50 p-6 text-center">
          <div className="text-lg font-semibold">Select a thread</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a conversation from the left panel to view live messages.
          </p>
        </div>
      </div>
    );
  }

  const onlineCount = presences.filter((item) => item.status === "ONLINE").length;

  return (
    <section className="flex h-full flex-col">
      <div className="border-b border-border/80 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-muted-foreground">{headerSubtitle}</div>
            <div className="mt-1 text-2xl font-semibold">{thread.thread.subject}</div>
            <div className="mt-2 text-sm text-muted-foreground">
              {thread.thread.assignedToName
                ? `Assigned to ${thread.thread.assignedToName}`
                : "Support queue"}
            </div>
          </div>

          <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100">
            {onlineCount} online
          </div>
        </div>
      </div>

      <div ref={scrollerRef} className="flex-1 space-y-4 overflow-y-auto p-5">
        {thread.messages.length === 0 ? (
          <div className="rounded-[1.5rem] border border-border/80 bg-background/50 p-4 text-sm text-muted-foreground">
            No messages yet.
          </div>
        ) : (
          thread.messages.map((message) => {
            const mine = message.senderUserId === actorId;
            const receiptLabel = formatReceiptLabel(message.receipt);
            const editable = canEditMessage(mode, actorId, message);

            return (
              <div
                key={message.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[78%] rounded-[1.75rem] px-4 py-3 text-sm ${
                    mine
                      ? "bg-primary text-primary-foreground"
                      : message.visibility === "INTERNAL_ONLY"
                        ? "border border-amber-400/20 bg-amber-500/10 text-foreground"
                        : "border border-border/80 bg-secondary text-secondary-foreground"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-xs opacity-80">
                      {message.senderName}
                      {message.visibility === "INTERNAL_ONLY" ? " · Internal only" : ""}
                    </div>

                    {editable && editingMessageId !== message.id ? (
                      <button
                        type="button"
                        onClick={() => onStartEdit(message.id, message.body ?? "")}
                        className="inline-flex items-center gap-1 text-[11px] opacity-75 transition hover:opacity-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    ) : null}
                  </div>

                  {editingMessageId === message.id ? (
                    <div className="mt-3 space-y-3">
                      <textarea
                        value={editingDraft}
                        onChange={(event) => setEditingDraft(event.target.value)}
                        placeholder="Edit your message"
                        className="min-h-24 w-full rounded-2xl border border-border/80 bg-background/50 px-3 py-2 text-sm text-foreground"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={onSaveEdit}
                          disabled={savingEdit || !editingDraft.trim()}
                          className="rounded-full bg-primary px-4 py-2 text-xs text-primary-foreground disabled:opacity-50"
                        >
                          {savingEdit ? "Saving" : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={onCancelEdit}
                          className="rounded-full border border-border/80 px-4 py-2 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 whitespace-pre-wrap">{message.body}</div>
                  )}

                  {!!message.attachments.length && (
                    <div className="mt-3 space-y-2">
                      {message.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-xs"
                        >
                          {attachment.fileName}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 text-[11px] opacity-70">
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {receiptLabel ? ` · ${receiptLabel}` : ""}
                    {message.editCount > 0 ? " · edited" : ""}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {typingNames.length > 0 ? (
          <div className="text-xs text-muted-foreground">
            {typingNames.join(", ")} typing...
          </div>
        ) : null}
      </div>

      <div className="border-t border-border/80 p-4">
        {pendingAttachments.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {pendingAttachments.map((attachment) => (
              <div
                key={attachment.tempId}
                className="rounded-full border border-border/80 bg-secondary/70 px-3 py-1 text-xs text-muted-foreground"
              >
                {attachment.fileName}
              </div>
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="mb-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="flex items-end gap-3">
          <button
            type="button"
            onClick={onAttachClick}
            className="inline-flex h-11 items-center rounded-2xl border border-border/80 bg-background px-4 text-sm"
          >
            <Paperclip className="mr-2 h-4 w-4" />
            Attach
          </button>

          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="min-h-11 flex-1 rounded-2xl border border-border/80 bg-background px-4 py-3 text-sm"
            placeholder={
              mode === "admin"
                ? "Reply or leave internal note"
                : "Write a message"
            }
          />

          <button
            type="button"
            onClick={onSend}
            disabled={sending || (!draft.trim() && pendingAttachments.length === 0)}
            className="inline-flex h-11 items-center rounded-2xl bg-primary px-5 text-sm text-primary-foreground transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="mr-2 h-4 w-4" />
            {sending ? "Sending" : "Send"}
          </button>
        </div>

        {mode === "admin" ? (
          <label className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={internalOnly}
              onChange={(event) => setInternalOnly(event.target.checked)}
            />
            Send as internal note
          </label>
        ) : (
          <div className="mt-3 text-xs text-muted-foreground">
            Attachments up to 200 MB. Clients can edit their own messages for 1 minute.
          </div>
        )}
      </div>
    </section>
  );
}