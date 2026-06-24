"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle, Clock, Truck, RefreshCw, FileText, Trash2, Info, X } from "lucide-react";
import { useChat } from "./ChatProvider";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import type { OrderStatus } from "./types";

function ClientInfoBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="flex-shrink-0 mx-3 sm:mx-4 mt-2 p-3 sm:p-4 rounded-2xl
      bg-gradient-to-br from-[#2563EB]/6 to-[#7C3AED]/6
      border border-[#2563EB]/12">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center">
            <Info className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-syne font-bold text-xs sm:text-sm text-[var(--txt)]">
            How can we help?
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="w-6 h-6 rounded-full flex items-center justify-center
            hover:bg-[var(--elevated)] transition-colors text-[var(--txt2)]"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick actions grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {[
          { emoji: "📋", label: "Order status & tracking" },
          { emoji: "🔄", label: "File revision requests" },
          { emoji: "📐", label: "Size or format changes" },
          { emoji: "📎", label: "Attach artwork or files" },
          { emoji: "⚡", label: "Rush order inquiries" },
          { emoji: "💬", label: "General questions" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 px-2.5 py-2 rounded-xl
              bg-white/50 border border-[var(--border)]"
          >
            <span className="text-sm flex-shrink-0">{item.emoji}</span>
            <span className="text-[10px] sm:text-[11px] text-[var(--txt2)] leading-tight font-medium">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <p className="text-[10px] sm:text-[11px] text-[var(--txt2)] mt-2.5 text-center">
        We typically reply within 1 hour during business hours
      </p>
    </div>
  );
}

const STATUS_CONFIG: Record<OrderStatus, { icon: React.ReactNode; color: string; label: string }> = {
  pending:    { icon: <Clock size={12} />,       color: "#D97706", label: "Pending" },
  assigned:   { icon: <FileText size={12} />,    color: "#0891B2", label: "Assigned" },
  in_progress:{ icon: <RefreshCw size={12} />,   color: "#7C3AED", label: "In Progress" },
  review:     { icon: <CheckCircle size={12} />, color: "#D97706", label: "Review" },
  revision:   { icon: <RefreshCw size={12} />,   color: "#DC2626", label: "Revision" },
  approved:   { icon: <CheckCircle size={12} />,  color: "#0E7490", label: "Approved" },
  delivered:  { icon: <Truck size={12} />,        color: "#16A34A", label: "Delivered" },
  cancelled:  { icon: <CheckCircle size={12} />,  color: "#4B5563", label: "Cancelled" },
};

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 mb-2">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7C3AED]/20 to-[#0E7490]/20
        flex items-center justify-center">
        <span className="text-[11px]">✏️</span>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      <span className="text-[11px] text-[var(--txt2)] italic">typing...</span>
    </div>
  );
}

