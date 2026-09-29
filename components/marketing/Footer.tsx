"use client";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { SITE_INFO, SITE_CLAIM_TAGS } from "@/lib/site-config";
import { Button } from "@/components/ui/Button";
import { FreeSampleBanner } from "@/components/marketing/FreeSampleBanner";

const SERVICES = [
  { label: "Embroidery Digitizing", href: "/services/embroidery-digitizing" },
  { label: "Vector Art Conversion", href: "/services/vector-art-conversion" },
  { label: "Custom Patches", href: "/services/custom-patches" },
  { label: "Cap Digitizing", href: "/services/cap-digitizing" },
  { label: "Left Chest Digitizing", href: "/services/left-chest-digitizing" },
  { label: "3D Puff Digitizing", href: "/services/3d-puff-digitizing" },
  { label: "Jacket Back Digitizing", href: "/services/jacket-back-digitizing" },
  { label: "Appliqué Digitizing", href: "/services/applique-digitizing" },
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
    <footer className="relative bg-[var(--surface)] pb-6 pt-10 sm:pt-14" role="contentinfo">
      {/* Top gradient accent line */}
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316]" />

      <div className="mx-auto max-w-[1200px] px-5 sm:px-6">
        {/* ── RESPONSIVE GRID (single DOM, no duplicate text) ── */}
        <div className="mb-6 grid grid-cols-1 gap-6 md:mb-8 md:grid-cols-[1.5fr_1fr_1fr] md:gap-8 lg:gap-12">
          {/* Brand */}
          <div className="text-center md:text-left">
            <Link href="/" className="mb-2 inline-flex items-center gap-2 no-underline md:mb-3">
              <Image
                src="/images/black_logo.png"
                alt="genxdigitizing"
                width={200}
                height={100}
                className="h-7 w-auto md:h-8"
              />
            </Link>
            <p className="mx-auto mb-3 max-w-[240px] text-xs leading-relaxed text-[var(--txt3)] md:mx-0 md:mb-4 md:max-w-[260px] md:text-[13px]">
              Premium embroidery digitizing, vector art, and custom patches — delivered
              production-ready.
            </p>
            <div className="mb-3 flex flex-wrap justify-center gap-1.5 md:justify-start">
              {SITE_CLAIM_TAGS.map((t) => (
                <span
                  key={t}
                  className="inline-flex rounded-full border border-[var(--border)] bg-[var(--elevated)] px-2.5 py-1 text-[11px] font-medium text-[var(--txt2)] md:border-[var(--border2)] md:bg-[var(--border)]"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-center gap-3 text-[10px] text-[var(--txt3)] md:justify-start md:text-[11px]">
              <span>🔒 SSL Encrypted</span>
              <span>💳 Secure Payments</span>
            </div>
          </div>

          {/* Services + Company: 2-col on all screens, merges into grid cols on md+ */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 md:gap-x-0">
              {/* Services */}
              <div>
                <h4 className="mb-2.5 font-syne text-[11px] font-bold uppercase tracking-wider text-[var(--txt)] md:mb-4 md:text-xs md:tracking-[0.08em] md:text-[var(--txt3)]">
                  Services
                </h4>
                {SERVICES.map((s) => (
                  <Link
                    key={s.label}
                    href={s.href}
                    className="mb-1.5 block text-[13px] text-[var(--txt2)] no-underline transition-colors hover:text-[var(--txt)]"
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
              {/* Company */}
              <div>
                <h4 className="mb-2.5 font-syne text-[11px] font-bold uppercase tracking-wider text-[var(--txt)] md:mb-4 md:text-xs md:tracking-[0.08em] md:text-[var(--txt3)]">
                  Company
                </h4>
                {COMPANY.map(([label, href]) => (
                  <Link
                    key={label}
                    href={href}
                    className="mb-1.5 block text-[13px] text-[var(--txt2)] no-underline transition-colors hover:text-[var(--txt)]"
                  >
                    {label}
                  </Link>
                ))}
                {/* Auth buttons — desktop only (inside Company column) */}
                <div className="mt-4 hidden gap-2 border-t border-[var(--border)] pt-4 md:flex">
                  <Link href="/login">
                    <Button variant="outline" size="sm" className="rounded-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button
                      variant="grad"
                      size="sm"
                      className="rounded-full"
                      rightIcon={<ArrowRight size={14} />}
                    >
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Auth buttons — mobile only (full-width below grid) */}
        <div className="mb-5 flex gap-2.5 md:hidden">
          <Link href="/login" className="flex-1">
            <Button variant="outline" size="md" className="w-full rounded-full">
              Sign In
            </Button>
          </Link>
          <Link href="/register" className="flex-1">
            <Button
              variant="grad"
              size="md"
              className="w-full rounded-full"
              rightIcon={<ArrowRight size={15} />}
            >
              Get Started
            </Button>
          </Link>
        </div>

        {/* ── FREE SAMPLE BANNER ── */}
        <div className="mb-5">
          <FreeSampleBanner variant="compact" />
        </div>

        {/* ── BOTTOM BAR ── */}
        <div className="flex flex-col gap-1.5 border-t border-[var(--border)] pt-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="text-[11px] text-[var(--txt3)]">
            &copy;{" "}
            {copyrightStart === currentYear ? currentYear : `${copyrightStart}–${currentYear}`}{" "}
            genxdigitizing. All rights reserved.
          </p>
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--txt3)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A] shadow-[0_0_6px_#16A34A]" />
            All systems operational
          </p>
        </div>
      </div>
    </footer>
  );
}
