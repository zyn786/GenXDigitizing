"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { useBadges } from "@/hooks/BadgeProvider";
import { NAV_SECTIONS, PORTAL_COLORS, PORTAL_LABELS, isActiveRoute } from "@/lib/navigation";
import type { AuthUser } from "@/types";
import * as Icons from "lucide-react";

function NavIcon({ name, size = 16 }: { name: string; size?: number }) {
  const Icon = (Icons as any)[name];
  return Icon ? <Icon size={size} /> : null;
}

interface SidebarProps {
  user: AuthUser;
  badgeCounts?: Record<string, number>;
  subscriptionStatus?: string | null;
}

export function Sidebar({ user, badgeCounts = {}, subscriptionStatus }: SidebarProps) {
  const pathname = usePathname();
  const sections = NAV_SECTIONS[user.role] ?? [];
  const portal = PORTAL_COLORS[user.role];

  // Merge server initial counts with client real-time counts
  let liveBadges: Record<string, number> = badgeCounts;
  try {
    const b = useBadges();
    liveBadges = {
      ...badgeCounts,
      orders: b.orders || badgeCounts.orders || 0,
      invoices: b.invoices || badgeCounts.invoices || 0,
      messages: b.messages || badgeCounts.messages || 0,
      notifications: b.notifications || badgeCounts.notifications || 0,
    };
  } catch {}

  const isActive = (href: string) => {
    if (href === `/${user.role}`) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="portal-sidebar">
      {/* Logo */}
      <div className="px-4 pb-4 pt-5">
        <Link href={`/${user.role}`} className="mb-3.5 flex items-center gap-2.5">
          <Image
            src="/images/black_logo.png"
            alt="genxdigitizing"
            width={2000}
            height={1000}
            className="h-8 w-auto"
          />
        </Link>
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.5px]"
          style={{ background: portal.light, color: portal.color }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: portal.color }} />
          {PORTAL_LABELS[user.role]} Portal
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-[var(--border)]" />

      {/* Nav */}
      <nav className="min-h-0 flex-1 overflow-y-auto py-2">
        {sections.map((section, si) => (
          <div key={section.title} className={cn(si > 0 && "mt-3")}>
            <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.8px] text-[var(--txt3)]">
              {section.title}
            </p>
            {section.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href} className="no-underline">
                  <div
                    className="group relative mx-2 my-0.5 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-150 hover:bg-[var(--elevated)]"
                    style={{
                      color: active ? portal.text : "var(--txt2)",
                      background: active ? portal.light : "transparent",
                      borderLeft: active ? `2px solid ${portal.color}` : "2px solid transparent",
                    }}
                  >
                    <span
                      className="relative flex-shrink-0 transition-colors"
                      style={{ color: active ? portal.color : "var(--txt3)" }}
                    >
                      <NavIcon name={item.iconName} />
                      {/* Subscription status indicator on Plans & Billing */}
                      {item.href === "/client/subscribe" && subscriptionStatus && (
                        <span
                          className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full border border-[var(--bg)]"
                          style={{
                            background:
                              subscriptionStatus === "active"
                                ? "#16A34A"
                                : subscriptionStatus === "pending"
                                  ? "#F59E0B"
                                  : subscriptionStatus === "cancellation_requested"
                                    ? "#F97316"
                                    : "var(--txt3)",
                          }}
                          title={
                            subscriptionStatus === "active"
                              ? "Active plan"
                              : subscriptionStatus === "pending"
                                ? "Pending approval"
                                : subscriptionStatus === "cancellation_requested"
                                  ? "Cancellation under review"
                                  : ""
                          }
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {(() => {
                      const count: number = item.badgeKey ? liveBadges[item.badgeKey] || 0 : 0;
                      if (count > 0) {
                        return (
                          <span
                            className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                            style={{ background: portal.color }}
                          >
                            {count > 99 ? "99+" : count}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="mx-2 mb-2 rounded-xl p-3" style={{ background: "var(--elevated)" }}>
        <div className="flex items-center gap-2.5">
          <Avatar
            name={user.full_name || user.email}
            src={user.avatar_url}
            role={user.role}
            size={32}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-[var(--txt)]">
              {user.full_name || "User"}
            </p>
            <p className="truncate text-[10px] text-[var(--txt3)]">{user.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
