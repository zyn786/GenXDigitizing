"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Truck,
  RefreshCw,
  FileText,
  Trash2,
  Info,
  X,
} from "lucide-react";
import { useChat } from "./ChatProvider";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import type { OrderStatus } from "./types";
import Image from "next/image";

function ClientInfoBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="from-[#2563EB]/6 to-[#7C3AED]/6 border-[#2563EB]/12 mx-3 mt-2 flex-shrink-0 rounded-2xl border bg-gradient-to-br p-3 sm:mx-4 sm:p-4">
      {/* Header */}
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED]">
            <Info className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-syne text-xs font-bold text-[var(--txt)] sm:text-sm">
            How can we help?
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--txt2)] transition-colors hover:bg-[var(--elevated)]"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
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
            className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white/50 px-2.5 py-2"
          >
            <span className="flex-shrink-0 text-sm">{item.emoji}</span>
            <span className="text-[10px] font-medium leading-tight text-[var(--txt2)] sm:text-[11px]">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-2.5 text-center text-[10px] text-[var(--txt2)] sm:text-[11px]">
        We typically reply within 1 hour during business hours
      </p>
    </div>
  );
}

const STATUS_CONFIG: Record<OrderStatus, { icon: React.ReactNode; color: string; label: string }> =
  {
    pending: { icon: <Clock size={12} />, color: "#D97706", label: "Pending" },
    assigned: { icon: <FileText size={12} />, color: "#0891B2", label: "Assigned" },
    in_progress: { icon: <RefreshCw size={12} />, color: "#7C3AED", label: "In Progress" },
    review: { icon: <CheckCircle size={12} />, color: "#D97706", label: "Review" },
    revision: { icon: <RefreshCw size={12} />, color: "#DC2626", label: "Revision" },
    approved: { icon: <CheckCircle size={12} />, color: "#0E7490", label: "Approved" },
    delivered: { icon: <Truck size={12} />, color: "#16A34A", label: "Delivered" },
    cancelled: { icon: <CheckCircle size={12} />, color: "#4B5563", label: "Cancelled" },
  };

function TypingIndicator() {
  return (
    <div className="mb-2 flex items-center gap-2 px-4 py-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED]/20 to-[#0E7490]/20">
        <span className="text-[11px]">✏️</span>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      <span className="text-[11px] italic text-[var(--txt2)]">typing...</span>
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
      <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden bg-[var(--bg)]">
        <div className="px-4 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#7C3AED]/15 bg-gradient-to-br from-[#7C3AED]/10 to-[#0E7490]/10">
            <span className="text-3xl">💬</span>
          </div>
          <h3 className="mb-2 font-syne text-[15px] font-bold text-[var(--txt)]">
            {currentUserRole === "client" ? "Support Chat" : "Messages"}
          </h3>
          {currentUserRole === "client" ? (
            <div className="mx-auto max-w-[300px]">
              <p className="mb-3 text-[13px] leading-relaxed text-[var(--txt2)]">
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
                  <div
                    key={item}
                    className="bg-[var(--elevated)]/50 rounded-lg px-2.5 py-1.5 text-[11px] text-[var(--txt2)]"
                  >
                    {item}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-[var(--txt2)]">Reply within 1 hour</p>
            </div>
          ) : (
            <p className="max-w-[240px] text-[13px] leading-relaxed text-[var(--txt2)]">
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
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--bg)]">
      {/* ── Premium Header ────────────────────────────────── */}
      <div className="sticky top-0 z-10 flex min-w-0 flex-shrink-0 items-center gap-2.5 overflow-hidden border-b border-[var(--border)] bg-white/95 px-3 py-3 sm:gap-3 sm:px-4">
        {/* Back (mobile) — hidden for clients */}
        {currentUserRole !== "client" && (
          <button
            onClick={() => setMobileView("sidebar")}
            className="flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl border-none bg-transparent text-[var(--txt2)] transition-all hover:bg-[var(--elevated)] hover:text-[var(--txt)] active:scale-95 md:hidden"
          >
            <ArrowLeft size={18} />
          </button>
        )}

        {/* Avatar + online dot */}
        <div className="relative flex-shrink-0">
          {activeConversation.clientAvatar ? (
            <Image
              width={40}
              height={40}
              src={activeConversation.clientAvatar}
              alt={activeConversation.clientName}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #7C3AED, #0E7490)" }}
            >
              {activeConversation.clientName.charAt(0)}
            </div>
          )}
          <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[var(--surface)] bg-[#16A34A]" />
        </div>

        {/* Name + status */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-syne text-sm font-bold text-[var(--txt)] sm:text-[15px]">
              {currentUserRole === "client" ? "Support Team" : activeConversation.clientName}
            </h3>
            {activeConversation.priority === "urgent" && (
              <span className="rounded-md border border-[#DC2626]/20 bg-[#DC2626]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#DC2626]">
                Urgent
              </span>
            )}
          </div>
          <p className="truncate text-[11px] text-[var(--txt2)]">
            {activeConversation.isTyping ? (
              <span className="animate-pulse font-medium text-[#7C3AED]">typing...</span>
            ) : (
              activeConversation.companyName || activeConversation.clientEmail || ""
            )}
          </p>
        </div>

        {/* Order chip — admin/crm/designer only */}
        {order && statusCfg && currentUserRole !== "client" && (
          <div
            className="flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
            style={{
              background: `${statusCfg.color}12`,
              color: statusCfg.color,
              border: `1px solid ${statusCfg.color}30`,
            }}
          >
            {statusCfg.icon}
            <span className="font-mono font-bold">{order.orderNumber}</span>
          </div>
        )}
      </div>

      {/* ── Order info bar — admin/crm/designer only ──────── */}
      {order && currentUserRole !== "client" && (
        <div className="bg-[var(--elevated)]/30 flex min-w-0 flex-shrink-0 flex-wrap items-center gap-2 overflow-hidden border-b border-[var(--border)] px-3 py-1.5 text-[10px] sm:gap-4 sm:px-4 sm:text-[11px]">
          <span className="truncate font-medium text-[var(--txt2)]">{order.service}</span>
          {order.designName && (
            <span className="max-w-[120px] truncate text-[var(--txt2)]">{order.designName}</span>
          )}
          <span className="ml-auto flex-shrink-0 text-[var(--txt2)]">{order.turnaround}</span>
        </div>
      )}

      {/* ── Client info banner ────────────────────────────── */}
      {currentUserRole === "client" && <ClientInfoBanner />}

      {/* ── Messages area ─────────────────────────────────── */}
      <div
        className="bg-[var(--elevated)]/20 min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 sm:px-4 sm:py-3"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
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
