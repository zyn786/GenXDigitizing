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
  const { activeConversationId, setActiveConversationId, setMobileView, deleteConversation, currentUserRole } = useChat();
  const [hovered, setHovered] = useState(false);
  const isActive = activeConversationId === conv.id;
  const order = conv.linkedOrder;
  const time = conv.lastMessageAt
    ? formatTime(conv.lastMessageAt)
    : "";
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
      className={`w-full text-left px-3 py-3 border-b border-[var(--border)]
        transition-colors cursor-pointer flex gap-3 items-start relative group min-w-0
        ${isActive
          ? "from-[#8B5CF6]/10 to-[#8B5CF6]/05 border-l-[3px] border-l-[#7C3AED]"
          : "hover:bg-[var(--elevated)] border-l-[3px] border-l-transparent"
        }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {conv.clientAvatar ? (
          <Image width={36} height={36} src={conv.clientAvatar} alt={conv.clientName} className="w-9 h-9 rounded-full object-cover" />
        ) : (
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs"
          style={{
            background: `linear-gradient(135deg, ${isActive ? "#7C3AED" : "#6B7280"}, ${isActive ? "#06B6D4" : "#9CA3AF"})`,
          }}
        >
          {conv.clientName.charAt(0)}
        </div>
        )}
        {order && (
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--surface)] ${STATUS_DOT[order.status] ?? "bg-[var(--txt3)]"}`}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-[13px] font-semibold truncate" style={{ color: "var(--txt)" }}>
            {conv.clientName}
            {conv.priority !== "normal" && (
              <span className="ml-1 text-[10px]">{PRIORITY_ICON[conv.priority]}</span>
            )}
          </span>
          <span className="text-[10px] text-[#4B5563] flex-shrink-0">{time}</span>
        </div>

        {order && (
          <p className="text-[11px] mb-0.5 truncate flex items-center gap-1.5" style={{color:"var(--txt2)"}}>
            {order.status === "revision" && <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0" style={{background:"rgba(219,39,119,0.12)",color:"#DB2777"}}>Revision</span>}
            <span className="font-mono font-semibold" style={{color:"var(--txt)"}}>{order.orderNumber}</span>
            {" · "}{order.service}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 min-w-0">
          <p className="text-[11.5px] text-[#374151] truncate min-w-0">
            {conv.isTyping ? (
              <span className="text-[#7C3AED] italic">typing...</span>
            ) : (
              formatPreview(conv.lastMessage)
            )}
          </p>
          {conv.unreadCount > 0 && (
            <span className="min-w-[18px] h-[18px] rounded-full bg-[#7C3AED] text-white
              text-[10px] font-bold flex items-center justify-center px-1 flex-shrink-0">
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
            if (confirm(`Delete entire conversation with ${conv.clientName}?\n\nAll messages will be permanently deleted.`)) {
              deleteConversation(conv.id);
            }
          }}
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg flex items-center justify-center
            text-[#4B5563] hover:text-[#DC2626] hover:bg-[#DC2626]/10
            transition-all cursor-pointer bg-transparent border-none z-10"
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
  const {
    filteredConversations,
    statusFilter,
    setStatusFilter,
    currentUserRole,
  } = useChat();

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[var(--surface)] border-r border-[var(--border)] min-w-0 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare size={16} className="text-[#7C3AED]" />
          <h2 className="font-syne font-bold text-sm" style={{ color: "var(--txt)" }}>{currentUserRole === "admin" ? "Support Inbox" : "Messages"}</h2>
          <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full
            bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20">
            {filteredConversations.length}
          </span>
        </div>

        {/* Unified search — conversations + start new chat */}
        <UnifiedSearch />

        {/* Status filter */}
        <div className="flex gap-1 overflow-x-auto scrollbar-none flex-nowrap pb-0.5">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`flex-shrink-0 whitespace-nowrap text-[11px] font-semibold px-2.5 py-1.5 rounded-full border transition-all cursor-pointer active:scale-95
                ${statusFilter === opt.value
                  ? "bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/30"
                  : "bg-[var(--border)] text-[#4B5563] border-[var(--border2)] hover:text-[#374151]"
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <MessageSquare size={24} className="text-[#4B5563] mb-3" />
            <p className="text-[13px] text-[#374151] font-medium">No conversations found</p>
            <p className="text-[11px] text-[#4B5563] mt-1">Try a different search or filter</p>
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
                <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#4B5563]">
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
