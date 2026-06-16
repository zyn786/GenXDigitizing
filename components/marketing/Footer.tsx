"use client";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { SITE_STATS, SITE_INFO, fmtPlus } from "@/lib/site-config";
import { Button } from "@/components/ui/Button";

const SERVICES = [
  { label: "Embroidery Digitizing", href: "/services/embroidery-digitizing" },
  { label: "Vector Art Conversion", href: "/services/vector-art-conversion" },
  { label: "Custom Patches", href: "/services/custom-patches" },
  { label: "Cap Digitizing", href: "/services/cap-digitizing" },
  { label: "Left Chest Digitizing", href: "/services/left-chest-digitizing" },
  { label: "3D Puff Digitizing", href: "/services/3d-puff-digitizing" },
  { label: "Jacket Back Digitizing", href: "/services/jacket-back-digitizing" },
  { label: "Pricing", href: "/pricing" },
  { label: "Portfolio", href: "/portfolio" },
];

const COMPANY = [
  ["Contact Us", "/contact"],
  ["Privacy Policy", "/privacy-policy"],
  ["Terms & Conditions", "/terms-and-conditions"],
  ["Refund Policy", "/refund-policy"],
] as const;

export function Footer() {
  const currentYear = new Date().getFullYear();
  const copyrightStart = SITE_INFO.founded;

  return (
    <footer className="relative bg-[var(--surface)] pt-10 sm:pt-14 pb-6" role="contentinfo">
      {/* Top gradient accent line */}
      <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316]" />

      <div className="max-w-[1200px] mx-auto px-5 sm:px-6">
        {/* ── MOBILE ── */}
        <div className="md:hidden">
          {/* Logo */}
          <div className="text-center mb-5">
            <Link href="/home" className="inline-flex items-center gap-2 mb-2 no-underline">
              <Image src="/images/black_logo.png" alt="genxdigitizing" width={200} height={100} className="h-7 w-auto" />
            </Link>
            <p className="text-xs text-[var(--txt3)] leading-relaxed max-w-[240px] mx-auto">
              Premium embroidery digitizing, vector art, and custom patches — delivered production-ready.
            </p>
          </div>

          {/* Links — side by side */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-5">
            <div>
              <h4 className="font-syne font-bold text-[11px] uppercase tracking-wider text-[var(--txt)] mb-2.5">Services</h4>
              {SERVICES.map((s) => (
                <Link key={s.label} href={s.href}
                  className="block text-[13px] text-[var(--txt2)] hover:text-[var(--txt)] no-underline mb-1.5 transition-colors">
                  {s.label}
                </Link>
              ))}
            </div>
            <div>
              <h4 className="font-syne font-bold text-[11px] uppercase tracking-wider text-[var(--txt)] mb-2.5">Company</h4>
              {COMPANY.map(([label, href]) => (
                <Link key={label} href={href}
                  className="block text-[13px] text-[var(--txt2)] hover:text-[var(--txt)] no-underline mb-1.5 transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Trust row */}
          <div className="flex flex-wrap justify-center gap-1.5 mb-3">
            {[`🌍 ${SITE_STATS.countriesServed}+ Countries`, `⭐ ${SITE_STATS.avgRating}/5`, `✅ ${fmtPlus(SITE_STATS.ordersCompleted)} Orders`].map((t) => (
              <span key={t} className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--elevated)] text-[var(--txt2)] border border-[var(--border)]">
                {t}
              </span>
            ))}
          </div>

          {/* Security row */}
          <div className="flex items-center justify-center gap-4 text-[10px] text-[var(--txt3)] mb-5">
            <span>🔒 SSL Encrypted</span>
            <span>💳 Secure Payments</span>
          </div>

          {/* Buttons */}
          <div className="flex gap-2.5 mb-5">
            <Link href="/login" className="flex-1">
              <Button variant="outline" size="md" className="rounded-full w-full">Sign In</Button>
            </Link>
            <Link href="/register" className="flex-1">
              <Button variant="grad" size="md" className="rounded-full w-full" rightIcon={<ArrowRight size={15} />}>Get Started</Button>
            </Link>
          </div>
        </div>

        {/* ── DESKTOP ── */}
        <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr] gap-8 lg:gap-12 mb-8">
          {/* Brand */}
          <div>
            <Link href="/home"><Image src="/images/black_logo.png" alt="genxdigitizing" width={200} height={100} className="h-8 w-auto mb-3" /></Link>
            <p className="text-[13px] text-[var(--txt3)] leading-relaxed max-w-[260px] mb-4">
              Premium embroidery digitizing, vector art conversion, and custom patches — delivered production-ready.
            </p>
            <div className="flex gap-1.5 flex-wrap mb-3">
              {[`🌍 ${SITE_STATS.countriesServed}+ Countries`, `⭐ ${SITE_STATS.avgRating}/5`, `✅ ${fmtPlus(SITE_STATS.ordersCompleted)} Orders`].map((t) => (
                <span key={t} className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--border)] text-[var(--txt2)] border border-[var(--border2)]">{t}</span>
              ))}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[var(--txt3)]">
              <span>🔒 SSL Encrypted</span>
              <span>💳 Secure Payments</span>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-syne font-bold text-xs uppercase tracking-[0.08em] text-[var(--txt3)] mb-4">Services</h4>
            {SERVICES.map((s) => (
              <Link key={s.label} href={s.href} className="block text-[13px] text-[var(--txt2)] hover:text-[var(--txt)] no-underline mb-1.5 transition-colors">{s.label}</Link>
            ))}
          </div>

          {/* Company + Auth */}
          <div>
            <h4 className="font-syne font-bold text-xs uppercase tracking-[0.08em] text-[var(--txt3)] mb-4">Company</h4>
            {COMPANY.map(([label, href]) => (
              <Link key={label} href={href} className="block text-[13px] text-[var(--txt2)] hover:text-[var(--txt)] no-underline mb-1.5 transition-colors">{label}</Link>
            ))}
            <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--border)]">
              <Link href="/login"><Button variant="outline" size="sm" className="rounded-full">Sign In</Button></Link>
              <Link href="/register"><Button variant="grad" size="sm" className="rounded-full" rightIcon={<ArrowRight size={14} />}>Get Started</Button></Link>
            </div>
          </div>
        </div>

        {/* ── BOTTOM BAR ── */}
        <div className="border-t border-[var(--border)] pt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 text-center sm:text-left">
          <p className="text-[11px] text-[var(--txt3)]">
            &copy; {copyrightStart === currentYear ? currentYear : `${copyrightStart}–${currentYear}`} genxdigitizing. All rights reserved.
          </p>
          <p className="text-[11px] text-[var(--txt3)] flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] shadow-[0_0_6px_#16A34A]" />
            All systems operational
          </p>
          {SITE_INFO.social && (
            <div className="flex items-center justify-center gap-3">
              <a href={SITE_INFO.social.instagram} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[var(--txt3)] hover:text-[var(--txt)] transition-colors no-underline">📸 Instagram</a>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
