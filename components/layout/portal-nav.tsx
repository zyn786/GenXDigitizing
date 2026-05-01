"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  RefreshCw,
  FileText,
  MessageCircle,
  ClipboardList,
  Inbox,
  Bell,
  ShieldCheck,
  FileQuestion,
  UserCircle,
  Briefcase,
  Users,
  Megaphone,
  Settings,
  Image,
  DollarSign,
  BarChart3,
  Tag,
  Activity,
} from "lucide-react";
import type { Route } from "next";

import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  "/client/dashboard": LayoutDashboard,
  "/client/orders": Package,
  "/client/quotes": FileQuestion,
  "/client/files": FolderOpen,
  "/client/revisions": RefreshCw,
  "/client/invoices": FileText,
  "/client/reports": BarChart3,
  "/client/support": MessageCircle,
  "/client/profile": UserCircle,
  "/admin/dashboard": LayoutDashboard,
  "/admin/orders": ClipboardList,
  "/admin/quotes": FileQuestion,
  "/admin/invoices": FileText,
  "/admin/support": Inbox,
  "/admin/staff": Users,
  "/admin/portfolio": Image,
  "/admin/pricing": DollarSign,
  "/admin/reports": BarChart3,
  "/admin/coupons": Tag,
  "/admin/notifications": Bell,
  "/admin/activity": Activity,
  "/admin/audit": ShieldCheck,
  "/admin/settings": Settings,
  "/admin/designer": Briefcase,
  "/admin/marketing": Megaphone,
};

type NavItem = { href: Route; label: string };

export function PortalNav({
  items,
  badges,
}: {
  items: readonly NavItem[];
  badges?: Record<string, number>;
}) {
  const pathname = usePathname();

  return (
    <nav className="space-y-0.5" aria-label="Sidebar navigation">
      {items.map((item) => {
        const href = item.href as string;
        const Icon = ICON_MAP[href] ?? LayoutDashboard;
        const active = pathname === href || pathname.startsWith(href + "/");
        const badgeCount = badges?.[href] ?? 0;

        return (
          <Link
            key={href}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
            )}
          >
            <div
              className={cn(
                "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors",
                active
                  ? "bg-primary/15 text-primary"
                  : "bg-secondary/60 text-muted-foreground group-hover:bg-secondary group-hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {badgeCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {badgeCount > 9 ? "9+" : badgeCount}
                </span>
              )}
            </div>
            <span className="flex-1">{item.label}</span>
            {active && (
              <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function PortalNavMobile({
  items,
  badges,
}: {
  items: readonly NavItem[];
  badges?: Record<string, number>;
}) {
  const pathname = usePathname();

  return (
    <nav
      className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Mobile navigation"
    >
      {items.map((item) => {
        const href = item.href as string;
        const active = pathname === href || pathname.startsWith(href + "/");
        const badgeCount = badges?.[href] ?? 0;

        return (
          <Link
            key={href}
            href={item.href}
            className={cn(
              "relative shrink-0 rounded-2xl px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "border border-border/80 bg-card/70 text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
            )}
          >
            {item.label}
            {badgeCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {badgeCount > 9 ? "9+" : badgeCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
