"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/ui/logout-button";
import { SiteLogo } from "@/components/branding/site-logo";
import { PortalNav } from "@/components/layout/portal-nav";
import { cn } from "@/lib/utils";
import type { Route } from "next";

type NavItem = { href: Route; label: string };

type Props = {
  items: readonly NavItem[];
  badges?: Record<string, number>;
  user?: { name?: string | null; email?: string | null };
  initials?: string;
};

export function DashboardMobileNav({ items, badges, user, initials }: Props) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  // Close mobile nav on route change — standard pattern
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { setOpen(false); }, [pathname]);

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* Hamburger — only visible on mobile */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="rounded-2xl lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-[9997] bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Left-side drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Dashboard navigation"
        className={cn(
          "fixed top-0 left-0 z-[9998] flex h-full w-[min(280px,85vw)] flex-col border-r border-border/80 bg-background shadow-2xl transition-transform duration-300 ease-in-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
          <SiteLogo size="sm" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-2xl"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Nav items with icons */}
        <div className="flex-1 overflow-y-auto p-3">
          <PortalNav items={items} badges={badges} />
        </div>

        {/* Footer: user info + back to site */}
        <div className="space-y-2 border-t border-border/80 p-4">
          {user && (
            <div className="flex items-center gap-3 rounded-2xl bg-secondary/50 px-3 py-2.5">
              <div className="flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                {initials}
              </div>
              <div className="min-w-0">
                {user.name && (
                  <p className="truncate text-sm font-semibold leading-tight">{user.name}</p>
                )}
                {user.email && (
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                )}
              </div>
            </div>
          )}
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center rounded-2xl border border-border/80 py-2 text-xs font-medium text-muted-foreground transition hover:bg-secondary/80 hover:text-foreground"
          >
            ← Back to site
          </Link>
          <LogoutButton className="w-full rounded-2xl border border-border/80 bg-transparent" />
        </div>
      </div>
    </>
  );
}
