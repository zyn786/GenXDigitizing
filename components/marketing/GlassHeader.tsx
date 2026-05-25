"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ArrowRight, Menu, X, Sparkles, FileText } from "lucide-react";

/* ═════════════════════════════════════════════════════════════
   SERVICES DROPDOWN DATA
   ═════════════════════════════════════════════════════════════ */
const SERVICE_ITEMS = [
  { href: "/services", label: "All Services", icon: "✦" },
  { href: "/services#digitizing", label: "Embroidery Digitizing", icon: "🧵" },
  { href: "/services#vector", label: "Vector Conversion", icon: "✏️" },
  { href: "/services#patches", label: "Custom Patches", icon: "🏷️" },
];

const NAV_LINKS = [
  { href: "/portfolio", label: "Portfolio" },
  { href: "/pricing", label: "Pricing" },
  { href: "/free-designs", label: "Free Designs" },
  { href: "/contact", label: "Contact" },
];

const MOBILE_LINKS = [
  ...NAV_LINKS,
  { href: "/services", label: "Services" },
  { href: "/client/my-orders", label: "Client Portal" },
];

/* ═════════════════════════════════════════════════════════════
   GLASS HEADER
   ═════════════════════════════════════════════════════════════ */
export function GlassHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const handleDropdownEnter = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setDropdownOpen(true);
  };

  const handleDropdownLeave = () => {
    closeTimeout.current = setTimeout(() => setDropdownOpen(false), 150);
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      {/* Glass surface */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-[var(--border)] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 lg:h-[68px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 no-underline flex-shrink-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="font-jakarta font-bold text-lg text-[var(--txt)] hidden sm:block">
              GenX<span className="text-[#2563EB]">.</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            <Link
              href="/"
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-[var(--txt2)]
                hover:text-[var(--txt)] hover:bg-[var(--elevated)] transition-all duration-200 no-underline"
            >
              Home
            </Link>

            {/* Services dropdown */}
            <div
              ref={dropdownRef}
              className="relative"
              onMouseEnter={handleDropdownEnter}
              onMouseLeave={handleDropdownLeave}
            >
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center gap-1 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  dropdownOpen
                    ? "text-[#2563EB] bg-[#2563EB]/6"
                    : "text-[var(--txt2)] hover:text-[var(--txt)] hover:bg-[var(--elevated)]"
                }`}
              >
                Services
                <ChevronDown size={14} className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl border border-[var(--border)]
                      shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]
                      overflow-hidden z-50"
                  >
                    {SERVICE_ITEMS.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-[var(--txt2)]
                          hover:text-[var(--txt)] hover:bg-[var(--elevated)] transition-all duration-150 no-underline
                          first:pt-3.5 last:pb-3.5"
                      >
                        <span className="text-base">{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-[var(--txt2)]
                  hover:text-[var(--txt)] hover:bg-[var(--elevated)] transition-all duration-200 no-underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right CTAs */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/client/new-order"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold
                bg-[#10B981] text-white hover:bg-[#059669]
                shadow-[0_4px_14px_rgba(16,185,129,0.2)]
                active:scale-[0.98] transition-all duration-200 no-underline"
            >
              <FileText size={15} />
              New Order / Quote
              <ArrowRight size={14} />
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2.5 rounded-xl hover:bg-[var(--elevated)] transition-colors"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X size={20} className="text-[var(--txt)]" /> : <Menu size={20} className="text-[var(--txt)]" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile slide-out drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
              className="lg:hidden fixed top-0 right-0 bottom-0 w-[85vw] max-w-[340px] bg-white z-50
                shadow-[-8px_0_32px_rgba(0,0,0,0.08)] overflow-y-auto safe-area-top safe-area-bottom"
            >
              <div className="flex flex-col h-full">
                {/* Drawer header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                  <span className="font-jakarta font-bold text-lg">Menu</span>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="p-2 rounded-xl hover:bg-[var(--elevated)] transition-colors"
                  >
                    <X size={20} className="text-[var(--txt)]" />
                  </button>
                </div>

                {/* Drawer nav */}
                <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
                  <Link
                    href="/"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-sm font-semibold text-[var(--txt)]
                      hover:bg-[var(--elevated)] transition-all duration-150 no-underline"
                  >
                    <span className="text-lg">🏠</span> Home
                  </Link>

                  {/* Services section */}
                  <div className="mt-1 mb-1 px-3 py-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--txt3)]">Services</span>
                  </div>
                  {SERVICE_ITEMS.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-sm font-medium text-[var(--txt2)]
                        hover:text-[var(--txt)] hover:bg-[var(--elevated)] transition-all duration-150 no-underline"
                    >
                      <span className="text-lg">{item.icon}</span> {item.label}
                    </Link>
                  ))}

                  <div className="mt-2 mb-1 px-3 py-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--txt3)]">Quick Links</span>
                  </div>
                  {MOBILE_LINKS.filter((l) => l.label !== "Services").map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-sm font-medium text-[var(--txt2)]
                        hover:text-[var(--txt)] hover:bg-[var(--elevated)] transition-all duration-150 no-underline"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>

                {/* Drawer CTA */}
                <div className="px-4 py-4 border-t border-[var(--border)]">
                  <Link
                    href="/client/new-order"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-semibold
                      bg-[#10B981] text-white active:scale-[0.98] transition-transform no-underline
                      shadow-[0_4px_14px_rgba(16,185,129,0.2)]"
                  >
                    <FileText size={16} />
                    New Order / Quote
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
