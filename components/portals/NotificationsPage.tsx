"use client";

import { useState } from "react";
import Image from "next/image";
import { useNotificationContext } from "@/hooks/NotificationProvider";
import { formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Bell, CheckCheck, Loader2, RefreshCw, Star } from "lucide-react";
import type { NotifType } from "@/types";

const txt = "var(--txt)";
const txt2 = "var(--txt2)";
const txt3 = "var(--txt3)";

const TC = [
  {
    bg: "#3B82F6",
    bgSoft: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.25)",
    icon: "#2563EB",
    text: "#1D4ED8",
    glow: "rgba(59,130,246,0.25)",
  },
  {
    bg: "#10B981",
    bgSoft: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.25)",
    icon: "#059669",
    text: "#047857",
    glow: "rgba(16,185,129,0.25)",
  },
  {
    bg: "#F97316",
    bgSoft: "rgba(249,115,22,0.08)",
    border: "rgba(249,115,22,0.25)",
    icon: "#EA580C",
    text: "#C2410C",
    glow: "rgba(249,115,22,0.25)",
  },
  {
    bg: "#06B6D4",
    bgSoft: "rgba(6,182,212,0.08)",
    border: "rgba(6,182,212,0.25)",
    icon: "#0891B2",
    text: "#0E7490",
    glow: "rgba(6,182,212,0.25)",
  },
  {
    bg: "#8B5CF6",
    bgSoft: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.25)",
    icon: "#7C3AED",
    text: "#6D28D9",
    glow: "rgba(139,92,246,0.25)",
  },
  {
    bg: "#EC4899",
    bgSoft: "rgba(236,72,153,0.08)",
    border: "rgba(236,72,153,0.25)",
    icon: "#DB2777",
    text: "#BE185D",
    glow: "rgba(236,72,153,0.25)",
  },
];

const NOTIF_META: Record<NotifType, { icon: string; label: string; ci: number }> = {
  order_update: { icon: "📦", label: "Orders", ci: 0 },
  message: { icon: "💬", label: "Messages", ci: 4 },
  payment: { icon: "💳", label: "Payments", ci: 1 },
  system: { icon: "⚙️", label: "System", ci: 3 },
  sla_warning: { icon: "⚠️", label: "SLA Alerts", ci: 2 },
  review: { icon: "⭐", label: "Reviews", ci: 5 },
};

const TYPE_KEYS = Object.keys(NOTIF_META) as NotifType[];

const ROLE_GRADIENTS: Record<string, string> = {
  admin: "linear-gradient(135deg, #3B82F6, #6366F1)",
  client: "linear-gradient(135deg, #0EA5E9, #06B6D4)",
  crm: "linear-gradient(135deg, #6366F1, #8B5CF6)",
  designer: "linear-gradient(135deg, #10B981, #06B6D4)",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "#3B82F6",
  client: "#0EA5E9",
  crm: "#6366F1",
  designer: "#10B981",
};

