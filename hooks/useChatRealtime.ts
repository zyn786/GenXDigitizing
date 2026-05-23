// @ts-nocheck
"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Conversation, Message } from "@/components/chat/types";

function parseMessageBody(rawBody: string) {
  let body = rawBody || "";
  let replyTo: Message["replyTo"] | undefined;
  let attachments: any[] | undefined;

  // Parse reply
  if (body.startsWith("--reply--\n")) {
    const endIdx = body.indexOf("\n--reply--\n", 10);
    if (endIdx !== -1) {
      try {
        const replyMeta = JSON.parse(body.slice(10, endIdx));
        replyTo = { id: replyMeta.id, content: replyMeta.c, senderName: replyMeta.n };
        body = body.slice(endIdx + 11);
      } catch { /* ignore */ }
    }
  }

  // Parse attachments
  const attSplit = body.split("\n--attachments--\n");
  if (attSplit.length === 2) {
    body = attSplit[0];
    try {
      attachments = attSplit[1].split("||").map((s: string) => {
        const meta = JSON.parse(s);
        return { id: `att-${Date.now()}-${Math.random()}`, name: meta.n, url: meta.u, type: meta.t, size: meta.s };
      });
    } catch { /* ignore */ }
  }

  return { body, replyTo, attachments };
}

interface UseChatRealtimeProps {
  conversations: Conversation[];
  setConversations: (updater: (prev: Conversation[]) => Conversation[]) => void;
  currentUserId: string;
  enabled?: boolean;
}

export function useChatRealtime({
  conversations,
  setConversations,
  currentUserId,
  enabled = true,
}: UseChatRealtimeProps) {
  const supabase = createClient();
  const convRef = useRef(conversations);
  convRef.current = conversations;

  useEffect(() => {
    if (!enabled || !currentUserId) return;

    const channel = supabase
      .channel(`chat-${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const newMsg = payload.new as any;
          if (!newMsg) return;

          // Skip own messages (already optimistically inserted)
          if (newMsg.from_user === currentUserId) return;

          // Only process messages addressed to this user
          if (newMsg.to_user !== currentUserId) return;

          // Fetch sender profile for name
          let senderName = "User";
          let senderRole = "client";
          try {
            const { data: sender } = await supabase
              .from("users")
              .select("full_name, role")
              .eq("id", newMsg.from_user)
              .single();
            if (sender) {
              senderName = sender.role === "admin" ? "Support Team" : (sender.full_name || "Client");
              senderRole = sender.role || "client";
            }
          } catch { /* use defaults */ }

          const partnerId = newMsg.from_user;
          const key = `conv-${partnerId}`;

          setConversations((prev) => {
            // Prevent duplicates
            for (const c of prev) {
              if (c.messages.some((m) => m.id === newMsg.id)) return prev;
            }

            const existing = prev.find((c) => c.id === key);

            const { body, replyTo, attachments } = parseMessageBody(newMsg.body ?? "");

            const chatMsg: Message = {
              id: newMsg.id,
              conversationId: key,
              senderId: partnerId,
              senderName,
              senderRole: senderRole as Message["senderRole"],
              content: body,
              replyTo,
              attachments,
              timestamp: newMsg.created_at ? new Date(newMsg.created_at) : new Date(),
              status: "delivered",
            };

            if (existing) {
              return prev.map((c) =>
                c.id === key
                  ? {
                      ...c,
                      clientName: senderRole === "admin" ? "Support Team" : (existing.clientName !== "New Message" ? existing.clientName : senderName),
                      messages: [...c.messages, chatMsg],
                      lastMessage: newMsg.body?.slice(0, 80) ?? "New message",
                      lastMessageAt: new Date(newMsg.created_at),
                      unreadCount: c.unreadCount + 1,
                      orderId: newMsg.order_id || c.orderId,
                      ...(newMsg.order_id ? {
                        linkedOrder: c.linkedOrder || { id: newMsg.order_id, orderNumber: "#"+String(newMsg.order_id).slice(0,8), status: "pending", service: "", turnaround: "Standard" },
                      } : {}),
                    }
                  : c
              );
            }

            // New conversation from unknown sender
            const newConv: Conversation = {
              id: key,
              clientName: senderRole === "admin" ? "Support Team" : senderName,
              clientEmail: "",
              companyName: "",
              recipientId: partnerId,
              recipientRole: senderRole as Conversation["recipientRole"],
              sectionLabel: senderRole === "designer" ? "Designers" : senderRole === "crm" ? "CRM Team" : "Clients",
              category: "order",
              priority: "normal",
              lastMessage: newMsg.body?.slice(0, 80),
              lastMessageAt: new Date(newMsg.created_at),
              unreadCount: 1,
              isTyping: false,
              messages: [chatMsg],
              isPinned: false,
              orderId: newMsg.order_id || undefined,
              linkedOrder: newMsg.order_id ? { id: newMsg.order_id, orderNumber: "#"+String(newMsg.order_id).slice(0,8), status: "pending", service: "", turnaround: "Standard" } : undefined,
            };

            return [newConv, ...prev];
          });
        }
      )
      // ── Read receipts: listen for is_read updates ──────────
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => {
          const updated = payload.new as any;
          if (!updated) return;
          // Only care about read receipts for messages WE sent
          if (updated.from_user !== currentUserId) return;
          if (!updated.is_read) return;

          setConversations((prev) =>
            prev.map((c) => ({
              ...c,
              messages: c.messages.map((m) =>
                m.id === updated.id
                  ? { ...m, status: "read" as Message["status"] }
                  : m
              ),
            }))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, currentUserId, supabase, setConversations]);
}
