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
  const [pageVisible, setPageVisible] = useState(true);

  // Keep draftRef current so interval callbacks always read latest draft value
  // eslint-disable-next-line react-hooks/refs
  draftRef.current = draft;

  // Dedup refs — prevent overlapping requests
  const fetchingThreadsRef = useRef(false);
  const fetchingDetailRef = useRef(false);
  const fetchingPresenceRef = useRef(false);

  // Backoff ref — exponential backoff on consecutive failures
  const failCountRef = useRef(0);
  const pollIntervalRef = useRef(3000);

  function resetBackoff() {
    failCountRef.current = 0;
    pollIntervalRef.current = 3000;
  }

  function bumpBackoff() {
    failCountRef.current += 1;
    const delays = [3000, 5000, 10000, 20000, 30000];
    pollIntervalRef.current = delays[Math.min(failCountRef.current, delays.length - 1)];
  }

  // Conditional fetch refs — store last known timestamps for 304
  const lastThreadsModifiedRef = useRef<string | null>(null);
  const lastDetailModifiedRef = useRef<string | null>(null);

  const selectedThreadId = useMemo(
    () => selectedThread?.thread.id ?? null,
    [selectedThread]
  );

  // On mobile, show thread view when a thread is selected; otherwise show list
  const hasSelectedThread = selectedThread !== null;

  // Pause polling when tab is hidden
  useEffect(() => {
    const onVisibilityChange = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedThread(null);
    setPresences([]);
    setTypingNames([]);
    setDraft("");
    setPendingAttachments([]);
    setEditingMessageId(null);
    lastDetailModifiedRef.current = null;
  }, []);

  /* ── Fetch helpers with dedup + 304 ── */

  const fetchThreads = useCallback(async () => {
    if (fetchingThreadsRef.current) return;
    fetchingThreadsRef.current = true;

    try {
      const headers: Record<string, string> = {};
      if (lastThreadsModifiedRef.current) {
        headers["If-Modified-Since"] = lastThreadsModifiedRef.current;
      }

      const response = await fetch("/api/chat/threads", {
        method: "GET",
        cache: "no-store",
        headers,
      });

      if (response.status === 304) { resetBackoff(); return; }
      if (!response.ok) { bumpBackoff(); return; }

      resetBackoff();

      // Store last-modified for next conditional request
      const lm = response.headers.get("Last-Modified");
      if (lm) lastThreadsModifiedRef.current = lm;

      const data = (await response.json()) as {
        threads: ChatThreadListItem[];
      };

      setThreads(data.threads);
    } catch {
      bumpBackoff();
    } finally {
      fetchingThreadsRef.current = false;
    }
  }, []);

  const fetchThreadDetail = useCallback(async (threadId: string) => {
    if (fetchingDetailRef.current) return;
    fetchingDetailRef.current = true;

    try {
      const headers: Record<string, string> = {};
      if (lastDetailModifiedRef.current) {
        headers["If-Modified-Since"] = lastDetailModifiedRef.current;
      }

      const response = await fetch(`/api/chat/threads/${threadId}`, {
        method: "GET",
        cache: "no-store",
        headers,
      });

      if (response.status === 304) { resetBackoff(); return; }
      if (!response.ok) { bumpBackoff(); return; }

      resetBackoff();

      const lm = response.headers.get("Last-Modified");
      if (lm) lastDetailModifiedRef.current = lm;

      const data = (await response.json()) as {
        thread: ChatThreadDetail;
      };

      setSelectedThread(data.thread);
    } catch {
      bumpBackoff();
    } finally {
      fetchingDetailRef.current = false;
    }
  }, []);

  const fetchPresence = useCallback(async (threadId: string) => {
    if (fetchingPresenceRef.current) return;
    fetchingPresenceRef.current = true;

    try {
      const response = await fetch(`/api/chat/threads/${threadId}/presence`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) { bumpBackoff(); return; }

      resetBackoff();

      const data = (await response.json()) as {
        presences: ChatPresenceRecord[];
        typingNames: string[];
      };

      setPresences(data.presences);
      setTypingNames(data.typingNames);
    } finally {
      fetchingPresenceRef.current = false;
    }
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

  /* ── Polling intervals ── */

  useEffect(() => {
    void updatePresence({ status: "ONLINE", isTyping: false, threadId: null });
  }, [updatePresence]);

  // Thread list poll — only when no thread is selected (detail poll covers it otherwise)
  useEffect(() => {
    if (selectedThreadId) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchThreads();

    const timer = window.setInterval(() => {
      void fetchThreads();
    }, pageVisible ? 5000 : 30000);

    return () => window.clearInterval(timer);
  }, [fetchThreads, selectedThreadId, pageVisible]);

  // Active thread poll — detail + presence + threads combined
  useEffect(() => {
    if (!selectedThreadId) return;

    /* eslint-disable react-hooks/set-state-in-effect */
    void markRead(selectedThreadId);
    void fetchThreadDetail(selectedThreadId);
    void fetchPresence(selectedThreadId);
    void fetchThreads();
    /* eslint-enable react-hooks/set-state-in-effect */

    const pollMs = pageVisible ? 5000 : 30000;
    const timer = window.setInterval(() => {
      void fetchThreadDetail(selectedThreadId);
      void fetchPresence(selectedThreadId);
      void fetchThreads();
    }, pollMs);

    const heartbeat = window.setInterval(() => {
      const currentDraft = draftRef.current;
      void updatePresence({
        status: "ONLINE",
        isTyping: Boolean(currentDraft.trim()),
        threadId: currentDraft.trim() ? selectedThreadId : null,
      });
    }, 10000);

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
    pageVisible,
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

      <div className="mx-auto grid h-[calc(100dvh-7rem)] max-w-7xl overflow-hidden rounded-2xl border border-border/60 bg-card lg:grid-cols-[340px_1fr]">
        {/* Thread list — always visible on desktop, conditionally on mobile */}
        <div className={hasSelectedThread ? "hidden lg:flex lg:flex-col" : "flex flex-col"}>
          <ChatThreadListPanel
            mode={mode}
            threads={threads}
            selectedThreadId={selectedThreadId}
            onThreadSelect={(thread) => setSelectedThread(thread)}
          />
        </div>

        {/* Thread view — always visible on desktop, conditionally on mobile */}
        <div className={hasSelectedThread ? "flex flex-col" : "hidden lg:flex lg:flex-col"}>
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
            onBack={handleBackToList}
          />
        </div>
      </div>
    </>
  );
}
