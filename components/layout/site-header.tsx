"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  LayoutDashboard,
  LogIn,
  Menu,
  MessageCircle,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LogoutButton } from "@/components/ui/logout-button";
import { SiteLogo } from "@/components/branding/site-logo";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  const pathname = usePathname();
  const { status } = useSession();

  const isAuthenticated = status === "authenticated";
  const isHomePage = pathname === "/";
  const transparent = isHomePage && !scrolled;

  const isActive = React.useCallback(
    (href: string) =>
      href === "/" ? pathname === "/" : pathname.startsWith(href),
    [pathname],
  );

  React.useEffect(() => {
    React.startTransition(() => setMobileOpen(false));
  }, [pathname]);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3 md:px-8 md:pt-4">
        <div className="page-shell">
          <div
            className={cn(
              "relative overflow-hidden rounded-[1.65rem] border px-3 py-2.5 shadow-sm backdrop-blur-xl transition-all duration-300 md:px-5 md:py-3",
              transparent
                ? "border-slate-200/70 bg-white/55 shadow-slate-950/5 dark:border-white/[0.08] dark:bg-[#07111f]/45 dark:shadow-black/20"
                : "border-slate-200 bg-white/82 shadow-xl shadow-slate-950/5 dark:border-white/[0.1] dark:bg-[#07111f]/82 dark:shadow-black/25",
            )}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(99,102,241,0.12),transparent_34%),radial-gradient(circle_at_85%_70%,rgba(168,85,247,0.08),transparent_36%)]" />

            <div className="relative z-10 flex items-center justify-between gap-3">
              {/* IMPORTANT:
                  Do NOT wrap SiteLogo with <Link>.
                  SiteLogo already contains its own <Link href="/">.
              */}
              <div className="shrink-0">
                <SiteLogo size="sm" />
              </div>

              {/* Desktop nav */}
              <nav
                aria-label="Primary navigation"
                className="hidden items-center gap-1 rounded-full border border-slate-200/70 bg-white/45 p-1 backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.035] lg:flex"
              >
                {siteConfig.nav.map((item) => {
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-bold transition-all duration-300",
                        active
                          ? "bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950"
                          : "text-slate-600 hover:bg-white/80 hover:text-slate-950 dark:text-white/58 dark:hover:bg-white/[0.08] dark:hover:text-white",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Desktop actions */}
              <div className="hidden items-center gap-2 lg:flex">
                <ThemeToggle />

                {isAuthenticated ? (
                  <>
                    <Button
                      asChild
                      variant="ghost"
                      className="h-10 rounded-full px-4 font-bold text-slate-600 hover:bg-white/70 hover:text-slate-950 dark:text-white/58 dark:hover:bg-white/[0.08] dark:hover:text-white"
                    >
                      <Link href="/client/dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </Button>

                    <LogoutButton className="h-10 rounded-full border border-slate-200 bg-white/45 px-4 font-bold text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-white/58 dark:hover:bg-white/[0.08] dark:hover:text-white" />
                  </>
                ) : (
                  <Button
                    asChild
                    variant="ghost"
                    className="h-10 rounded-full px-4 font-bold text-slate-600 hover:bg-white/70 hover:text-slate-950 dark:text-white/58 dark:hover:bg-white/[0.08] dark:hover:text-white"
                  >
                    <Link href="/login">
                      <LogIn className="mr-2 h-4 w-4" />
                      Login
                    </Link>
                  </Button>
                )}

                <Button
                  asChild
                  variant="premium"
                  shape="pill"
                  size="lg"
                  className="h-10 px-5 shadow-lg shadow-indigo-500/15"
                >
                  <Link href="/contact">
                    Get a quote
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {/* Mobile actions */}
              <div className="flex items-center gap-2 lg:hidden">
                <ThemeToggle />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-2xl border border-slate-200 bg-white/50 text-slate-800 hover:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:hover:bg-white/[0.1]"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open menu"
                  aria-expanded={mobileOpen}
                  aria-controls="mobile-site-menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setMobileOpen(false)}
        className={cn(
          "fixed inset-0 z-[9997] bg-slate-950/65 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      />

      {/* Mobile drawer */}
      <aside
        id="mobile-site-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className={cn(
          "fixed right-0 top-0 z-[9998] flex h-dvh w-[min(360px,88vw)] flex-col border-l border-slate-200 bg-[#f7f7fb] shadow-2xl shadow-slate-950/20 transition-transform duration-300 ease-out dark:border-white/10 dark:bg-[#050814] dark:shadow-black/40 lg:hidden",
          mobileOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="relative overflow-hidden border-b border-slate-200 px-5 py-4 dark:border-white/10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.16),transparent_34%),radial-gradient(circle_at_85%_75%,rgba(168,85,247,0.1),transparent_36%)]" />

          <div className="relative z-10 flex items-center justify-between gap-4">
            <SiteLogo size="sm" />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-2xl border border-slate-200 bg-white/60 text-slate-800 hover:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:hover:bg-white/[0.1]"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <nav
          aria-label="Mobile navigation"
          className="flex-1 overflow-y-auto px-4 py-5"
        >
          <div className="space-y-2">
            {siteConfig.nav.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-2xl border px-4 py-3.5 text-base font-bold transition-all duration-300",
                    active
                      ? "border-indigo-500/25 bg-indigo-500/10 text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200"
                      : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white/70 hover:text-slate-950 dark:text-white/58 dark:hover:border-white/10 dark:hover:bg-white/[0.06] dark:hover:text-white",
                  )}
                >
                  {item.label}
                  {active && (
                    <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.9)]" />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="mt-5 rounded-[1.75rem] border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                <MessageCircle className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-black text-slate-950 dark:text-white">
                  Need help with an order?
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-white/45">
                  Send artwork, placement, size, fabric, and colors — we’ll
                  guide the next step.
                </p>
              </div>
            </div>
          </div>
        </nav>

        <div className="border-t border-slate-200 px-4 pb-6 pt-4 dark:border-white/10">
          <div className="space-y-3">
            {isAuthenticated ? (
              <>
                <Button
                  asChild
                  variant="outline"
                  shape="pill"
                  size="lg"
                  className="w-full border-slate-300 bg-white/70 font-bold text-slate-900 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                >
                  <Link
                    href="/client/dashboard"
                    onClick={() => setMobileOpen(false)}
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>

                <LogoutButton className="w-full rounded-full border border-slate-300 bg-white/40 font-bold text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70" />
              </>
            ) : (
              <Button
                asChild
                variant="outline"
                shape="pill"
                size="lg"
                className="w-full border-slate-300 bg-white/70 font-bold text-slate-900 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
              >
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Link>
              </Button>
            )}

            <Button
              asChild
              variant="premium"
              shape="pill"
              size="lg"
              className="w-full font-bold shadow-xl shadow-indigo-500/20"
            >
              <Link href="/contact" onClick={() => setMobileOpen(false)}>
                Get a free quote
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}