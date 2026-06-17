// @ts-nocheck
"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useChatRealtime } from "@/hooks/useChatRealtime";
import { toast } from "sonner";
import type { Conversation, Message, MessageStatus, Attachment, VoiceNote, LinkedOrder } from "./types";

interface ChatContextType {
  conversations: Conversation[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  activeConversation: Conversation | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  setConversations: (updater: (prev: Conversation[]) => Conversation[]) => void;
  sendMessage: (content: string, attachments?: File[], voiceBlob?: Blob) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  canDeleteMessage: (message: Message) => boolean;
  canEditMessage: (message: Message) => boolean;
  markAsRead: (conversationId: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  linkOrder: (conversationId: string, order: LinkedOrder | null) => void;
  replyTo: { id: string; content: string; senderName: string } | null;
  setReplyTo: (reply: { id: string; content: string; senderName: string } | null) => void;
  clientOrders: LinkedOrder[];
  filteredConversations: Conversation[];
  isMobileSidebar: boolean;
  setMobileView: (view: "sidebar" | "chat") => void;
  mobileView: "sidebar" | "chat";
  currentUserId: string;
  currentUserRole: "admin" | "crm" | "client" | "designer";
  isUploading: boolean;
  uploadProgress: number;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => Promise<Blob | null>;
  recordingTime: number;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}

interface ChatProviderProps {
  children: React.ReactNode;
  initialConversations: Conversation[];
  currentUserId: string;
  currentUserName?: string;
  currentUserRole?: "admin" | "crm" | "client" | "designer";
  clientOrders?: LinkedOrder[];
}

export function ChatProvider({
  children,
  initialConversations,
  currentUserId,
  currentUserName = "You",
  currentUserRole = "admin",
  clientOrders = [],
}: ChatProviderProps) {
  const supabase = createClient();
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialConversations.length > 0 ? initialConversations[0].id : null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mobileView, setMobileView] = useState<"sidebar" | "chat">("sidebar");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; senderName: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingChannel = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Real-time subscription ────────────────────────────────
  useChatRealtime({
    conversations,
    setConversations,
    currentUserId,
    enabled: true,
  });

  // ── Typing indicator broadcast ────────────────────────────
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase.channel(`typing-${currentUserId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "typing" }, (payload: any) => {
        const { userId, conversationId, isTyping } = payload.payload || {};
        if (!userId || !conversationId) return;

        setConversations((prev) =>
          prev.map((c) => {
            const key = `conv-${userId}`;
            if (c.id === key || c.id === conversationId) {
              return { ...c, isTyping };
            }
            return c;
          })
        );
      })
      .subscribe();

    typingChannel.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, supabase]);

  const activeConversation = activeConversationId
    ? conversations.find((c) => c.id === activeConversationId) ?? null
    : null;

  const isMobileSidebar = typeof window !== "undefined" && window.innerWidth < 768;

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      !searchQuery ||
      c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.linkedOrder?.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.linkedOrder?.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || c.linkedOrder?.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ── Upload file helper (uses API route to bypass RLS) ─────
  const uploadFile = useCallback(
    async (file: File, _orderId?: string): Promise<Attachment | null> => {
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        const fd = new FormData();
        fd.append("file", file);

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(pct);
          }
        });

        xhr.addEventListener("load", () => {
          setUploadProgress(100);
          try {
            if (xhr.status < 200 || xhr.status >= 300) {
              toast.error("Upload failed");
              resolve(null);
              return;
            }
            const data = JSON.parse(xhr.responseText);
            const ext = file.name.split(".").pop()?.toLowerCase() ?? "file";

            const typeMap: Record<string, Attachment["type"]> = {
              dst: "embroidery", pes: "embroidery", emb: "embroidery",
              jef: "embroidery", xxx: "embroidery", vip: "embroidery",
              hus: "embroidery", exp: "embroidery",
              jpg: "image", jpeg: "image", png: "image", gif: "image",
              webp: "image", avif: "image", svg: "vector",
              ai: "vector", eps: "vector", pdf: "document",
              zip: "archive", rar: "archive",
            };

            resolve({
              id: `att-${Date.now()}`,
              name: file.name,
              type: typeMap[ext] ?? "document",
              size: file.size,
              url: data.url || data.path,
            });
          } catch (err: any) {
            toast.error(`Upload error: ${err?.message ?? "unknown"}`);
            resolve(null);
          }
        });

        xhr.addEventListener("error", () => {
          toast.error("Upload failed");
          resolve(null);
        });

        xhr.open("POST", "/api/chat/upload");
        xhr.send(fd);
      });
    },
    []
  );

  // ── Voice recording ───────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      if (navigator.permissions) {
        const micStatus = await navigator.permissions.query({ name: "microphone" as PermissionName });
        if (micStatus.state === "denied") {
          toast.error("Microphone blocked. Enable it in your browser site settings.");
          return;
        }
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunks.current = [];
      mediaRecorder.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimer.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch {
      toast.error("Microphone access denied. Please allow microphone permissions.");
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorder.current || mediaRecorder.current.state === "inactive") {
        setIsRecording(false);
        if (recordingTimer.current) clearInterval(recordingTimer.current);
        resolve(null);
        return;
      }

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: "audio/webm" });
        setIsRecording(false);
        if (recordingTimer.current) clearInterval(recordingTimer.current);
        resolve(blob);
      };

      mediaRecorder.current.stop();
    });
  }, []);

  // ── Send message ──────────────────────────────────────────
  const sendMessage = useCallback(
    async (content: string, files?: File[], voiceBlob?: Blob) => {
      if (!activeConversationId) {
        toast.error("No conversation selected");
        return;
      }
      const conv = conversations.find((c) => c.id === activeConversationId);
      if (!conv) {
        toast.error("Conversation not found");
        return;
      }
      if (!conv.recipientId) {
        toast.error("No recipient — cannot send message");
        return;
      }

      const orderId = conv.orderId;
      setIsUploading(true);

      // Upload attachments
      const attachments: Attachment[] = [];
      if (files?.length) {
        for (const file of files) {
          const att = await uploadFile(file, orderId);
          if (att) attachments.push(att);
        }
      }

      // Upload voice note
      let voiceNote: VoiceNote | undefined;
      if (voiceBlob) {
        const path = `chat/voice/${currentUserId}/${Date.now()}.webm`;
        const { error: upErr } = await supabase.storage.from("outputs").upload(path, voiceBlob);
        if (!upErr) {
          voiceNote = {
            id: `vn-${Date.now()}`,
            duration: recordingTime,
            url: path,
            played: false,
          };
        }
      }

      // Build message body with reply + attachment metadata
      let body = content || (voiceBlob ? "🎤 Voice message" : "");
      if (replyTo) {
        body = `--reply--\n${JSON.stringify({ id: replyTo.id, c: replyTo.content, n: replyTo.senderName })}\n--reply--\n${body}`;
      }
      if (attachments.length > 0) {
        const attMeta = attachments.map(a => JSON.stringify({ n: a.name, u: a.url, t: a.type, s: a.size })).join("||");
        body = body ? `${body}\n--attachments--\n${attMeta}` : `📎 ${attachments.length} file(s)\n--attachments--\n${attMeta}`;
      }

      // Optimistic local insert
      const tempId = `m-${Date.now()}`;
      const newMsg: Message = {
        id: tempId,
        conversationId: activeConversationId,
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: currentUserRole,
        content: body,
        timestamp: new Date(),
        status: "sending",
        attachments: attachments.length > 0 ? attachments : undefined,
        voiceNote,
        replyTo: replyTo ?? undefined,
      };

      // Clear reply after sending
      setReplyTo(null);

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeConversationId) return c;
          return {
            ...c,
            messages: [...c.messages, newMsg],
            lastMessage: body.slice(0, 80),
            lastMessageAt: new Date(),
            isTyping: false,
          };
        })
      );

      // Stop typing
      clearTimeout(typingTimers.current.get(activeConversationId));
      typingTimers.current.delete(activeConversationId);

      // Insert into Supabase
      const { data: inserted, error } = await (supabase
        .from("messages") as any)
        .insert({
          body,
          from_user: currentUserId,
          to_user: conv.recipientId,
          order_id: orderId ?? null,
          is_read: false,
        })
        .select("id")
        .single();

      setIsUploading(false);

      if (error) {
        toast.error(error.message || "Failed to send message");
        // Remove optimistic message on failure
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== activeConversationId) return c;
            return {
              ...c,
              messages: c.messages.filter((m) => m.id !== tempId),
            };
          })
        );
        return;
      }

      // Update optimistic message with real ID and status
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeConversationId) return c;
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === tempId
                ? { ...m, id: inserted?.id ?? tempId, status: "sent" as MessageStatus }
                : m
            ),
          };
        })
      );

      // Notify recipient
      fetch("/api/message-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_user: conv.recipientId, body }),
      }).catch(() => {});

      // Sync CRM lead: client reply → contacted
      if (currentUserRole === "client") {
        fetch("/api/crm/sync-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUserId }),
        }).catch(() => {});
      }

      // Notify recipient: admin/CRM reply → persistent notification for client
      if ((currentUserRole === "admin" || currentUserRole === "crm") && conv.recipientId) {
        fetch("/api/chat/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toUserId: conv.recipientId,
            fromName: "Support Team",
            body: body.slice(0, 80),
            orderId: orderId,
          }),
        }).catch(() => {});
      }

      // If files were uploaded, create order_files records for the order
      if (attachments.length > 0 && orderId) {
        for (const att of attachments) {
          await (supabase.from("order_files") as any).insert({
            order_id: orderId,
            file_url: att.url,
            file_name: att.name,
            file_type: "reference",
            file_size_kb: Math.round(att.size / 1024),
            uploaded_by: currentUserId,
            notes: `Uploaded via chat`,
          });
        }
      }
    },
    [
      activeConversationId,
      conversations,
      currentUserId,
      currentUserName,
      currentUserRole,
      recordingTime,
      replyTo,
      uploadFile,
      supabase,
    ]
  );

  // ── Delete message ────────────────────────────────────────
  const deleteMessage = useCallback(
    async (messageId: string) => {
      // Optimistic remove from local state
      setConversations((prev) =>
        prev.map((c) => ({
          ...c,
          messages: c.messages.filter((m) => m.id !== messageId),
          lastMessage: c.messages.length <= 1
            ? undefined
            : c.messages.filter((m) => m.id !== messageId).at(-1)?.content?.slice(0, 80),
        }))
      );

      // Delete from Supabase
      const { error } = await (supabase.from("messages") as any)
        .delete()
        .eq("id", messageId);

      if (error) {
        toast.error("Failed to delete message");
      }
    },
    [supabase]
  );

  // ── Delete entire conversation ────────────────────────────
  const deleteConversation = useCallback(
    async (conversationId: string) => {
      const conv = conversations.find((c) => c.id === conversationId);
      if (!conv) return;

      const messageIds = conv.messages.map((m) => m.id);
      if (messageIds.length === 0) {
        // No messages — just remove from list
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        if (activeConversationId === conversationId) {
          setActiveConversationId(null);
        }
        return;
      }

      // Optimistic remove
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
      }

      // Delete all messages from Supabase
      const { error } = await (supabase.from("messages") as any)
        .delete()
        .in("id", messageIds);

      if (error) {
        toast.error("Failed to delete conversation");
      }
    },
    [conversations, activeConversationId, supabase]
  );

  const markAsRead = useCallback(
    async (conversationId: string) => {
      // Optimistic UI update
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== conversationId) return c;
          return {
            ...c,
            unreadCount: 0,
            messages: c.messages.map((m) =>
              m.senderId !== currentUserId && m.status !== "read"
                ? { ...m, status: "read" as MessageStatus }
                : m
            ),
          };
        })
      );

      // Mark as read in Supabase (batch update unread messages in this conversation)
      const conv = conversations.find((c) => c.id === conversationId);
      if (conv) {
        const unreadIds = conv.messages
          .filter((m) => m.senderId !== currentUserId && m.status !== "read")
          .map((m) => m.id);

        if (unreadIds.length > 0) {
          await (supabase.from("messages") as any)
            .update({ is_read: true })
            .in("id", unreadIds);
        }
      }
    },
    [conversations, currentUserRole, supabase]
  );

  const startTyping = useCallback((conversationId: string) => {
    clearTimeout(typingTimers.current.get(conversationId));
    // Only broadcast — don't set local isTyping (that comes from receiving broadcasts)
    typingChannel.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: currentUserId, conversationId, isTyping: true },
    });
    const timer = setTimeout(() => stopTyping(conversationId), 5000);
    typingTimers.current.set(conversationId, timer);
  }, [currentUserId]);

  const stopTyping = useCallback((conversationId: string) => {
    clearTimeout(typingTimers.current.get(conversationId));
    typingTimers.current.delete(conversationId);
    typingChannel.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: currentUserId, conversationId, isTyping: false },
    });
  }, [currentUserId]);

  // ── Permission helpers ───────────────────────────────────
  const canDeleteMessage = useCallback(
    (message: Message) => {
      if (currentUserRole === "admin" || currentUserRole === "crm") return true;
      return message.senderId === currentUserId;
    },
    [currentUserId, currentUserRole]
  );

  const canEditMessage = useCallback(
    (message: Message) => {
      return message.senderId === currentUserId;
    },
    [currentUserId]
  );

  // ── Edit message ──────────────────────────────────────────
  const editMessage = useCallback(
    async (messageId: string, content: string) => {
      if (!content.trim()) return;
      setConversations((prev) =>
        prev.map((c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === messageId
              ? { ...m, content, edited: true }
              : m
          ),
        }))
      );
      const { error } = await (supabase.from("messages") as any)
        .update({ body: content, edited: true, edited_at: new Date().toISOString() })
        .eq("id", messageId);
      if (error) toast.error("Failed to edit message");
    },
    [supabase]
  );

  const linkOrder = useCallback((conversationId: string, order: LinkedOrder | null) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, linkedOrder: order ?? undefined, orderId: order?.id ?? undefined }
          : c
      )
    );
  }, []);

  // Auto mark-as-read when conversation is opened OR new messages arrive
  const activeMsgCount = activeConversation?.messages.length ?? 0;
  useEffect(() => {
    if (activeConversationId) markAsRead(activeConversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId, activeMsgCount]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        setConversations,
        activeConversationId,
        setActiveConversationId,
        activeConversation,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        sendMessage,
        deleteMessage,
        editMessage,
        deleteConversation,
        canDeleteMessage,
        canEditMessage,
        markAsRead,
        startTyping,
        stopTyping,
        linkOrder,
        replyTo,
        setReplyTo,
        clientOrders,
        filteredConversations,
        isMobileSidebar,
        setMobileView,
        mobileView,
        currentUserId,
        currentUserRole,
        isUploading,
        uploadProgress,
        isRecording,
        startRecording,
        stopRecording,
        recordingTime,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
