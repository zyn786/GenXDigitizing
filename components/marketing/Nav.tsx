// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { SITE_INFO, SITE_CLAIMS } from "@/lib/site-config";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronRight,
  ChevronDown,
  Star,
  Shield,
  Bell,
  LayoutDashboard,
  Home,
  Info,
  Briefcase,
  FolderOpen,
  DollarSign,
  FileText,
  Users,
  Mail,
  LogIn,
  UserPlus,
  Clock,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

const NAV_ICONS: Record<string, React.ReactNode> = {
  "/home": <Home size={16} />,
  "/about": <Info size={16} />,
  "/services": <Briefcase size={16} />,
  "/portfolio": <FolderOpen size={16} />,
  "/pricing": <DollarSign size={16} />,
  "/blog": <FileText size={16} />,
  "/subscribe": <Users size={16} />,
  "/contact": <Mail size={16} />,
};

const LINKS = [
  { href: "/home", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/subscribe", label: "B2B" },
  { href: "/contact", label: "Contact" },
];

const SERVICES_SUB = [
  { label: "Embroidery Digitizing", href: "/services/embroidery-digitizing" },
  { label: "Cap Digitizing", href: "/services/cap-digitizing" },
  { label: "3D Puff Digitizing", href: "/services/3d-puff-digitizing" },
  { label: "Jacket Back Digitizing", href: "/services/jacket-back-digitizing" },
  { label: "Left Chest Digitizing", href: "/services/left-chest-digitizing" },
  { label: "Vector Art", href: "/services/vector-art-conversion" },
  { label: "Custom Patches", href: "/services/custom-patches" },
];

const PORTFOLIO_SUB = [
  { label: "🧵 Digitizing", href: "/portfolio?category=digitizing" },
  { label: "✏️ Vector Art", href: "/portfolio?category=vector" },
  { label: "🏷️ Patches", href: "/portfolio?category=patches" },
];

const PORTAL_HOME: Record<string, string> = {
  admin: "/admin",
  client: "/client",
  designer: "/designer",
  crm: "/crm",
};

function NotifIcon({ name }: { name: string }) {
  const icons: Record<string, string> = {
    order_update: "📦",
    message: "💬",
    payment: "💳",
    system: "⚙️",
    sla_warning: "⚠️",
    review: "⭐",
  };
  return <span>{icons[name] ?? "🔔"}</span>;
}

function AuthButtons() {
  const [user, setUser] = useState<any>(null);
  const [unread, setUnread] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (data.user) {
          supabase
            .from("users")
            .select("role")
            .eq("id", data.user.id)
            .single()
            .then(({ data: profile }) => {
              setUser({ ...data.user, role: profile?.role });
            });
          supabase
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", data.user.id)
            .eq("is_read", false)
            .then(({ count }) => setUnread(count ?? 0));
        }
      })
      .catch(() => {});
  }, []);

  function fetchNotifs() {
    if (!user) return;
    setLoadingNotifs(true);
    const supabase = createClient();
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setNotifications(data || []);
        setLoadingNotifs(false);
      });
  }

  function markRead(id: string) {
    const supabase = createClient();
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnread((p) => Math.max(0, p - 1));
    supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .then(() => {});
  }

  function markAllRead() {
    const supabase = createClient();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
    supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false)
      .then(() => {});
  }

  if (!user) {
    return (
      <>
        <Link href="/login" className="no-underline">
          <Button variant="ghost" size="sm" leftIcon={<LogIn size={14} />}>
            Sign In
          </Button>
        </Link>
        <Link href="/register" className="no-underline">
          <Button variant="ghost" size="sm" leftIcon={<UserPlus size={14} />}>
            Register
          </Button>
        </Link>
      </>
    );
  }

  const portalUrl = PORTAL_HOME[user.role] || "/client";

  return (
    <>
      <Link href={portalUrl} className="no-underline">
        <Button variant="ghost" size="sm" leftIcon={<LayoutDashboard size={14} />}>
          My Dashboard
        </Button>
      </Link>

      {/* Notification bell with dropdown */}
      <div className="relative">
        <button
          onClick={() => {
            setShowNotifs(!showNotifs);
            if (!showNotifs) fetchNotifs();
          }}
          className="relative cursor-pointer rounded-[8px] border-none bg-transparent p-2 text-[var(--txt2)] transition-colors hover:bg-[var(--border)] hover:text-[var(--txt)]"
        >
          <Bell size={16} />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full border-2 border-[var(--bg)] bg-[#DC2626] px-1 text-[9px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {showNotifs && (
          <>
            <div className="fixed inset-0 z-[65]" onClick={() => setShowNotifs(false)} />
            <div className="absolute right-0 top-11 z-[70] w-[calc(100vw-32px)] max-w-[320px] animate-fade-in-up overflow-hidden rounded-[14px] border border-[var(--border2)] bg-[var(--surface)] shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                <span className="font-syne text-[13px] font-bold text-[var(--txt)]">
                  Notifications
                </span>
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    className="cursor-pointer border-none bg-transparent text-[11px] text-[#2563EB] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {loadingNotifs ? (
                  <div className="py-8 text-center text-[13px] text-[var(--txt3)]">Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="py-8 text-center text-[13px] text-[var(--txt3)]">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((n: any) => (
                    <div
                      key={n.id}
                      className={`cursor-pointer border-b border-[var(--border)] px-4 py-3 transition-colors hover:bg-[var(--elevated)] ${!n.is_read ? "border-l-[3px] border-l-[#2563EB] bg-[#2563EB]/5" : ""}`}
                      onClick={() => {
                        markRead(n.id);
                        if (n.action_url) window.location.href = n.action_url;
                      }}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 text-base">
                          <NotifIcon name={n.type} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-medium leading-snug text-[var(--txt)]">
                            {n.title}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--txt2)]">
                            {n.body}
                          </p>
                        </div>
                        {!n.is_read && (
                          <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#2563EB]" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export function Nav({ topOffset }: { topOffset?: string }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
    setExpanded(null);
  }, [pathname]);

  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)] shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
      style={topOffset ? { top: topOffset } : undefined}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6 md:px-10 lg:h-[68px] lg:px-12">
        {/* Logo */}
        <Link href="/" className="flex flex-shrink-0 items-center gap-2 no-underline">
          <Image
            src="/images/black_logo.png"
            alt="GenX Digitizing — home"
            priority
            width={200}
            height={100}
            className="h-7 w-auto sm:h-8"
          />
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-0 lg:flex">
          {LINKS.filter((l) => !l.mobileOnly).map((l) => {
            const isActive =
              l.href === "/home"
                ? pathname === "/" || pathname === "/home" || pathname.startsWith("/home/")
                : pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative rounded-xl px-2 py-2.5 text-[12px] font-semibold no-underline transition-all duration-200 xl:px-3 xl:text-[13px]",
                  isActive
                    ? "text-[var(--txt)]"
                    : "hover:bg-[var(--elevated)]/60 text-[var(--txt2)] hover:text-[var(--txt)]"
                )}
              >
                {l.label}
                {isActive && (
                  <motion.div
                    layoutId="navActive"
                    className="absolute -bottom-[2px] left-[15%] right-[15%] h-[3px] rounded-full bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] shadow-[0_1px_4px_rgba(37,99,235,0.3)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-1 lg:flex">
          {SITE_INFO.whatsapp && (
            <a
              href={`https://wa.me/${SITE_INFO.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl p-2 text-[#25D366] transition-all duration-200 hover:bg-[#25D366]/10"
              aria-label="WhatsApp"
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
          )}
          {/* Social icons */}
          <a
            href="https://www.instagram.com/genxdigitizing"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl p-2 text-[#E4405F] transition-all duration-200 hover:bg-[#E4405F]/10"
            aria-label="Instagram"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          </a>
          <a
            href="https://www.facebook.com/genxdigitizing"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl p-2 text-[#1877F2] transition-all duration-200 hover:bg-[#1877F2]/10"
            aria-label="Facebook"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>
          <AuthButtons />
          <Link href="/upload">
            <Button variant="grad" size="sm">
              Get a Free Quote
            </Button>
          </Link>
        </div>

        {/* Tablet nav (md-lg range) — simplified */}
        <div className="hidden items-center gap-1.5 md:flex lg:hidden">
          {LINKS.map((l) => {
            const isActive = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-lg px-2.5 py-2 text-[12px] font-medium no-underline transition-all duration-150",
                  isActive ? "text-[var(--txt)]" : "text-[var(--txt2)] hover:text-[var(--txt)]"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        {/* Tablet CTAs */}
        <div className="hidden items-center gap-1.5 md:flex lg:hidden">
          <AuthButtons />
          <Link href="/upload">
            <Button variant="grad" size="sm" className="px-3 text-[11px]">
              Order
            </Button>
          </Link>
        </div>

        {/* Mobile header */}
        <div className="flex items-center gap-1 md:hidden">
          <a
            href="https://www.instagram.com/genxdigitizing"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center rounded-lg p-2 text-[#E4405F] transition-all duration-150 hover:bg-[#E4405F]/10"
            aria-label="Instagram"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          </a>
          <a
            href="https://www.facebook.com/genxdigitizing"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center rounded-lg p-2 text-[#1877F2] transition-all duration-150 hover:bg-[#1877F2]/10"
            aria-label="Facebook"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>
          {SITE_INFO.whatsapp && (
            <a
              href={`https://wa.me/${SITE_INFO.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded-lg p-2 text-[#25D366] transition-all duration-150 hover:bg-[#25D366]/10"
              aria-label="Chat on WhatsApp"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
              </svg>
            </a>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="cursor-pointer rounded-xl border-none bg-transparent p-2.5 transition-all duration-200 hover:bg-[var(--elevated)]"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <div className="flex w-5 flex-col gap-[5px]">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{
                    rotate: open && i === 0 ? 45 : 0,
                    y: open && i === 0 ? 6.5 : open && i === 2 ? -6.5 : 0,
                    width: open && i === 1 ? 0 : 20,
                  }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="block h-[2px] rounded-full bg-[var(--txt)]"
                  style={{
                    rotate: open && i === 2 ? -45 : 0,
                    originX: 0.5,
                    originY: 0.5,
                  }}
                />
              ))}
            </div>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-30 bg-white/90 md:hidden"
              style={{ top: topOffset ? `calc(${topOffset} + 64px)` : "64px" }}
              onClick={() => setOpen(false)}
            />

            {/* Menu panel */}
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 bottom-0 z-30 overflow-y-auto border-t border-[var(--border)] bg-white shadow-2xl md:hidden"
              style={{ top: topOffset ? `calc(${topOffset} + 64px)` : "64px" }}
            >
              <div
                className="flex flex-col"
                style={{
                  minHeight: topOffset ? `calc(100vh - ${topOffset} - 64px)` : "calc(100vh - 64px)",
                }}
              >
                {/* Nav links section — fills top */}
                <div className="flex flex-col gap-0.5 px-4 pt-4 sm:px-5">
                  {LINKS.map((l, i) => {
                    const isActive =
                      l.href === "/home"
                        ? pathname === "/" || pathname === "/home" || pathname.startsWith("/home/")
                        : pathname === l.href || pathname.startsWith(l.href + "/");
                    const isExpandable = l.href === "/services" || l.href === "/portfolio";
                    const isExpanded = expanded === l.href;
                    const subItems =
                      l.href === "/services"
                        ? SERVICES_SUB
                        : l.href === "/portfolio"
                          ? PORTFOLIO_SUB
                          : [];

                    return (
                      <motion.div
                        key={l.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: 0.08 + i * 0.05,
                          duration: 0.3,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        {isExpandable ? (
                          <>
                            <button
                              onClick={() => setExpanded(isExpanded ? null : l.href)}
                              className={cn(
                                "flex w-full cursor-pointer items-center gap-3 rounded-xl border-none bg-transparent px-3 py-3 text-sm font-semibold transition-all duration-150",
                                isActive
                                  ? "bg-[#2563EB]/15 text-[var(--txt)]"
                                  : "hover:bg-[var(--elevated)]/50 text-[var(--txt2)] hover:text-[var(--txt)]"
                              )}
                            >
                              <span className="text-[var(--txt3)]">{NAV_ICONS[l.href]}</span>
                              {l.label}
                              <ChevronDown
                                size={14}
                                className={`ml-auto transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                              />
                              {isActive && (
                                <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED]" />
                              )}
                            </button>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-1 ml-4 overflow-hidden border-l-2 border-[#2563EB]/15 pl-3"
                              >
                                {subItems.map((sub, si) => (
                                  <motion.div
                                    key={sub.label}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: si * 0.04, duration: 0.2 }}
                                  >
                                    <Link
                                      href={sub.href}
                                      onClick={() => setOpen(false)}
                                      className="hover:bg-[var(--elevated)]/60 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-[var(--txt3)] no-underline transition-all hover:text-[var(--txt)]"
                                    >
                                      <span className="h-1 w-1 flex-shrink-0 rounded-full bg-[var(--border3)]" />
                                      {sub.label}
                                    </Link>
                                  </motion.div>
                                ))}
                              </motion.div>
                            )}
                          </>
                        ) : (
                          <Link
                            href={l.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-3 py-3.5 text-sm font-semibold no-underline transition-all duration-150",
                              isActive
                                ? "bg-[#2563EB]/15 text-[var(--txt)]"
                                : "hover:bg-[var(--elevated)]/50 text-[var(--txt2)] hover:text-[var(--txt)]"
                            )}
                          >
                            <span className="text-[var(--txt3)]">{NAV_ICONS[l.href]}</span>
                            {l.label}
                            {isActive && (
                              <div className="ml-auto h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED]" />
                            )}
                          </Link>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                <div className="mt-auto">
                  <div className="mx-4 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
                </div>

                {/* Bottom section — pinned to bottom */}
                <div className="border-t border-[var(--border)] px-4 pt-3 sm:px-5">
                  {/* Auth links */}
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="hover:bg-[var(--elevated)]/50 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--txt2)] no-underline transition-all duration-150 hover:text-[var(--txt)]"
                  >
                    <LogIn size={16} className="text-[var(--txt3)]" />
                    Sign In
                  </Link>

                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#2563EB] no-underline transition-all duration-150 hover:bg-[#2563EB]/10"
                  >
                    <UserPlus size={16} />
                    Register
                    <span className="ml-auto rounded-full bg-[#2563EB]/10 px-2 py-0.5 text-[10px] font-semibold text-[#2563EB]">
                      Start Free
                    </span>
                  </Link>

                  {/* Premium highlights card */}
                  <div className="mt-2.5 rounded-2xl border border-[var(--border)] bg-white/90 p-3.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="flex items-center gap-2.5 rounded-xl bg-white/50 p-2">
                        <Star size={16} className="flex-shrink-0 fill-[#F59E0B] text-[#F59E0B]" />
                        <div>
                          <p className="text-xs font-bold text-[var(--txt)]">
                            {SITE_CLAIMS.price.value}
                          </p>
                          <p className="text-[10px] text-[var(--txt3)]">Standard designs</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 rounded-xl bg-white/50 p-2">
                        <Clock size={16} className="flex-shrink-0 text-[#2563EB]" />
                        <div>
                          <p className="text-xs font-bold text-[var(--txt)]">
                            {SITE_CLAIMS.turnaround.value}
                          </p>
                          <p className="text-[10px] text-[var(--txt3)]">Turnaround</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 rounded-xl bg-white/50 p-2">
                        <ShieldCheck size={16} className="flex-shrink-0 text-[#16A34A]" />
                        <div>
                          <p className="text-xs font-bold text-[var(--txt)]">
                            {SITE_CLAIMS.formats.value}
                          </p>
                          <p className="text-[10px] text-[var(--txt3)]">Machine formats</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 rounded-xl bg-white/50 p-2">
                        <RefreshCw size={16} className="flex-shrink-0 text-[#7C3AED]" />
                        <div>
                          <p className="text-xs font-bold text-[var(--txt)]">Unlimited</p>
                          <p className="text-[10px] text-[var(--txt3)]">Free revisions</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center justify-center gap-3 border-t border-[var(--border)] pt-2.5">
                      <div className="flex items-center gap-1">
                        <Shield size={12} className="text-[#16A34A]" />
                        <span className="text-[10px] font-medium text-[#16A34A]">100% Secure</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield size={12} className="text-[#16A34A]" />
                        <span className="text-[10px] font-medium text-[#16A34A]">
                          SSL Encrypted
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CTA row */}
                  <div
                    className="flex gap-2.5 pb-2 pt-2.5"
                    style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}
                  >
                    <a
                      href={`https://wa.me/${SITE_INFO.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] py-3 text-sm font-semibold text-white no-underline transition-all active:scale-[0.98]"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      WhatsApp
                    </a>
                    <Link href="/upload" className="flex-[2]" onClick={() => setOpen(false)}>
                      <Button variant="grad" size="md" className="w-full justify-center !font-bold">
                        Get Free Quote
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
