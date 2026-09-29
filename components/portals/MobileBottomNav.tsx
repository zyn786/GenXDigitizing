"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import * as Icons from "lucide-react";
import { BadgeProvider, useBadges } from "@/hooks/BadgeProvider";
import {
  MOBILE_TABS,
  NAV_SECTIONS,
  PORTAL_COLORS,
  PORTAL_LABELS,
  isActiveRoute,
} from "@/lib/navigation";

function NavIcon({ name, size = 20 }: { name: string; size?: number }) {
  const Icon = (Icons as any)[name];
  return Icon ? <Icon size={size} /> : <span>{name}</span>;
}

const TABS = MOBILE_TABS;

function Badge({ count }: { count: number }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.span
          key="badge"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          className="absolute -right-3 -top-1.5 z-10 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-white"
          style={{ background: "#EF4444", boxShadow: "0 0 0 2px var(--bg)" }}
          aria-label={`${count} notifications`}
        >
          {count > 99 ? "99+" : count}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

function MenuDrawer({
  open,
  onClose,
  role,
  badgeCounts,
  userName,
  userEmail,
}: {
  open: boolean;
  onClose: () => void;
  role: string;
  badgeCounts: Record<string, number>;
  userName?: string;
  userEmail?: string;
}) {
  const [animating, setAnimating] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || (href !== `/${role}` && pathname.startsWith(href));

  useEffect(() => {
    if (open) {
      setAnimating(false);
      const t = setTimeout(() => setAnimating(true), 20);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleClose = () => {
    setAnimating(false);
    setTimeout(() => onClose(), 300);
  };
  if (!open) return null;

  const sections = NAV_SECTIONS[role as keyof typeof NAV_SECTIONS] ?? [];
  const portal = PORTAL_COLORS[role as keyof typeof PORTAL_COLORS] ?? PORTAL_COLORS.admin;
  const accentColor = portal.color;
  const panelLabel = `${PORTAL_LABELS[role as keyof typeof PORTAL_LABELS] ?? "Portal"} Panel`;

  return (
    <>
      <div
        className="fixed inset-0 z-[55] bg-black/40 transition-opacity duration-300"
        style={{ opacity: animating ? 1 : 0 }}
        onClick={handleClose}
      />
      <div
        className="fixed bottom-0 right-0 top-0 z-[60] flex w-[85vw] max-w-[320px] flex-col bg-[var(--bg)] shadow-2xl transition-transform duration-300 ease-out"
        style={{
          transform: animating ? "translateX(0)" : "translateX(100%)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="flex items-center justify-between px-4 pb-3 pt-5">
          <div>
            <p className="font-syne text-sm font-bold" style={{ color: "var(--txt)" }}>
              Menu
            </p>
            <p className="text-[10px]" style={{ color: "var(--txt3)" }}>
              {panelLabel}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 hover:bg-[var(--elevated)]"
            style={{ color: "var(--txt2)" }}
          >
            <X size={18} />
          </button>
        </div>
        <div className="mx-4 border-t border-[var(--border)]" />
        {(userName || userEmail) && (
          <div
            className="mx-3 mt-2 flex items-center gap-3 rounded-xl p-3"
            style={{ background: "var(--elevated)" }}
          >
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ background: `linear-gradient(135deg,${accentColor},#EC4899)` }}
            >
              {userName?.charAt(0) || "U"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-[var(--txt)]">
                {userName || "User"}
              </p>
              {userEmail && <p className="truncate text-[10px] text-[var(--txt3)]">{userEmail}</p>}
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto py-2">
          {sections.map((section: any, si: number) => (
            <div key={section.title} className={si > 0 ? "mt-2" : ""}>
              <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.8px] text-[var(--txt3)]">
                {section.title}
              </p>
              {section.items.map((item: any) => {
                const active = isActive(item.href);
                const count = item.badgeKey ? badgeCounts[item.badgeKey] || 0 : 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleClose}
                    className="mx-2 my-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium no-underline transition-all active:scale-[0.98]"
                    style={{
                      color: active ? "#1D4ED8" : "var(--txt)",
                      background: active ? "rgba(59,130,246,0.10)" : "transparent",
                      borderLeft: active ? `2px solid ${accentColor}` : "2px solid transparent",
                    }}
                  >
                    <span style={{ color: active ? accentColor : "var(--txt3)" }}>
                      <NavIcon name={item.iconName} size={17} />
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {count > 0 && (
                      <span
                        className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                        style={{ background: "#EF4444" }}
                      >
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function MobileBottomNav(props: {
  role: keyof typeof TABS;
  userName?: string;
  userEmail?: string;
}) {
  return <MobileBottomNavInner {...props} />;
}

function MobileBottomNavInner({
  role,
  userName,
  userEmail,
}: {
  role: keyof typeof TABS;
  userName?: string;
  userEmail?: string;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const tabs = TABS[role] || [];
  // MUST call hooks before any early return
  var badges = useBadges();
  if (tabs.length === 0) return null;
  const badgeCounts: Record<string, number> = {
    orders: badges.orders || 0,
    invoices: badges.invoices || 0,
    messages: badges.messages || 0,
    notifications: badges.notifications || 0,
    total: badges.total || 0,
  };

  return (
    <>
      <nav className="safe-area-bottom fixed inset-x-0 bottom-0 z-50 lg:hidden">
        <div className="absolute inset-0 border-t border-[var(--border)] bg-[var(--bg)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]" />
        <div className="relative mx-auto flex h-16 max-w-[500px] items-center justify-around px-2">
          {tabs.map((tab) => {
            const isActive = tab.href
              ? pathname === tab.href || (tab.href !== `/${role}` && pathname.startsWith(tab.href))
              : menuOpen;
            const badgeCount = tab.badgeKey ? badgeCounts[tab.badgeKey] || 0 : 0;

            if (!tab.href) {
              return (
                <button
                  key="menu"
                  onClick={() => setMenuOpen(true)}
                  className={cn(
                    "relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-1",
                    "cursor-pointer border-none bg-transparent text-[10px] font-semibold transition-all duration-200",
                    "active:scale-90",
                    menuOpen ? "text-[#6D28D9]" : "text-[var(--txt3)]"
                  )}
                >
                  {menuOpen && (
                    <motion.div
                      layoutId="bottomNavActive"
                      className="bg-[#6D28D9]/8 absolute inset-1 rounded-2xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative leading-none">
                    <NavIcon name={tab.iconName} size={20} />
                    <Badge count={badgeCounts.total} />
                  </span>
                  <span className="relative max-w-full truncate">{tab.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={tab.href}
                href={tab.href!}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-1",
                  "text-[10px] font-semibold no-underline transition-all duration-200",
                  "active:scale-90",
                  isActive ? "text-[#6D28D9]" : "text-[var(--txt3)]",
                  tab.highlight && !isActive && "animate-pulse"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomNavActive"
                    className="bg-[#6D28D9]/8 absolute inset-1 rounded-2xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span
                  className="relative leading-none"
                  style={
                    tab.highlight && !isActive
                      ? {
                          color: "#8B5CF6",
                          filter: "drop-shadow(0 0 6px rgba(139,92,246,0.4))",
                          animation: "pulse 2s ease-in-out infinite",
                        }
                      : {}
                  }
                >
                  <NavIcon name={tab.iconName} size={20} />
                  <Badge count={badgeCount} />
                </span>
                <span
                  className="relative max-w-full truncate"
                  style={
                    tab.highlight && !isActive
                      ? {
                          background: "linear-gradient(135deg,#8B5CF6,#EC4899)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          fontWeight: 700,
                        }
                      : {}
                  }
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <MenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        role={role}
        badgeCounts={badgeCounts}
        userName={userName}
        userEmail={userEmail}
      />
    </>
  );
}
