"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu, X, LayoutDashboard, LogIn } from "lucide-react";

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

  // Close mobile menu on route change — standard pattern
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Scroll detection
  React.useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Body scroll lock
  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // ESC to close
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header className={cn("sticky top-0 z-50 px-4 md:px-8", transparent ? "pt-2" : "pt-4")}>
        <div className="page-shell">
          <div
            className={cn(
              "rounded-[2rem] px-4 py-3 md:px-6 transition-all duration-300",
              transparent
                ? "border border-white/10 bg-[#07111f]/30 backdrop-blur"
                : "glass-panel premium-shadow"
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <SiteLogo size="sm" />

              {/* Desktop nav */}
              <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
                {siteConfig.nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-2xl px-4 py-2 text-sm font-medium transition-colors",
                      transparent
                        ? isActive(item.href)
                          ? "bg-white/10 text-white"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                        : isActive(item.href)
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* Desktop right actions */}
              <div className="hidden items-center gap-2 lg:flex">
                <ThemeToggle />
                {isAuthenticated ? (
                  <>
                    <Button
                      asChild variant="ghost"
                      className={cn("rounded-2xl gap-1.5", transparent
                        ? "text-white/70 hover:bg-white/10 hover:text-white"
                        : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                      )}
                    >
                      <Link href="/client/dashboard">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                    </Button>
                    <LogoutButton className={cn("rounded-2xl", transparent && "text-white/70 hover:bg-white/10 hover:text-destructive")} />
                  </>
                ) : (
                  <Button
                    asChild variant="ghost"
                    className={cn("rounded-2xl gap-1.5", transparent
                      ? "text-white/70 hover:bg-white/10 hover:text-white"
                      : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                    )}
                  >
                    <Link href="/login">
                      <LogIn className="h-4 w-4" />
                      Login
                    </Link>
                  </Button>
                )}
                <Button asChild variant="premium" shape="pill" size="lg">
                  <Link href="/contact">Get a quote</Link>
                </Button>
              </div>

              {/* Mobile: theme + hamburger */}
              <div className="flex items-center gap-2 lg:hidden">
                <ThemeToggle />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn("rounded-2xl", transparent && "text-white/80 hover:bg-white/10 hover:text-white")}
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setMobileOpen(false)}
        className={cn(
          "fixed inset-0 z-[9997] bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Right-side drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className={cn(
          "fixed top-0 right-0 z-[9998] flex h-full w-[min(320px,85vw)] flex-col bg-card shadow-2xl transition-transform duration-300 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
          <SiteLogo size="sm" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-2xl"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Nav links */}
        <nav aria-label="Mobile navigation" className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-1">
            {siteConfig.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center rounded-2xl px-4 py-3.5 text-base font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Bottom actions */}
        <div className="space-y-3 border-t border-border/80 px-4 pb-8 pt-4">
          {isAuthenticated ? (
            <>
              <Button asChild variant="outline" shape="pill" size="lg" className="w-full">
                <Link href="/client/dashboard" onClick={() => setMobileOpen(false)}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <LogoutButton className="w-full rounded-full border border-border/80 bg-transparent" />
            </>
          ) : (
            <Button asChild variant="outline" shape="pill" size="lg" className="w-full">
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
          <Button asChild variant="premium" shape="pill" size="lg" className="w-full">
            <Link href="/contact" onClick={() => setMobileOpen(false)}>
              Get a free quote
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}
