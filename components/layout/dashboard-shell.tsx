import type { PropsWithChildren } from "react";
import Link from "next/link";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SiteLogo } from "@/components/branding/site-logo";
import { PortalNav, PortalNavMobile } from "@/components/layout/portal-nav";
import { DashboardMobileNav } from "@/components/layout/dashboard-mobile-nav";
import { DashboardMain } from "@/components/layout/dashboard-main";
import { LogoutButton } from "@/components/ui/logout-button";
import { siteConfig, getAdminNav } from "@/lib/site";

type DashboardShellProps = PropsWithChildren<{
  mode: "client" | "admin";
  role?: string | null;
  user?: { name?: string | null; email?: string | null };
  badges?: Record<string, number>;
}>;

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return (email?.[0] ?? "?").toUpperCase();
}

function roleLabel(role?: string | null): string {
  switch (role) {
    case "SUPER_ADMIN": return "Super Admin";
    case "MANAGER": return "Admin";
    case "DESIGNER": return "Designer";
    case "CHAT_SUPPORT": return "Support";
    case "MARKETING": return "Marketing";
    default: return "Admin";
  }
}

export function DashboardShell({ mode, role, children, user, badges }: DashboardShellProps) {
  const nav =
    mode === "client"
      ? siteConfig.protectedNav.client
      : getAdminNav(role);

  const userInitials = getInitials(user?.name, user?.email);
  const portalLabel = mode === "client" ? "Client Portal" : roleLabel(role);

  return (
    <div className="min-h-screen bg-background [animation:shell-fade_0.35s_ease_both]">
      {/* Top header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="page-shell flex h-14 items-center justify-between gap-3 md:h-16">
          <div className="flex items-center gap-2 md:gap-3">
            {/* Hamburger — rendered by client component, only shows on mobile */}
            <DashboardMobileNav
              items={nav}
              badges={badges}
              user={user}
              initials={userInitials}
            />
            <SiteLogo size="sm" />
            <div className="hidden h-4 w-px bg-border/80 sm:block" />
            <span className="hidden rounded-full border border-border/80 bg-secondary/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground sm:inline-flex">
              {portalLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden rounded-2xl px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-secondary/80 hover:text-foreground md:inline-flex"
            >
              Back to site
            </Link>
            <ThemeToggle />
            {user && (
              <div
                className="flex h-8 w-8 select-none items-center justify-center rounded-2xl bg-primary/10 text-xs font-bold text-primary md:h-9 md:w-9"
                title={user.name ?? user.email ?? "Account"}
              >
                {userInitials}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile nav strip — visible below lg, hidden on desktop */}
      <div className="sticky top-14 md:top-16 z-30 border-b border-border/80 bg-background/90 px-4 py-2 backdrop-blur-xl lg:hidden">
        <PortalNavMobile items={nav} badges={badges} />
      </div>

      {/* Body */}
      <div className="page-shell grid gap-6 py-6 md:gap-8 md:py-8 lg:grid-cols-[260px_1fr] lg:min-h-[calc(100vh-4rem)]">
        {/* Sidebar — desktop only */}
        <aside className="hidden lg:block [animation:shell-fade_0.45s_ease_0.05s_both]">
          <div className="sticky top-24 flex max-h-[calc(100vh-7rem)] flex-col gap-3">
            <div className="flex min-h-0 flex-col rounded-[1.75rem] border border-border/80 bg-card/70 p-3 backdrop-blur-sm">
              <div className="mb-1.5 shrink-0 border-b border-border/60 px-3 pb-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  {mode === "client" ? "My workspace" : "Operations"}
                </p>
              </div>
              <div className="overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/60">
                <PortalNav items={nav} badges={badges} />
              </div>
            </div>

            {user && (
              <div className="shrink-0 rounded-[1.75rem] border border-border/80 bg-card/70 px-4 py-3 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-2xl bg-primary/10 text-xs font-bold text-primary">
                    {userInitials}
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
                <LogoutButton className="w-full rounded-2xl border border-border/80 bg-transparent text-sm" />
              </div>
            )}
          </div>
        </aside>

        <DashboardMain>{children}</DashboardMain>
      </div>
    </div>
  );
}
