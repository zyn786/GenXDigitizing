"use client";

import { useState } from "react";
import { useNotificationContext } from "@/hooks/NotificationProvider";
import { formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Bell, CheckCheck, Loader2, RefreshCw, Star } from "lucide-react";
import type { NotifType } from "@/types";

const txt  = "var(--txt)";
const txt2 = "var(--txt2)";
const txt3 = "var(--txt3)";

const TC = [
  { bg: "#3B82F6", bgSoft: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.25)", icon: "#2563EB", text: "#1D4ED8", glow: "rgba(59,130,246,0.25)" },
  { bg: "#10B981", bgSoft: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", icon: "#059669", text: "#047857", glow: "rgba(16,185,129,0.25)" },
  { bg: "#F97316", bgSoft: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.25)", icon: "#EA580C", text: "#C2410C", glow: "rgba(249,115,22,0.25)" },
  { bg: "#06B6D4", bgSoft: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.25)", icon: "#0891B2", text: "#0E7490", glow: "rgba(6,182,212,0.25)" },
  { bg: "#8B5CF6", bgSoft: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.25)", icon: "#7C3AED", text: "#6D28D9", glow: "rgba(139,92,246,0.25)" },
  { bg: "#EC4899", bgSoft: "rgba(236,72,153,0.08)", border: "rgba(236,72,153,0.25)", icon: "#DB2777", text: "#BE185D", glow: "rgba(236,72,153,0.25)" },
];

const NOTIF_META: Record<NotifType, { icon: string; label: string; ci: number }> = {
  order_update: { icon: "📦", label: "Orders", ci: 0 },
  message:      { icon: "💬", label: "Messages", ci: 4 },
  payment:      { icon: "💳", label: "Payments", ci: 1 },
  system:       { icon: "⚙️", label: "System", ci: 3 },
  sla_warning:  { icon: "⚠️", label: "SLA Alerts", ci: 2 },
  review:       { icon: "⭐", label: "Reviews", ci: 5 },
};

const TYPE_KEYS = Object.keys(NOTIF_META) as NotifType[];

const ROLE_GRADIENTS: Record<string, string> = {
  admin:    "linear-gradient(135deg, #3B82F6, #6366F1)",
  client:   "linear-gradient(135deg, #0EA5E9, #06B6D4)",
  crm:      "linear-gradient(135deg, #6366F1, #8B5CF6)",
  designer: "linear-gradient(135deg, #10B981, #06B6D4)",
};

const ROLE_COLORS: Record<string, string> = {
  admin:    "#3B82F6",
  client:   "#0EA5E9",
  crm:      "#6366F1",
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
  const { notifications, unreadCount, loading, markAllRead, markRead, refetch } = useNotificationContext();
  const [filter, setFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  const filtered = filter === "all" ? notifications : notifications.filter(n => n.type === filter);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 600);
  };

  const roleGradient = ROLE_GRADIENTS[userRole || ""] ?? ROLE_GRADIENTS.admin;
  const roleColor = ROLE_COLORS[userRole || ""] ?? ROLE_COLORS.admin;

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: TC[0].icon }} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-4 sm:py-5" style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}>
      {/* ── Profile strip ── */}
      {userName && (
        <div className="px-4 py-3 rounded-2xl mb-5"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
              style={{ background: roleGradient }}>
              {userAvatar
                ? <img src={userAvatar} alt={userName} className="w-full h-full rounded-full object-cover" />
                : userName?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-syne font-bold text-[14px]" style={{ color: txt }}>{userName}</span>
              {userRole && (
                <span className="text-[11px] ml-2 px-2 py-0.5 rounded-full font-semibold capitalize"
                  style={{ background: `rgba(${userRole === "designer" ? "16,185,129" : userRole === "admin" ? "59,130,246" : userRole === "crm" ? "99,102,241" : "14,165,233"}, 0.10)`, color: roleColor, border: `1px solid ${roleColor}40` }}>
                  {userRole}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-white"
                style={{ background: "#DC2626", boxShadow: "0 0 12px rgba(220,38,38,0.30)" }}>
                {unreadCount} new
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Title ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
        <div>
          <h2 className="font-syne font-bold text-xl sm:text-2xl leading-tight"
            style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED, #DB2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Notifications
          </h2>
          <p className="text-[12px] mt-0.5 font-medium" style={{ color: unreadCount > 0 ? "#1D4ED8" : txt3 }}>
            {unreadCount > 0 ? `${unreadCount} unread message${unreadCount !== 1 ? "s" : ""}` : "All caught up! ✨"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
              style={{ background: TC[0].bgSoft, color: TC[0].text, border: `1px solid ${TC[0].border}` }}>
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
          <button onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-medium transition-all active:scale-95"
            style={{ background: "var(--elevated)", color: txt2, border: "1px solid var(--border2)" }}>
            <RefreshCw size={14} className={cn(refreshing && "animate-spin")} /> Refresh
          </button>
        </div>
      </div>


      {/* ── Filter tabs ── */}
      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-none flex-nowrap pb-1 -mx-0.5 px-0.5" style={{ WebkitOverflowScrolling: "touch" }}>
        <button onClick={() => setFilter("all")}
          className="flex-shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold border transition-all active:scale-95"
          style={{
            background: filter === "all" ? "linear-gradient(135deg, #6366F1, #3B82F6)" : "var(--elevated)",
            color: filter === "all" ? "#fff" : txt2,
            borderColor: filter === "all" ? "transparent" : "var(--border2)",
            boxShadow: filter === "all" ? "0 2px 12px rgba(99,102,241,0.25)" : "none",
          }}>
          📋 All
          <span className="text-[10px] opacity-75">({notifications.length})</span>
        </button>

        {TYPE_KEYS.map(type => {
          const meta = NOTIF_META[type];
          const c = TC[meta.ci];
          const isActive = filter === type;
          const count = notifications.filter(n => n.type === type).length;
          if (count === 0) return null;
          return (
            <button key={type} onClick={() => setFilter(isActive ? "all" : type)}
              className="flex-shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold border transition-all active:scale-95"
              style={{
                background: isActive ? c.bg : c.bgSoft,
                color: isActive ? "#fff" : c.text,
                borderColor: isActive ? c.bg : c.border,
                boxShadow: isActive ? `0 2px 12px ${c.glow}` : "none",
              }}>
              {meta.icon} {meta.label}
              <span className="text-[10px] opacity-80">({count})</span>
            </button>
          );
        })}
      </div>

      {/* ── Notification list ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 sm:py-20 rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-5xl mb-4">🔔</div>
          <h3 className="font-syne font-bold text-lg mb-1" style={{ color: txt }}>
            {filter !== "all" ? "No matching notifications" : "No notifications yet"}
          </h3>
          <p className="text-sm px-4" style={{ color: txt2 }}>
            {filter !== "all" ? "Try a different filter." : "You'll see order updates, messages, and alerts here."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((n) => {
            const meta = NOTIF_META[n.type] ?? NOTIF_META.system;
            const c = TC[meta.ci];
            const isUnread = !n.is_read;
            return (
              <div key={n.id}
                className="group px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98]"
                style={{
                  background: isUnread ? c.bgSoft : "var(--surface)",
                  borderColor: isUnread ? c.border : "var(--border)",
                  borderLeft: isUnread ? `3px solid ${c.bg}` : "3px solid transparent",
                  boxShadow: isUnread ? `0 1px 6px ${c.glow}` : "none",
                }}
                onClick={() => {
                  markRead(n.id);
                  if (n.action_url) { window.location.href = n.action_url; }
                }}>
                <div className="flex items-start gap-3">
                  {/* Type icon */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-transform group-hover:scale-110"
                    style={{ background: c.bgSoft }}>
                    {meta.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-[13px] sm:text-sm font-semibold leading-snug truncate"
                        style={{ color: txt }}>
                        {n.title}
                      </h4>
                      <span className="text-[10px] sm:text-[11px] flex-shrink-0 whitespace-nowrap font-medium mt-0.5" style={{ color: txt3 }}>
                        {formatRelative(n.created_at)}
                      </span>
                    </div>
                    <p className="text-[12px] sm:text-sm mt-1 leading-relaxed break-words line-clamp-3 sm:line-clamp-none"
                      style={{ color: txt2 }}>{n.body}</p>
                    {n.action_url && (
                      <span className="inline-flex items-center gap-1 mt-2 text-[11px] sm:text-xs font-semibold" style={{ color: c.text }}>
                        View details →
                      </span>
                    )}
                  </div>

                  {/* Unread dot */}
                  {isUnread && (
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5"
                      style={{ background: c.icon, boxShadow: `0 0 8px ${c.glow}` }} />
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
