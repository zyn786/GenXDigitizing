"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ChatThreadListPanel } from "@/components/support/chat-thread-list-panel";
import { ChatThreadViewPanel } from "@/components/support/chat-thread-view-panel";
import type {
  ChatMessageRecord,
  ChatPresenceRecord,
  ChatThreadDetail,
  ChatThreadListItem,
  PendingChatAttachment,
} from "@/lib/chat/types";

type ChatSupportShellProps = {
  mode: "client" | "admin";
  actorId: string;
  actorName: string;
  initialThreads: ChatThreadListItem[];
  initialSelectedThread?: ChatThreadDetail | null;
};

export function ChatSupportShell({
  mode,
  actorId,
  actorName,
  initialThreads,
  initialSelectedThread = null,
}: ChatSupportShellProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [threads, setThreads] = useState(initialThreads);
  const [selectedThread, setSelectedThread] = useState<ChatThreadDetail | null>(
    initialSelectedThread
  );
  const [presences, setPresences] = useState<ChatPresenceRecord[]>([]);
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const draftRef = useRef(draft);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [internalOnly, setInternalOnly] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PendingChatAttachment[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Keep draftRef current so interval callbacks always read latest draft value
  // eslint-disable-next-line react-hooks/refs
  draftRef.current = draft;

  const selectedThreadId = useMemo(
    () => selectedThread?.thread.id ?? null,
    [selectedThread]
  );

  const fetchThreads = useCallback(async () => {
    const response = await fetch("/api/chat/threads", {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) return;

    const data = (await response.json()) as {
      threads: ChatThreadListItem[];
    };

    setThreads(data.threads);
  }, []);

  const fetchThreadDetail = useCallback(async (threadId: string) => {
    const response = await fetch(`/api/chat/threads/${threadId}`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) return;

    const data = (await response.json()) as {
      thread: ChatThreadDetail;
    };

    setSelectedThread(data.thread);
  }, []);

  const fetchPresence = useCallback(async (threadId: string) => {
    const response = await fetch(`/api/chat/threads/${threadId}/presence`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) return;

    const data = (await response.json()) as {
      presences: ChatPresenceRecord[];
      typingNames: string[];
    };

    setPresences(data.presences);
    setTypingNames(data.typingNames);
  }, []);

  const markRead = useCallback(async (threadId: string) => {
    await fetch(`/api/chat/threads/${threadId}/read`, {
      method: "POST",
    });
  }, []);

  const updatePresence = useCallback(
    async (payload: {
      status?: "ONLINE" | "AWAY" | "OFFLINE";
      isTyping?: boolean;
      threadId?: string | null;
    }) => {
      await fetch("/api/chat/presence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    },
    []
  );

  useEffect(() => {
    void updatePresence({ status: "ONLINE", isTyping: false, threadId: null });
  }, [updatePresence]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void fetchThreads();
    }, 10000);

    return () => window.clearInterval(timer);
  }, [fetchThreads]);

  useEffect(() => {
    if (!selectedThreadId) return;

    // Data-fetching on thread selection — standard React pattern.
    // Functions below internally call setState via async request handlers.
    /* eslint-disable react-hooks/set-state-in-effect */
    void markRead(selectedThreadId);
    void fetchThreadDetail(selectedThreadId);
    void fetchPresence(selectedThreadId);
    /* eslint-enable react-hooks/set-state-in-effect */

    const timer = window.setInterval(() => {
      void fetchThreadDetail(selectedThreadId);
      void fetchThreads();
      void fetchPresence(selectedThreadId);
    }, 8000);

    const heartbeat = window.setInterval(() => {
      const currentDraft = draftRef.current;
      void updatePresence({
        status: "ONLINE",
        isTyping: Boolean(currentDraft.trim()),
        threadId: currentDraft.trim() ? selectedThreadId : null,
      });
    }, 15000);

    return () => {
      window.clearInterval(timer);
      window.clearInterval(heartbeat);
      void updatePresence({
        status: "ONLINE",
        isTyping: false,
        threadId: null,
      });
    };
  }, [
    fetchPresence,
    fetchThreadDetail,
    fetchThreads,
    markRead,
    selectedThreadId,
    updatePresence,
  ]);

  useEffect(() => {
    if (!selectedThreadId) return;

    const timer = window.setTimeout(() => {
      void updatePresence({
        status: "ONLINE",
        isTyping: Boolean(draft.trim()),
        threadId: draft.trim() ? selectedThreadId : null,
      });
    }, 600);

    return () => window.clearTimeout(timer);
  }, [draft, selectedThreadId, updatePresence]);

  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;

    setError(null);

    for (const file of Array.from(files)) {
      if (file.size > 200 * 1024 * 1024) {
        setError(`"${file.name}" exceeds the 200 MB limit.`);
        continue;
      }

      try {
        const intentResponse = await fetch("/api/chat/uploads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            sizeBytes: file.size,
          }),
        });

        const intentData = (await intentResponse.json()) as {
          uploadUrl?: string;
          attachment?: Omit<PendingChatAttachment, "tempId">;
          error?: string;
        };

        if (!intentResponse.ok || !intentData.uploadUrl || !intentData.attachment) {
          setError(intentData.error ?? `Failed to prepare upload for "${file.name}".`);
          continue;
        }

        const uploadResponse = await fetch(intentData.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          setError(`Failed to upload "${file.name}".`);
          continue;
        }

        setPendingAttachments((current) => [
          ...current,
          {
            tempId: crypto.randomUUID(),
            ...intentData.attachment!,
          },
        ]);
      } catch {
        setError(`Failed to upload "${file.name}".`);
      }
    }
  }, []);

  const handleSend = useCallback(async () => {
    if (!selectedThreadId || (!draft.trim() && pendingAttachments.length === 0)) {
      return;
    }

    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessageRecord = {
      id: optimisticId,
      senderUserId: actorId,
      senderName: actorName,
      senderRole: null,
      visibility:
        mode === "admin" && internalOnly ? "INTERNAL_ONLY" : "CLIENT_VISIBLE",
      type: "TEXT",
      body: draft.trim() || null,
      replyToMessageId: null,
      editedAt: null,
      editCount: 0,
      clientEditableUntil:
        mode === "client"
          ? new Date(Date.now() + 60_000).toISOString()
          : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachments: pendingAttachments.map((attachment) => ({
        id: attachment.tempId,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
        bucket: attachment.bucket,
        objectKey: attachment.objectKey,
        createdAt: new Date().toISOString(),
      })),
      receipt: null,
    };

    const previousDraft = draft;
    const previousAttachments = pendingAttachments;

    setSelectedThread((current) =>
      current
        ? {
            ...current,
            messages: [...current.messages, optimisticMessage],
          }
        : current
    );

    setDraft("");
    setPendingAttachments([]);
    setInternalOnly(false);
    setSending(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/chat/threads/${selectedThreadId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            body: previousDraft.trim(),
            visibility:
              mode === "admin" && internalOnly
                ? "INTERNAL_ONLY"
                : "CLIENT_VISIBLE",
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            attachments: previousAttachments.map(({ tempId, ...rest }) => rest),
          }),
        }
      );

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setSelectedThread((current) =>
          current
            ? {
                ...current,
                messages: current.messages.filter((item) => item.id !== optimisticId),
              }
            : current
        );
        setDraft(previousDraft);
        setPendingAttachments(previousAttachments);
        setError(data.error ?? "Failed to send message.");
        return;
      }

      await Promise.all([
        fetchThreadDetail(selectedThreadId),
        fetchThreads(),
        fetchPresence(selectedThreadId),
      ]);
      await markRead(selectedThreadId);
    } catch {
      setSelectedThread((current) =>
        current
          ? {
              ...current,
              messages: current.messages.filter((item) => item.id !== optimisticId),
            }
          : current
      );
      setDraft(previousDraft);
      setPendingAttachments(previousAttachments);
      setError("Failed to send message.");
    } finally {
      setSending(false);
    }
  }, [
    actorId,
    actorName,
    draft,
    fetchPresence,
    fetchThreadDetail,
    fetchThreads,
    internalOnly,
    markRead,
    mode,
    pendingAttachments,
    selectedThreadId,
  ]);

  const handleStartEdit = useCallback((messageId: string, body: string) => {
    setEditingMessageId(messageId);
    setEditingDraft(body);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditingDraft("");
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingMessageId || !editingDraft.trim()) return;

    const messageId = editingMessageId;
    const nextBody = editingDraft.trim();

    setSelectedThread((current) =>
      current
        ? {
            ...current,
            messages: current.messages.map((message) =>
              message.id === messageId
                ? {
                    ...message,
                    body: nextBody,
                    editCount: message.editCount + 1,
                    editedAt: new Date().toISOString(),
                  }
                : message
            ),
          }
        : current
    );

    setSavingEdit(true);
    setError(null);

    try {
      const response = await fetch(`/api/chat/messages/${messageId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: nextBody,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Failed to edit message.");
        return;
      }

      if (selectedThreadId) {
        await fetchThreadDetail(selectedThreadId);
      }

      setEditingMessageId(null);
      setEditingDraft("");
    } catch {
      setError("Failed to edit message.");
    } finally {
      setSavingEdit(false);
    }
  }, [editingDraft, editingMessageId, fetchThreadDetail, selectedThreadId]);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        title="Attach files to message"
        onChange={(event) => {
          void handleFileChange(event.target.files);
          event.currentTarget.value = "";
        }}
      />

      <div className="mx-auto grid h-[calc(100vh-8rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-border/80 bg-card/70 lg:grid-cols-[340px_1fr]">
        <ChatThreadListPanel
          mode={mode}
          threads={threads}
          selectedThreadId={selectedThreadId}
        />

        <ChatThreadViewPanel
          mode={mode}
          actorId={actorId}
          thread={selectedThread}
          presences={presences}
          typingNames={typingNames}
          draft={draft}
          sending={sending}
          error={error}
          internalOnly={internalOnly}
          pendingAttachments={pendingAttachments}
          editingMessageId={editingMessageId}
          editingDraft={editingDraft}
          savingEdit={savingEdit}
          setDraft={setDraft}
          setInternalOnly={setInternalOnly}
          setEditingDraft={setEditingDraft}
          onSend={handleSend}
          onAttachClick={handleAttachClick}
          onStartEdit={handleStartEdit}
          onCancelEdit={handleCancelEdit}
          onSaveEdit={handleSaveEdit}
        />
      </div>
    </>
  );
}