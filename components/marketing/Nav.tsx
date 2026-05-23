"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";

const LINKS = [
  { href: "/home",         label: "Home"           },
  { href: "/services",     label: "Services"       },
  { href: "/portfolio",    label: "Portfolio"      },
  { href: "/free-designs", label: "Free Designs"   },
  { href: "/pricing",      label: "Pricing"        },
  { href: "/contact",      label: "Contact"        },
];

export function Nav({ topOffset }: { topOffset?: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close mobile menu on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-[var(--bg)]/90 backdrop-blur-2xl border-b border-[var(--border)] shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
          : "bg-transparent"
      )}
      style={topOffset ? { top: topOffset } : undefined}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 flex items-center justify-between h-16 lg:h-[68px]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline flex-shrink-0">
          <img
            src="/images/black_logo.png"
            alt="GenXdigitizing"
            className="h-7 sm:h-8 w-auto"
          />
        </Link>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-0.5">
          {LINKS.map((l) => {
            const isActive = l.href === "/home"
              ? (pathname === "/" || pathname === "/home" || pathname.startsWith("/home/"))
              : (pathname === l.href || pathname.startsWith(l.href + "/"));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 no-underline",
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
        <div className="hidden lg:flex items-center gap-2">
          <a
            href="https://wa.me/1234567890"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium
              text-[#25D366] hover:bg-[#25D366]/10 transition-all duration-200 no-underline"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
            </svg>
            <span>WhatsApp</span>
          </a>
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/contact">
            <Button variant="grad" size="sm">Get a Quote</Button>
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
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-[11px] px-2.5">Sign In</Button>
          </Link>
          <Link href="/contact">
            <Button variant="grad" size="sm" className="text-[11px] px-3">Quote</Button>
          </Link>
        </div>

        {/* Mobile header */}
        <div className="flex md:hidden items-center gap-1">
          <a
            href="https://wa.me/1234567890"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-[#25D366] hover:bg-[#25D366]/10 transition-all duration-150"
            aria-label="WhatsApp"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
            </svg>
          </a>
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
                <Link href="/login" className="flex-1" onClick={() => setOpen(false)}>
                  <Button variant="ghost" size="md" className="w-full justify-center">Sign In</Button>
                </Link>
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