export function ChatWindow() {
  const {
    activeConversation,
    setActiveConversationId,
    setMobileView,
    currentUserId,
    currentUserRole,
    deleteConversation,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages, activeConversation?.isTyping]);

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg)] min-h-0 min-w-0 overflow-hidden">
        <div className="text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7C3AED]/10 to-[#0E7490]/10
            border border-[#7C3AED]/15 flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl">💬</span>
          </div>
          <h3 className="font-syne font-bold text-[15px] text-[var(--txt)] mb-2">
            {currentUserRole === "client" ? "Support Chat" : "Messages"}
          </h3>
          {currentUserRole === "client" ? (
            <div className="max-w-[300px] mx-auto">
              <p className="text-[13px] text-[var(--txt2)] mb-3 leading-relaxed">
                Message our support team anytime. We&apos;re here to help with your orders.
              </p>
              <div className="grid grid-cols-2 gap-1.5 text-left">
                {[
                  "📋 Order status",
                  "🔄 Revisions",
                  "📐 Format changes",
                  "📎 Attach files",
                  "⚡ Rush orders",
                  "💬 Questions",
                ].map((item) => (
                  <div key={item} className="text-[11px] text-[var(--txt2)] bg-[var(--elevated)]/50 px-2.5 py-1.5 rounded-lg">
                    {item}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[var(--txt2)] mt-3">
                Reply within 1 hour
              </p>
            </div>
          ) : (
            <p className="text-[13px] text-[var(--txt2)] max-w-[240px] leading-relaxed">
              Select a conversation or search by email to start a new chat.
            </p>
          )}
        </div>
      </div>
    );
  }

  const order = activeConversation.linkedOrder;
  const statusCfg = order ? STATUS_CONFIG[order.status] : null;

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg)] min-h-0 min-w-0 overflow-hidden">
      {/* ── Premium Header ────────────────────────────────── */}
      <div className="flex-shrink-0 px-3 sm:px-4 py-3 border-b border-[var(--border)]
        bg-white/95 flex items-center gap-2.5 sm:gap-3 sticky top-0 z-10 min-w-0 overflow-hidden">
        {/* Back (mobile) — hidden for clients */}
        {currentUserRole !== "client" && (
          <button
            onClick={() => setMobileView("sidebar")}
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center
              text-[var(--txt2)] hover:text-[var(--txt)] hover:bg-[var(--elevated)]
              bg-transparent border-none cursor-pointer flex-shrink-0 active:scale-95 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
        )}

        {/* Avatar + online dot */}
        <div className="relative flex-shrink-0">
          {activeConversation.clientAvatar ? (
            <img src={activeConversation.clientAvatar} alt={activeConversation.clientName} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs"
              style={{ background: "linear-gradient(135deg, #7C3AED, #0E7490)" }}>
              {activeConversation.clientName.charAt(0)}
            </div>
          )}
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#16A34A] border-2 border-[var(--surface)]" />
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-syne font-bold text-sm sm:text-[15px] text-[var(--txt)] truncate">
              {currentUserRole === "client" ? "Support Team" : activeConversation.clientName}
            </h3>
            {activeConversation.priority === "urgent" && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20 font-bold uppercase tracking-wider">
                Urgent
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--txt2)] truncate">
            {activeConversation.isTyping ? (
              <span className="text-[#7C3AED] font-medium animate-pulse">typing...</span>
            ) : (
              activeConversation.companyName || activeConversation.clientEmail || ""
            )}
          </p>
        </div>

        {/* Order chip — admin/crm/designer only */}
        {order && statusCfg && currentUserRole !== "client" && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold flex-shrink-0"
            style={{ background: `${statusCfg.color}12`, color: statusCfg.color, border: `1px solid ${statusCfg.color}30` }}>
            {statusCfg.icon}
            <span className="font-mono font-bold">{order.orderNumber}</span>
          </div>
        )}

      </div>

      {/* ── Order info bar — admin/crm/designer only ──────── */}
      {order && currentUserRole !== "client" && (
        <div className="flex-shrink-0 px-3 sm:px-4 py-1.5 border-b border-[var(--border)]
          bg-[var(--elevated)]/30 flex items-center gap-2 sm:gap-4 text-[10px] sm:text-[11px] flex-wrap min-w-0 overflow-hidden">
          <span className="font-medium text-[var(--txt2)] truncate">{order.service}</span>
          {order.designName && <span className="text-[var(--txt2)] truncate max-w-[120px]">{order.designName}</span>}
          <span className="text-[var(--txt2)] ml-auto flex-shrink-0">{order.turnaround}</span>
        </div>
      )}

      {/* ── Client info banner ────────────────────────────── */}
      {currentUserRole === "client" && (
        <ClientInfoBanner />
      )}

      {/* ── Messages area ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-4 py-2 sm:py-3 bg-[var(--elevated)]/20 min-h-0 min-w-0"
        style={{ WebkitOverflowScrolling: "touch" }}>
        <AnimatePresence>
          {activeConversation.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === currentUserId} />
          ))}
        </AnimatePresence>
        {activeConversation.isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ──────────────────────────────────────────── */}
      <MessageInput showQuickReplies />
    </div>
  );
}