export function NotificationsPage({
  userName,
  userAvatar,
  userRole,
}: {
  userName?: string;
  userAvatar?: string;
  userRole?: string;
}) {
  const { notifications, unreadCount, loading, markAllRead, markRead, refetch } =
    useNotificationContext();
  const [filter, setFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  const filtered =
    filter === "all" ? notifications : notifications.filter((n) => n.type === filter);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 600);
  };

  const roleGradient = ROLE_GRADIENTS[userRole || ""] ?? ROLE_GRADIENTS.admin;
  const roleColor = ROLE_COLORS[userRole || ""] ?? ROLE_COLORS.admin;

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center overflow-y-auto">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: TC[0].icon }} />
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-5 md:px-6"
      style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}
    >
      {/* ── Profile strip ── */}
      {userName && (
        <div
          className="mb-5 rounded-2xl px-4 py-3"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-bold text-white"
              style={{ background: roleGradient }}
            >
              {userAvatar ? (
                <Image
                  src={userAvatar}
                  alt={userName}
                  fill
                  sizes="36px"
                  className="rounded-full object-cover"
                />
              ) : (
                userName?.charAt(0)?.toUpperCase() || "U"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-syne text-[14px] font-bold" style={{ color: txt }}>
                {userName}
              </span>
              {userRole && (
                <span
                  className="ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize"
                  style={{
                    background: `rgba(${userRole === "designer" ? "16,185,129" : userRole === "admin" ? "59,130,246" : userRole === "crm" ? "99,102,241" : "14,165,233"}, 0.10)`,
                    color: roleColor,
                    border: `1px solid ${roleColor}40`,
                  }}
                >
                  {userRole}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
                style={{ background: "#DC2626", boxShadow: "0 0 12px rgba(220,38,38,0.30)" }}
              >
                {unreadCount} new
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Title ── */}
      <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            className="font-syne text-xl font-bold leading-tight sm:text-2xl"
            style={{
              background: "linear-gradient(135deg, #2563EB, #7C3AED, #DB2777)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Notifications
          </h2>
          <p
            className="mt-0.5 text-[12px] font-medium"
            style={{ color: unreadCount > 0 ? "#1D4ED8" : txt3 }}
          >
            {unreadCount > 0
              ? `${unreadCount} unread message${unreadCount !== 1 ? "s" : ""}`
              : "All caught up! ✨"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all active:scale-95 sm:py-2"
              style={{
                background: TC[0].bgSoft,
                color: TC[0].text,
                border: `1px solid ${TC[0].border}`,
              }}
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all active:scale-95 sm:py-2"
            style={{
              background: "var(--elevated)",
              color: txt2,
              border: "1px solid var(--border2)",
            }}
          >
            <RefreshCw size={14} className={cn(refreshing && "animate-spin")} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div
        className="scrollbar-none -mx-0.5 mb-5 flex flex-nowrap gap-2 overflow-x-auto px-0.5 pb-1"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <button
          onClick={() => setFilter("all")}
          className="inline-flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border px-3.5 py-2.5 text-[11px] font-semibold transition-all active:scale-95 sm:py-2 sm:text-xs"
          style={{
            background:
              filter === "all" ? "linear-gradient(135deg, #6366F1, #3B82F6)" : "var(--elevated)",
            color: filter === "all" ? "#fff" : txt2,
            borderColor: filter === "all" ? "transparent" : "var(--border2)",
            boxShadow: filter === "all" ? "0 2px 12px rgba(99,102,241,0.25)" : "none",
          }}
        >
          📋 All
          <span className="text-[10px] opacity-75">({notifications.length})</span>
        </button>

        {TYPE_KEYS.map((type) => {
          const meta = NOTIF_META[type];
          const c = TC[meta.ci];
          const isActive = filter === type;
          const count = notifications.filter((n) => n.type === type).length;
          if (count === 0) return null;
          return (
            <button
              key={type}
              onClick={() => setFilter(isActive ? "all" : type)}
              className="inline-flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border px-3.5 py-2.5 text-[11px] font-semibold transition-all active:scale-95 sm:py-2 sm:text-xs"
              style={{
                background: isActive ? c.bg : c.bgSoft,
                color: isActive ? "#fff" : c.text,
                borderColor: isActive ? c.bg : c.border,
                boxShadow: isActive ? `0 2px 12px ${c.glow}` : "none",
              }}
            >
              {meta.icon} {meta.label}
              <span className="text-[10px] opacity-80">({count})</span>
            </button>
          );
        })}
      </div>

      {/* ── Notification list ── */}
      {filtered.length === 0 ? (
        <div
          className="rounded-2xl border py-16 text-center sm:py-20"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="mb-4 text-5xl">🔔</div>
          <h3 className="mb-1 font-syne text-lg font-bold" style={{ color: txt }}>
            {filter !== "all" ? "No matching notifications" : "No notifications yet"}
          </h3>
          <p className="px-4 text-sm" style={{ color: txt2 }}>
            {filter !== "all"
              ? "Try a different filter."
              : "You'll see order updates, messages, and alerts here."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((n) => {
            const meta = NOTIF_META[n.type] ?? NOTIF_META.system;
            const c = TC[meta.ci];
            const isUnread = !n.is_read;
            return (
              <div
                key={n.id}
                className="group cursor-pointer rounded-2xl border px-4 py-3.5 transition-all active:scale-[0.98] sm:px-5 sm:py-4"
                style={{
                  background: isUnread ? c.bgSoft : "var(--surface)",
                  borderColor: isUnread ? c.border : "var(--border)",
                  borderLeft: isUnread ? `3px solid ${c.bg}` : "3px solid transparent",
                  boxShadow: isUnread ? `0 1px 6px ${c.glow}` : "none",
                }}
                onClick={() => {
                  markRead(n.id);
                  if (n.action_url) {
                    window.location.href = n.action_url;
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Type icon */}
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg transition-transform group-hover:scale-110"
                    style={{ background: c.bgSoft }}
                  >
                    {meta.icon}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className="truncate text-[13px] font-semibold leading-snug sm:text-sm"
                        style={{ color: txt }}
                      >
                        {n.title}
                      </h4>
                      <span
                        className="mt-0.5 flex-shrink-0 whitespace-nowrap text-[10px] font-medium sm:text-[11px]"
                        style={{ color: txt3 }}
                      >
                        {formatRelative(n.created_at)}
                      </span>
                    </div>
                    <p
                      className="mt-1 line-clamp-3 break-words text-[12px] leading-relaxed sm:line-clamp-none sm:text-sm"
                      style={{ color: txt2 }}
                    >
                      {n.body}
                    </p>
                    {n.action_url && (
                      <span
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold sm:text-xs"
                        style={{ color: c.text }}
                      >
                        View details →
                      </span>
                    )}
                  </div>

                  {/* Unread dot */}
                  {isUnread && (
                    <div
                      className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full"
                      style={{ background: c.icon, boxShadow: `0 0 8px ${c.glow}` }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
