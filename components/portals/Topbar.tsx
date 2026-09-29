// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import NextImage from "next/image";
import {
  Bell,
  X,
  LogOut,
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  MessageSquare,
  UserCircle,
  TrendingUp,
  Receipt,
  Star,
  Tag,
  Image as ImageIcon,
  PlusCircle,
  AlertCircle,
  CheckSquare,
  Upload,
  Home,
  Crown,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useNotificationContext } from "@/hooks/NotificationProvider";
import { requestNotificationPermission } from "@/lib/notify";
import { formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { AuthUser, NotifType } from "@/types";

const NOTIF_ICONS: Record<NotifType, string> = {
  order_update: "📦",
  message: "💬",
  payment: "💳",
  system: "⚙️",
  sla_warning: "⚠️",
  review: "⭐",
};

const NOTIF_COLORS: Record<NotifType, { border: string; bg: string; dot: string }> = {
  order_update: { border: "rgba(59,130,246,0.45)", bg: "rgba(59,130,246,0.10)", dot: "#3B82F6" },
  message: { border: "rgba(139,92,246,0.45)", bg: "rgba(139,92,246,0.10)", dot: "#8B5CF6" },
  payment: { border: "rgba(16,185,129,0.45)", bg: "rgba(16,185,129,0.10)", dot: "#10B981" },
  system: { border: "rgba(6,182,212,0.45)", bg: "rgba(6,182,212,0.10)", dot: "#06B6D4" },
  sla_warning: { border: "rgba(249,115,22,0.45)", bg: "rgba(249,115,22,0.10)", dot: "#F97316" },
  review: { border: "rgba(236,72,153,0.45)", bg: "rgba(236,72,153,0.10)", dot: "#EC4899" },
};

interface TopbarProps {
  title: string;
  subtitle?: string;
  user: AuthUser;
}

function MobileSidebarDrawer({ user }: { user: AuthUser }) {
  const [open, setOpen] = useState(false);
  const [animating, setAnimating] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (open) {
      setAnimating(false);
      const t = setTimeout(() => setAnimating(true), 20);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleClose = () => {
    setAnimating(false);
    setTimeout(() => setOpen(false), 300);
  };

  const portalColor =
    { admin: "#3B82F6", crm: "#6366F1", client: "#0EA5E9", designer: "#10B981" }[user.role] ||
    "#3B82F6";

  const SECTIONS: Record<
    string,
    { title: string; items: { href: string; label: string; icon: React.ReactNode }[] }[]
  > = {
    admin: [
      {
        title: "Overview",
        items: [
          { href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={17} /> },
          { href: "/admin/reports", label: "Reports", icon: <BarChart3 size={17} /> },
        ],
      },
      {
        title: "Operations",
        items: [
          { href: "/admin/orders", label: "Orders", icon: <FileText size={17} /> },
          { href: "/admin/clients", label: "Clients", icon: <Users size={17} /> },
          { href: "/admin/designers", label: "Designers", icon: <UserCircle size={17} /> },
          { href: "/admin/invoices", label: "Invoices", icon: <Receipt size={17} /> },
          { href: "/admin/subscriptions", label: "Subscriptions", icon: <Crown size={17} /> },
          { href: "/admin/coupons", label: "Coupons", icon: <Ticket size={17} /> },
        ],
      },
      {
        title: "Content",
        items: [
          { href: "/admin/portfolio", label: "Portfolio", icon: <ImageIcon size={17} /> },
          { href: "/admin/pricing", label: "Pricing", icon: <Tag size={17} /> },
          { href: "/admin/blog", label: "Blog", icon: <FileText size={17} /> },
        ],
      },
      {
        title: "Engagement",
        items: [
          { href: "/admin/messages", label: "Support Inbox", icon: <MessageSquare size={17} /> },
          { href: "/admin/reviews", label: "Reviews", icon: <Star size={17} /> },
          { href: "/admin/leads", label: "Leads", icon: <TrendingUp size={17} /> },
          { href: "/admin/notifications", label: "Notifications", icon: <Bell size={17} /> },
        ],
      },
      {
        title: "System",
        items: [{ href: "/admin/settings", label: "Settings", icon: <Settings size={17} /> }],
      },
    ],
    crm: [
      {
        title: "Workspace",
        items: [
          { href: "/crm/leads", label: "Pipeline", icon: <TrendingUp size={17} /> },
          { href: "/crm/contacts", label: "Contacts", icon: <Users size={17} /> },
          { href: "/crm/messages", label: "Messages", icon: <MessageSquare size={17} /> },
        ],
      },
      {
        title: "Monitor",
        items: [
          { href: "/crm/reviews", label: "Reviews", icon: <Star size={17} /> },
          { href: "/crm/notifications", label: "Notifications", icon: <Bell size={17} /> },
        ],
      },
      {
        title: "System",
        items: [{ href: "/crm/settings", label: "Settings", icon: <Settings size={17} /> }],
      },
    ],
    client: [
      {
        title: "Subscription",
        items: [{ href: "/client/subscribe", label: "Plans & Billing", icon: <Crown size={17} /> }],
      },
      {
        title: "Orders",
        items: [
          { href: "/client", label: "Dashboard", icon: <LayoutDashboard size={17} /> },
          { href: "/client/new-order", label: "New Order", icon: <PlusCircle size={17} /> },
          { href: "/client/my-orders", label: "My Orders", icon: <FileText size={17} /> },
        ],
      },
      {
        title: "Account",
        items: [
          { href: "/client/invoices", label: "Invoices", icon: <Receipt size={17} /> },
          { href: "/client/my-reviews", label: "My Reviews", icon: <Star size={17} /> },
          { href: "/client/messages", label: "Messages", icon: <MessageSquare size={17} /> },
          { href: "/client/notifications", label: "Notifications", icon: <Bell size={17} /> },
        ],
      },
    ],
    designer: [
      {
        title: "Work",
        items: [
          { href: "/designer/tasks", label: "My Tasks", icon: <AlertCircle size={17} /> },
          { href: "/designer/completed", label: "Completed", icon: <CheckSquare size={17} /> },
          { href: "/designer/upload", label: "Upload Files", icon: <Upload size={17} /> },
        ],
      },
      {
        title: "Account",
        items: [
          { href: "/designer/notifications", label: "Notifications", icon: <Bell size={17} /> },
          { href: "/designer/settings", label: "Settings", icon: <Settings size={17} /> },
        ],
      },
    ],
  };

  const sections = SECTIONS[user.role] || [];
  const isActive = (href: string) =>
    pathname === href || (href !== `/${user.role}` && pathname.startsWith(href));

  return (
    <>
      {open && (
        <>
          <div
            className="fixed inset-0 z-[55] bg-black/40 transition-opacity duration-300"
            style={{ opacity: animating ? 1 : 0 }}
            onClick={handleClose}
          />
          <div
            className="fixed bottom-0 left-0 top-0 z-[60] flex w-[85vw] max-w-[320px] flex-col bg-[var(--bg)] shadow-2xl transition-transform duration-300 ease-out"
            style={{
              transform: animating ? "translateX(0)" : "translateX(-100%)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {/* Logo + close */}
            <div className="flex items-center justify-between px-4 pb-3 pt-5">
              <div className="flex items-center gap-2.5">
                <NextImage
                  src="/images/black_logo.png"
                  alt="genxdigitizing"
                  width={2000}
                  height={1000}
                  className="h-7 w-auto"
                />
              </div>
              <button
                onClick={handleClose}
                className="rounded-lg p-2 hover:bg-[var(--elevated)]"
                style={{ color: "var(--txt2)" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* User */}
            <div
              className="mx-3 mb-2 flex items-center gap-3 rounded-xl p-3"
              style={{ background: "var(--elevated)" }}
            >
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: `linear-gradient(135deg,#2563EB,${portalColor})` }}
              >
                {user.full_name?.charAt(0) || "U"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-[var(--txt)]">
                  {user.full_name}
                </p>
                <p className="text-[10px] capitalize text-[var(--txt3)]">
                  {user.role} · {user.email}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-4 border-t border-[var(--border)]" />

            {/* Nav sections */}
            <div className="flex-1 overflow-y-auto py-2">
              {sections.map((section, si) => (
                <div key={section.title} className={si > 0 ? "mt-2" : ""}>
                  <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.8px] text-[var(--txt3)]">
                    {section.title}
                  </p>
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={handleClose}
                        className="mx-2 my-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium no-underline transition-all active:scale-[0.98]"
                        style={{
                          color: active ? "#1D4ED8" : "var(--txt)",
                          background: active ? "rgba(59,130,246,0.10)" : "transparent",
                          borderLeft: active ? `2px solid ${portalColor}` : "2px solid transparent",
                        }}
                      >
                        <span style={{ color: active ? portalColor : "var(--txt3)" }}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}

export function Topbar({ title, subtitle, user }: TopbarProps) {
  const router = useRouter();
  const supabase = createClient();
  const [showNotifs, setShowNotifs] = useState(false);
  const { notifications, unreadCount, markAllRead, markRead } = useNotificationContext();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    toast.success("Signed out");
    router.push("/home");
  };

  return (
    <header className="portal-topbar">
      {/* Left: logo + mobile drawer + title */}
      <div className="flex items-center gap-2 sm:gap-3">
        <MobileSidebarDrawer user={user} />
        <NextImage
          src="/images/black_logo.png"
          alt="genxdigitizing"
          width={2000}
          height={1000}
          className="mr-2 h-6 w-auto flex-shrink-0 sm:h-7 lg:hidden"
        />
        <div>
          <h1
            className="font-syne text-sm font-bold sm:text-[15px]"
            style={{
              background: "linear-gradient(90deg,var(--txt),var(--txt2))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-[10px] text-[var(--txt3)] sm:text-[11px]">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2.5">
        {/* Back to Homepage */}
        <Link
          href="/"
          className="flex cursor-pointer items-center gap-1.5 rounded-[8px] border border-[var(--border2)] bg-[var(--elevated)] px-3 py-2 no-underline transition-colors hover:border-[var(--border3)] hover:bg-[var(--elevated2)]"
          style={{ color: "var(--txt2)" }}
        >
          <Home size={14} />
          <span className="hidden text-[12px] sm:inline">Home</span>
        </Link>

        {/* Logout */}
        <button
          onClick={handleSignOut}
          className="flex cursor-pointer items-center gap-1.5 rounded-[8px] border border-[var(--border2)] bg-[var(--elevated)] px-3 py-2 transition-colors hover:border-[var(--border3)] hover:bg-[var(--elevated2)]"
          style={{ color: "var(--txt2)" }}
        >
          <LogOut size={14} />
          <span className="hidden text-[12px] sm:inline">Logout</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifs((v) => !v);
              requestNotificationPermission(user?.id);
            }}
            className={cn(
              "relative rounded-[8px] p-2 transition-colors",
              "text-[var(--txt2)] hover:bg-[var(--border)] hover:text-[var(--txt)]",
              showNotifs && "bg-[var(--border)] text-[var(--txt)]"
            )}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full border-2 border-[var(--surface)] px-1 text-[9px] font-bold text-white"
                style={{ background: "#DC2626" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {showNotifs && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-[65]" onClick={() => setShowNotifs(false)} />

              <div className="absolute right-0 top-11 z-[70] w-80 animate-fade-in-up overflow-hidden rounded-[14px] border border-[var(--border2)] bg-[var(--surface)] shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-syne text-[13px] font-bold">Notifications</span>
                    {unreadCount > 0 && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                        style={{ background: "#DC2626" }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[11px] text-[#2FA4D7] hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifs(false)}
                      className="text-[var(--txt3)] transition-colors hover:text-[var(--txt)]"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center">
                      <p className="mb-2 text-2xl">🔔</p>
                      <p className="text-[13px] text-[var(--txt3)]">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const nc = NOTIF_COLORS[n.type] ?? NOTIF_COLORS.system;
                      return (
                        <div
                          key={n.id}
                          className={cn(
                            "border-b border-[var(--border)] px-4 py-3 last:border-b-0",
                            "cursor-pointer transition-colors hover:bg-[var(--elevated)]"
                          )}
                          style={{
                            background: !n.is_read ? nc.bg : "transparent",
                            borderLeft: !n.is_read
                              ? `3px solid ${nc.border}`
                              : "3px solid transparent",
                          }}
                          onClick={() => {
                            markRead(n.id);
                            if (n.action_url) {
                              window.location.href = n.action_url;
                            }
                          }}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="mt-0.5 flex-shrink-0 text-base">
                              {NOTIF_ICONS[n.type] ?? "🔔"}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-[12px] font-medium leading-snug text-[var(--txt)]">
                                  {n.title}
                                </p>
                                {!n.is_read && (
                                  <span
                                    className="mt-1 h-2 w-2 flex-shrink-0 rounded-full"
                                    style={{
                                      background: nc.dot,
                                      boxShadow: `0 0 6px ${nc.border}`,
                                    }}
                                  />
                                )}
                              </div>
                              <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[var(--txt2)]">
                                {n.body}
                              </p>
                              <p className="mt-1 text-[10px] text-[var(--txt3)]">
                                {formatRelative(n.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* View all footer */}
                <Link
                  href={`/${user.role}/notifications`}
                  onClick={() => setShowNotifs(false)}
                  className="block border-t border-[var(--border)] py-3 text-center text-[12px] font-semibold text-[#2563EB] no-underline transition-colors hover:bg-[#2563EB]/5"
                >
                  View all notifications →
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
