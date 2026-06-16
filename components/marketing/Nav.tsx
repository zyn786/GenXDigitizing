// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { SITE_INFO } from "@/lib/site-config";
import { createClient } from "@/lib/supabase/client";
import { Download, Bell, LayoutDashboard } from "lucide-react";

const LINKS = [
  { href: "/home",         label: "Home"           },
  { href: "/services",     label: "Services"       },
  { href: "/portfolio",    label: "Portfolio"      },
  { href: "/pricing",      label: "Pricing"        },
  { href: "/subscribe",    label: "B2B"            },
  { href: "/free-designs", label: "Free Designs"   },
  { href: "/blog",         label: "Blog"           },
  { href: "/about",        label: "About",         mobileOnly: true },
  { href: "/contact",      label: "Contact",       mobileOnly: true },
];

const PORTAL_HOME: Record<string, string> = {
  admin: "/admin", client: "/client", designer: "/designer", crm: "/crm",
};

function NotifIcon({ name }: { name: string }) {
  const icons: Record<string, string> = {
    order_update: "📦", message: "💬", payment: "💳", system: "⚙️", sla_warning: "⚠️", review: "⭐",
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
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from("users").select("role").eq("id", data.user.id).single().then(({ data: profile }) => {
          setUser({ ...data.user, role: profile?.role });
        });
        supabase.from("notifications").select("id", { count: "exact", head: true })
          .eq("user_id", data.user.id).eq("is_read", false)
          .then(({ count }) => setUnread(count ?? 0));
      }
    }).catch(() => {});
  }, []);

  function fetchNotifs() {
    if (!user) return;
    setLoadingNotifs(true);
    const supabase = createClient();
    supabase.from("notifications").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => { setNotifications(data || []); setLoadingNotifs(false); });
  }

  function markRead(id: string) {
    const supabase = createClient();
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnread(p => Math.max(0, p - 1));
    supabase.from("notifications").update({ is_read: true }).eq("id", id).then(() => {});
  }

  function markAllRead() {
    const supabase = createClient();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
    supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false).then(() => {});
  }

  if (!user) {
    return (
      <Link href="/login">
        <Button variant="ghost" size="sm">Sign In</Button>
      </Link>
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
          onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) fetchNotifs(); }}
          className="relative p-2 rounded-[8px] transition-colors bg-transparent border-none cursor-pointer text-[var(--txt2)] hover:text-[var(--txt)] hover:bg-[var(--border)]"
        >
          <Bell size={16} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1 bg-[#DC2626] border-2 border-[var(--bg)]">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {showNotifs && (
          <>
            <div className="fixed inset-0 z-[65]" onClick={() => setShowNotifs(false)} />
            <div className="absolute right-0 top-11 w-[calc(100vw-32px)] max-w-[320px] z-[70] bg-[var(--surface)] border border-[var(--border2)] rounded-[14px] shadow-2xl overflow-hidden animate-fade-in-up">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <span className="font-syne font-bold text-[13px] text-[var(--txt)]">Notifications</span>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-[11px] text-[#2563EB] hover:underline bg-transparent border-none cursor-pointer">Mark all read</button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {loadingNotifs ? (
                  <div className="py-8 text-center text-[13px] text-[var(--txt3)]">Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="py-8 text-center text-[13px] text-[var(--txt3)]">No notifications yet</div>
                ) : (
                  notifications.map((n: any) => (
                    <div key={n.id} className={`px-4 py-3 border-b border-[var(--border)] cursor-pointer transition-colors hover:bg-[var(--elevated)] ${!n.is_read ? "bg-[#2563EB]/5 border-l-[3px] border-l-[#2563EB]" : ""}`}
                      onClick={() => { markRead(n.id); if (n.action_url) window.location.href = n.action_url; }}>
                      <div className="flex items-start gap-2.5">
                        <span className="text-base mt-0.5"><NotifIcon name={n.type} /></span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-[var(--txt)] leading-snug">{n.title}</p>
                          <p className="text-[11px] text-[var(--txt2)] mt-0.5 line-clamp-2">{n.body}</p>
                        </div>
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-[#2563EB] mt-1.5 flex-shrink-0" />}
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
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close mobile menu on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 bg-[var(--bg)] border-b border-[var(--border)] shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
      style={topOffset ? { top: topOffset } : undefined}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 flex items-center justify-between h-16 lg:h-[68px]">
        {/* Logo */}
        <Link href="/home" className="flex items-center gap-2 no-underline flex-shrink-0">
          <Image
            src="/images/black_logo.png"
            alt="GenX Digitizing — home"
            priority
            width={200} height={100}
            className="h-7 sm:h-8 w-auto"
          />
        </Link>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-0.5">
          {LINKS.filter(l => !l.mobileOnly).map((l) => {
            const isActive = l.href === "/home"
              ? (pathname === "/" || pathname === "/home" || pathname.startsWith("/home/"))
              : (pathname === l.href || pathname.startsWith(l.href + "/"));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative px-3 xl:px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 no-underline",
                  l.href === "/free-designs"
                    ? isActive
                      ? "bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white shadow-[0_2px_12px_rgba(37,99,235,0.3)]"
                      : "text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] font-bold hover:bg-[#2563EB]/8 hover:text-transparent hover:bg-clip-text"
                    : isActive
                      ? "text-[var(--txt)]"
                      : "text-[var(--txt2)] hover:text-[var(--txt)] hover:bg-[var(--elevated)]/60"
                )}
              >
                {l.label}
                {isActive && l.href !== "/free-designs" && (
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
        <div className="hidden lg:flex items-center gap-1.5">
          <Link href="/contact" className="inline-flex items-center px-3 py-2 rounded-xl text-xs font-semibold text-[var(--txt2)] hover:text-[var(--txt)] hover:bg-[var(--elevated)]/60 transition-all duration-200 no-underline">
            Contact
          </Link>
          {SITE_INFO.whatsapp && (
          <a
            href={`https://wa.me/${SITE_INFO.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium
              text-[#25D366] hover:bg-[#25D366]/10 transition-all duration-200 no-underline"
            aria-label="Chat on WhatsApp"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
            </svg>
            <span>WhatsApp</span>
          </a>
          )}

          <AuthButtons />
          <Link href="/upload">
            <Button variant="grad" size="sm">Get a Free Quote</Button>
          </Link>
        </div>

        {/* Tablet nav (md-lg range) — simplified */}
        <div className="hidden md:flex lg:hidden items-center gap-1.5">
          {LINKS.map((l) => {
            const isActive = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "px-2.5 py-2 rounded-lg text-[12px] font-medium transition-all duration-150 no-underline",
                  isActive
                    ? "text-[var(--txt)]"
                    : "text-[var(--txt2)] hover:text-[var(--txt)]"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        {/* Tablet CTAs */}
        <div className="hidden md:flex lg:hidden items-center gap-1.5">

          <AuthButtons />
          <Link href="/upload">
            <Button variant="grad" size="sm" className="text-[11px] px-3">Order</Button>
          </Link>
        </div>

        {/* Mobile header */}
        <div className="flex md:hidden items-center gap-1">

          {SITE_INFO.whatsapp && (
          <a
            href={`https://wa.me/${SITE_INFO.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-[#25D366] hover:bg-[#25D366]/10 transition-all duration-150 flex items-center justify-center"
            aria-label="Chat on WhatsApp"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
            </svg>
          </a>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="p-2.5 rounded-xl bg-transparent border-none cursor-pointer
              hover:bg-[var(--elevated)] transition-all duration-200"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <div className="flex flex-col gap-[5px] w-5">
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
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden bg-[var(--bg)]/98 backdrop-blur-2xl
              border-t border-[var(--border)] overflow-hidden shadow-2xl"
          >
            <div className="px-5 sm:px-6 py-4 flex flex-col gap-1">
              {LINKS.map((l, i) => {
                const isActive = l.href === "/home"
              ? (pathname === "/" || pathname === "/home" || pathname.startsWith("/home/"))
              : (pathname === l.href || pathname.startsWith(l.href + "/"));
                return (
                  <motion.div
                    key={l.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.2 }}
                  >
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 py-3.5 px-3 rounded-xl text-sm font-semibold no-underline transition-all duration-150",
                        l.href === "/free-designs"
                          ? "text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] font-bold"
                          : isActive
                            ? "text-[var(--txt)]"
                            : "text-[var(--txt2)] hover:text-[var(--txt)] hover:bg-[var(--elevated)]/50"
                      )}
                    >
                      {l.label}
                      {isActive && l.href !== "/free-designs" && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED]" />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
              <div className="flex gap-2.5 mt-3 pt-3 border-t border-[var(--border)]">
      
                <AuthButtons />
                <Link href="/free-designs" className="flex-1" onClick={() => setOpen(false)}>
                  <Button variant="grad" size="md" className="w-full justify-center">
                    <Download className="w-4 h-4 mr-1" /> Free Designs
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
