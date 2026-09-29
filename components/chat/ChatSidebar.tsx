"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Trash2 } from "lucide-react";
import { useChat } from "./ChatProvider";
import { UnifiedSearch } from "./NewChatSearch";
import type { Conversation } from "./types";
import Image from "next/image";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "revision", label: "Revisions" },
  { value: "delivered", label: "Delivered" },
];

const STATUS_DOT: Record<string, string> = {
  pending: "bg-[#EA580C]",
  assigned: "bg-[#0891B2]",
  in_progress: "bg-[#7C3AED]",
  review: "bg-[#F59E0B]",
  revision: "bg-[#DB2777]",
  approved: "bg-[#059669]",
  delivered: "bg-[#059669]",
  cancelled: "bg-[#6B7280]",
};

const PRIORITY_ICON: Record<string, string> = {
  urgent: "🔥",
  high: "⚠️",
  normal: "",
};

function ConversationItem({ conv }: { conv: Conversation }) {
  const {
    activeConversationId,
    setActiveConversationId,
    setMobileView,
    deleteConversation,
    currentUserRole,
  } = useChat();
  const [hovered, setHovered] = useState(false);
  const isActive = activeConversationId === conv.id;
  const order = conv.linkedOrder;
  const time = conv.lastMessageAt ? formatTime(conv.lastMessageAt) : "";
  const canDelete = currentUserRole === "admin";

  return (
    <motion.div
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        if (isActive) {
          setActiveConversationId(null);
          setMobileView("sidebar");
        } else {
          setActiveConversationId(conv.id);
          setMobileView("chat");
        }
      }}
      className={`group relative flex w-full min-w-0 cursor-pointer items-start gap-3 border-b border-[var(--border)] px-3 py-3 text-left transition-colors ${
        isActive
          ? "to-[#8B5CF6]/05 border-l-[3px] border-l-[#7C3AED] from-[#8B5CF6]/10"
          : "border-l-[3px] border-l-transparent hover:bg-[var(--elevated)]"
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {conv.clientAvatar ? (
          <Image
            width={36}
            height={36}
            src={conv.clientAvatar}
            alt={conv.clientName}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{
              background: `linear-gradient(135deg, ${isActive ? "#7C3AED" : "#6B7280"}, ${isActive ? "#06B6D4" : "#9CA3AF"})`,
            }}
          >
            {conv.clientName.charAt(0)}
          </div>
        )}
        {order && (
          <div
            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--surface)] ${STATUS_DOT[order.status] ?? "bg-[var(--txt3)]"}`}
          />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center justify-between gap-2">
          <span className="truncate text-[13px] font-semibold" style={{ color: "var(--txt)" }}>
            {conv.clientName}
            {conv.priority !== "normal" && (
              <span className="ml-1 text-[10px]">{PRIORITY_ICON[conv.priority]}</span>
            )}
          </span>
          <span className="flex-shrink-0 text-[10px] text-[#4B5563]">{time}</span>
        </div>

        {order && (
          <p
            className="mb-0.5 flex items-center gap-1.5 truncate text-[11px]"
            style={{ color: "var(--txt2)" }}
          >
            {order.status === "revision" && (
              <span
                className="flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold"
                style={{ background: "rgba(219,39,119,0.12)", color: "#DB2777" }}
              >
                Revision
              </span>
            )}
            <span className="font-mono font-semibold" style={{ color: "var(--txt)" }}>
              {order.orderNumber}
            </span>
            {" · "}
            {order.service}
          </p>
        )}

        <div className="flex min-w-0 items-center justify-between gap-2">
          <p className="min-w-0 truncate text-[11.5px] text-[#374151]">
            {conv.isTyping ? (
              <span className="italic text-[#7C3AED]">typing...</span>
            ) : (
              formatPreview(conv.lastMessage)
            )}
          </p>
          {conv.unreadCount > 0 && (
            <span className="flex h-[18px] min-w-[18px] flex-shrink-0 items-center justify-center rounded-full bg-[#7C3AED] px-1 text-[10px] font-bold text-white">
              {conv.unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Delete button — admin always visible */}
      {canDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (
              confirm(
                `Delete entire conversation with ${conv.clientName}?\n\nAll messages will be permanently deleted.`
              )
            ) {
              deleteConversation(conv.id);
            }
          }}
          className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-[#4B5563] transition-all hover:bg-[#DC2626]/10 hover:text-[#DC2626]"
          title="Delete conversation"
        >
          <Trash2 size={14} />
        </button>
      )}
    </motion.div>
  );
}

function formatPreview(text: string | undefined): string {
  if (!text) return "No messages yet";
  // Strip reply metadata
  let clean = text;
  if (clean.startsWith("--reply--\n")) {
    const endIdx = clean.indexOf("\n--reply--\n", 10);
    if (endIdx !== -1) clean = clean.slice(endIdx + 11);
  }
  // Strip attachment metadata
  const attIdx = clean.indexOf("\n--attachments--\n");
  if (attIdx !== -1) clean = clean.slice(0, attIdx) || "📎 Attachment";
  return clean || "📎 Attachment";
}

function formatTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60_000);
  const hrs = Math.floor(diff / 3_600_000);

  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function ChatSidebar() {
  const { filteredConversations, statusFilter, setStatusFilter, currentUserRole } = useChat();

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-r border-[var(--border)] bg-[var(--surface)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] p-4">
        <div className="mb-3 flex items-center gap-2">
          <MessageSquare size={16} className="text-[#7C3AED]" />
          <h2 className="font-syne text-sm font-bold" style={{ color: "var(--txt)" }}>
            {currentUserRole === "admin" ? "Support Inbox" : "Messages"}
          </h2>
          <span className="ml-auto rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-2 py-0.5 text-[10px] font-semibold text-[#7C3AED]">
            {filteredConversations.length}
          </span>
        </div>

        {/* Unified search — conversations + start new chat */}
        <UnifiedSearch />

        {/* Status filter */}
        <div className="scrollbar-none flex flex-nowrap gap-1 overflow-x-auto pb-0.5">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`flex-shrink-0 cursor-pointer whitespace-nowrap rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition-all active:scale-95 ${
                statusFilter === opt.value
                  ? "border-[#7C3AED]/30 bg-[#7C3AED]/10 text-[#7C3AED]"
                  : "border-[var(--border2)] bg-[var(--border)] text-[#4B5563] hover:text-[#374151]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation list */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <MessageSquare size={24} className="mb-3 text-[#4B5563]" />
            <p className="text-[13px] font-medium text-[#374151]">No conversations found</p>
            <p className="mt-1 text-[11px] text-[#4B5563]">Try a different search or filter</p>
          </div>
        ) : (
          (() => {
            const hasSections = filteredConversations.some((c) => c.sectionLabel);
            if (!hasSections) {
              return filteredConversations.map((conv) => (
                <ConversationItem key={conv.id} conv={conv} />
              ));
            }

            // Group by sectionLabel
            const sections = new Map<string, Conversation[]>();
            for (const conv of filteredConversations) {
              const label = conv.sectionLabel ?? "General";
              if (!sections.has(label)) sections.set(label, []);
              sections.get(label)!.push(conv);
            }

            return Array.from(sections.entries()).map(([label, convs]) => (
              <div key={label}>
                <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#4B5563]">
                  {label}
                </div>
                {convs.map((conv) => (
                  <ConversationItem key={conv.id} conv={conv} />
                ))}
              </div>
            ));
          })()
        )}
      </div>
    </div>
  );
}
