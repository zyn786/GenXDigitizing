"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { GradientOrb } from "@/components/shared/GradientOrb";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SERVICE_CATEGORIES } from "@/lib/utils";
import { SITE_CLAIMS, SITE_CLAIM_LIST } from "@/lib/site-config";
import { PriceEstimator } from "@/components/marketing/PriceEstimator";
import type { ServiceCategory } from "@/types";

interface ServiceTier {
  id: string;
  category: string;
  label: string;
  size_desc: string;
  price: number;
  est_hours: string;
  is_big_design: boolean;
  is_active: boolean;
  sort_order: number;
}

const CATEGORY_THEMES: Record<
  string,
  {
    border: string;
    glow: string;
    gradient: string;
    soft: string;
    badge: string;
    emoji: string;
    name: string;
  }
> = {
  digitizing: {
    border: "border-[#2563EB]/20",
    glow: "shadow-[0_0_50px_rgba(37,99,235,0.14)]",
    gradient: "from-[#2563EB] to-[#1D4ED8]",
    soft: "from-[#2563EB]/15 to-transparent",
    badge: "bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20",
    emoji: "🧵",
    name: "Embroidery Digitizing",
  },
  vector: {
    border: "border-[#F97316]/20",
    glow: "shadow-[0_0_50px_rgba(249,115,22,0.14)]",
    gradient: "from-[#F97316] to-[#EA580C]",
    soft: "from-[#F97316]/15 to-transparent",
    badge: "bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20",
    emoji: "✏️",
    name: "Vector Redraw",
  },
  sewout: {
    border: "border-[#16A34A]/20",
    glow: "shadow-[0_0_50px_rgba(22,163,74,0.14)]",
    gradient: "from-[#16A34A] to-[#15803D]",
    soft: "from-[#16A34A]/15 to-transparent",
    badge: "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20",
    emoji: "🏷️",
    name: "Patch Design",
  },
};

const FREE = [
  { emoji: "🔄", title: "Format Conversion", desc: "All embroidery formats included." },
  { emoji: "♾️", title: "Unlimited Revisions", desc: "We'll revise until perfect." },
  { emoji: "⚡", title: "Rush Delivery", desc: "Fast turnaround at no extra cost." },
  { emoji: "🔥", title: "Urgent Orders", desc: "3-hour priority support available." },
  { emoji: "📞", title: "Live Support", desc: "Available 7 days a week." },
];

export function PricingContent({ tiers }: { tiers: ServiceTier[] }) {
  const grouped = useMemo(() => {
    const map: Record<string, ServiceTier[]> = {};
    for (const t of tiers) {
      if (!map[t.category]) map[t.category] = [];
      map[t.category].push(t);
    }
    return map;
  }, [tiers]);

  const categoryOrder = ["digitizing", "vector", "sewout"];

  return (
    <div className="overflow-x-hidden bg-[var(--bg)] text-[var(--txt)]">
      {/* HEADER */}
      <section className="relative px-4 py-10 text-center sm:px-6 sm:py-14 lg:py-20">
        <GradientOrb
          color="#2563EB"
          size={340}
          className="left-1/2 top-[-140px] -translate-x-1/2 opacity-15"
        />

        <Badge className="mb-4 rounded-full border border-[#16A34A]/20 bg-[#16A34A]/10 px-4 py-1.5 text-xs uppercase tracking-wider text-[#16A34A]">
          Transparent Pricing
        </Badge>

        <h1 className="mb-4 font-syne text-[clamp(32px,7vw,64px)] font-bold leading-[1.05]">
          Simple,
          <span className="block bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">
            No-Surprise Pricing
          </span>
        </h1>

        <p className="mx-auto max-w-[720px] text-sm leading-relaxed text-[var(--txt2)] sm:text-base lg:text-lg">
          Professional embroidery services with revisions, rush delivery, and format conversion
          always included.
        </p>

        {/* Social proof strip */}
        <div className="mt-8 grid grid-cols-2 items-center justify-center gap-2 px-4 sm:flex sm:flex-wrap sm:gap-3 sm:px-0">
          {[
            {
              emoji: "💵",
              label: `${SITE_CLAIMS.price.value} Standard Designs`,
              sub: "No hidden fees",
            },
            {
              emoji: "📦",
              label: `${SITE_CLAIMS.formats.value} Machine Formats`,
              sub: "All conversions free",
            },
            { emoji: "⚡", label: "3–24h Average", sub: "Turnaround time" },
            { emoji: "💳", label: "Pay When Satisfied", sub: "No risk to you" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 sm:px-4"
            >
              <span className="flex-shrink-0 text-lg sm:text-xl">{s.emoji}</span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-[var(--txt)] sm:text-xs">
                  {s.label}
                </p>
                <p className="text-[10px] text-[var(--txt3)]">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* REMOVED: an invented testimonial attributed to "Marcus R.,
            Streetwear Brand Owner, USA", claiming 200+ designs digitized for a
            streetwear brand. There is no such customer. Do not re-add invented
            quotes here — render real rows from the `reviews` table instead. */}
      </section>

      {/* PRICING CARDS */}
      <div className="mx-auto max-w-[1400px] space-y-6 px-4 pb-16 sm:space-y-8 sm:px-6 sm:pb-20 md:px-12 md:pb-24">
        {categoryOrder.map((cat) => {
          const tiersList = grouped[cat];
          if (!tiersList || tiersList.length === 0) return null;

          const theme = CATEGORY_THEMES[cat] || CATEGORY_THEMES.digitizing;
          const catMeta = SERVICE_CATEGORIES[cat as ServiceCategory];

          return (
            <AnimatedSection key={cat} className="!py-0" direction="up">
              <div
                className={`relative overflow-hidden rounded-2xl border bg-white/90 sm:rounded-[32px] ${theme.border} ${theme.glow} transition-transform duration-300 hover:-translate-y-1`}
              >
                <div className={`h-1.5 w-full bg-gradient-to-r ${theme.gradient}`} />

                <div className="relative border-b border-white/5 px-4 py-5 sm:px-7 sm:py-7">
                  <div className={`absolute inset-0 bg-gradient-to-r ${theme.soft}`} />
                  <div className="relative flex items-center gap-3 sm:gap-4">
                    <div
                      className={`h-12 w-12 rounded-2xl bg-gradient-to-br sm:h-16 sm:w-16 ${theme.gradient} flex flex-shrink-0 items-center justify-center text-2xl text-white shadow-2xl sm:text-3xl`}
                    >
                      {theme.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="mb-1 font-syne text-xl font-bold sm:text-3xl">{theme.name}</h2>
                      <p className="text-xs text-[var(--txt2)] sm:text-sm">
                        {catMeta?.label || theme.name} — starting from $
                        {Math.min(...tiersList.map((t) => t.price))}
                      </p>
                    </div>
                    <Link href="/register" className="hidden flex-shrink-0 sm:block">
                      <Button variant="grad" size="md" className="whitespace-nowrap">
                        Start Order →
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Mobile: tier cards */}
                <div className="space-y-3 px-4 py-4 sm:hidden">
                  {tiersList.map((tier, i) => (
                    <div
                      key={tier.id}
                      className="relative overflow-hidden rounded-2xl border border-[var(--border2)] bg-[var(--bg)] shadow-sm"
                    >
                      {/* Colored left accent */}
                      <div
                        className={`absolute bottom-3 left-0 top-3 w-[3px] rounded-full bg-gradient-to-b ${theme.gradient}`}
                      />
                      <div className="flex items-center justify-between p-4 pl-5">
                        <div className="min-w-0">
                          <div className="mb-0.5 flex items-center gap-2">
                            <span className="text-[13px] font-bold text-[var(--txt)]">
                              {tier.size_desc}
                            </span>
                            <span
                              className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${theme.badge}`}
                            >
                              {tier.label}
                            </span>
                          </div>
                          <div className="text-[11px] text-[var(--txt3)]">
                            {tier.is_big_design ? "Complex design" : "Standard turnaround"} ·{" "}
                            {tier.est_hours}
                          </div>
                          <div className="mt-2 flex gap-1.5">
                            <span className="rounded-full border border-[#16A34A]/15 bg-[#16A34A]/10 px-2 py-0.5 text-[10px] font-medium text-[#16A34A]">
                              ⚡ Rush FREE
                            </span>
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0 text-right">
                          <div className="font-syne text-2xl font-bold leading-none text-[var(--txt)]">
                            ${tier.price}
                          </div>
                          <div className="mt-0.5 text-[10px] text-[var(--txt3)]">USD</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Mobile: badges + CTA */}
                <div className="mx-4 mb-4 rounded-2xl border border-[var(--border)] bg-[var(--elevated)] p-4 sm:hidden">
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {["♾️ Free Revisions", "🔄 Format Conversion", "⚡ Rush Delivery"].map(
                      (item) => (
                        <span
                          key={item}
                          className="rounded-full border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1 text-[10px] font-semibold text-[var(--txt2)]"
                        >
                          {item}
                        </span>
                      )
                    )}
                  </div>
                  <Link href="/register" className="block">
                    <Button variant="grad" size="md" className="w-full rounded-full">
                      Order Now →
                    </Button>
                  </Link>
                </div>

                {/* Desktop: 3-column grid */}
                <div className="hidden sm:grid sm:grid-cols-3">
                  {tiersList.map((tier, i) => (
                    <div
                      key={tier.id}
                      className={`relative flex flex-col p-7 ${
                        i !== tiersList.length - 1 ? "border-[var(--border2)] sm:border-r" : ""
                      }`}
                    >
                      <Badge className={`mb-5 rounded-full px-3 py-1 text-xs ${theme.badge}`}>
                        {tier.label}
                      </Badge>
                      <div className="mb-3 flex items-end gap-2">
                        <div className="font-syne text-5xl font-bold leading-none">
                          ${tier.price}
                        </div>
                        <span className="mb-1 text-sm text-[var(--txt3)]">USD</span>
                      </div>
                      <div className="mb-1 text-base font-medium">{tier.size_desc}</div>
                      <div className="mb-5 text-sm text-[var(--txt3)]">
                        {tier.is_big_design ? "Complex design — ~12h" : "Standard turnaround"}
                      </div>
                      <div className="mt-auto flex flex-wrap gap-2">
                        <span className="rounded-full border border-[#16A34A]/15 bg-[#16A34A]/10 px-2.5 py-1 text-xs text-[#16A34A]">
                          ⚡ Rush FREE
                        </span>
                        <span className="rounded-full border border-[var(--border2)] bg-[var(--border)] px-2.5 py-1 text-xs text-[var(--txt2)]">
                          🕐 {tier.est_hours}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop: badges only */}
                <div className="hidden flex-wrap items-center gap-2 border-t border-white/5 bg-black/[0.02] px-7 py-4 sm:flex">
                  {["♾️ Free Revisions", "🔄 Format Conversion", "⚡ Rush Delivery"].map((item) => (
                    <span
                      key={item}
                      className={`rounded-full border px-3 py-1 text-xs ${theme.badge}`}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          );
        })}

        {/* PRICE ESTIMATOR — after pricing, before social proof */}
        <div className="pt-4 sm:pt-6">
          <AnimatedSection>
            <div className="mb-8 text-center sm:mb-10">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#F97316]/20 bg-[#F97316]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#F97316]">
                <span className="text-sm">🧮</span> Quick Estimator
              </span>
              <h2 className="mb-2 font-syne text-2xl font-bold sm:text-4xl">
                Calculate Your
                <span className="block bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">
                  Estimated Price
                </span>
              </h2>
              <p className="mx-auto max-w-lg text-sm text-[var(--txt2)] sm:text-base">
                Adjust the sliders below to get an instant estimate. Exact pricing confirmed after
                artwork review.
              </p>
            </div>
            <PriceEstimator tiers={tiers} />
          </AnimatedSection>
        </div>

        {/* Was "What Our Clients Say" with three invented quotes — David K.,
            Sarah M. and James T., none of whom exist. Replaced with what we can
            actually stand behind until the reviews table has published rows.
            To restore real reviews: select from `reviews` where is_published. */}
        <div className="pt-4 sm:pt-6">
          <div className="mb-6 text-center sm:mb-8">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#F59E0B]/20 bg-[#F59E0B]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#92400E]">
              ⭐ What You Get
            </span>
            <h2 className="mb-2 font-syne text-xl font-bold sm:text-3xl">Why Order From Us</h2>
            <p className="mx-auto max-w-lg text-sm text-[var(--txt2)]">
              Clear pricing, real turnaround times, and revisions until the file runs right.
            </p>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {SITE_CLAIM_LIST.map((c) => (
              <div
                key={c.label}
                className="flex flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-center"
              >
                <p className="mb-1 font-syne text-2xl font-bold text-[var(--txt)] sm:text-3xl">
                  {c.value}
                </p>
                <p className="text-[11px] text-[var(--txt3)] sm:text-xs">{c.label}</p>
              </div>
            ))}
          </div>

          {/* Trust badges row */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {[
              "🧵 Hand-digitized by professionals",
              "✅ Machine-tested before delivery",
              "🔄 All embroidery formats supported",
              "🌍 Worldwide — files delivered digitally",
            ].map((b) => (
              <span
                key={b}
                className="rounded-full border border-[var(--border2)] bg-[var(--elevated)] px-3 py-1.5 text-[11px] text-[var(--txt2)] sm:text-xs"
              >
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* FREE SECTION */}
        <div className="pt-6 sm:pt-8">
          <div className="mb-8 text-center sm:mb-10">
            <h2 className="mb-3 font-syne text-2xl font-bold sm:text-4xl">
              What's Always
              <span className="block bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">
                Included Free
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-sm text-[var(--txt2)] sm:text-base">
              No hidden charges. Everything below comes standard with every order.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {FREE.map((item) => (
              <div
                key={item.title}
                className="relative overflow-hidden rounded-2xl border border-[#16A34A]/15 bg-[var(--surface)] p-4 text-center shadow-[0_0_30px_rgba(22,163,74,0.06)] transition-transform duration-300 hover:-translate-y-1 sm:rounded-3xl sm:p-6"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#16A34A]/10 to-transparent" />
                <div className="relative z-10">
                  <div className="mb-2 text-2xl sm:mb-4 sm:text-4xl">{item.emoji}</div>
                  <h3 className="mb-1 font-syne text-sm font-bold text-[#16A34A] sm:mb-2 sm:text-lg">
                    {item.title}
                  </h3>
                  <p className="text-[11px] leading-relaxed text-[var(--txt2)] sm:text-sm">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FINAL CTA */}
        <div className="relative overflow-hidden rounded-2xl border border-[#2563EB]/20 bg-gradient-to-br from-[#2563EB]/15 via-white/40 to-[#F97316]/10 p-6 text-center shadow-[0_0_60px_rgba(37,99,235,0.12)] sm:rounded-[36px] sm:p-12">
          <GradientOrb
            color="#2563EB"
            size={200}
            className="-top-24 left-1/2 -translate-x-1/2 opacity-15"
          />
          <div className="relative z-10">
            <h2 className="mb-3 font-syne text-2xl font-bold sm:mb-4 sm:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="mx-auto mb-6 max-w-2xl text-sm text-[var(--txt2)] sm:mb-8 sm:text-lg">
              Create your account in seconds and start submitting professional embroidery jobs
              today.
            </p>
            <div className="flex flex-nowrap items-center justify-center gap-2 sm:gap-4">
              <Link href="/register">
                <Button variant="grad" size="md" className="sm:size-lg">
                  Create Free Account →
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="ghost" size="md" className="sm:size-lg">
                  Ask a Question
                </Button>
              </Link>
            </div>

            {/* Subscription upsell */}
            <div
              className="mt-6 rounded-2xl p-5 text-center"
              style={{
                background: "linear-gradient(135deg, rgba(37,99,235,0.06), rgba(124,58,237,0.04))",
                border: "1px solid rgba(37,99,235,0.15)",
              }}
            >
              <p
                className="mb-2 text-[14px] font-bold sm:text-base"
                style={{ color: "var(--txt)" }}
              >
                📦 Ordering 10+ designs/month?
              </p>
              <div className="mb-2 flex items-center justify-center gap-2 text-[12px] sm:text-sm">
                <span style={{ color: "var(--txt3)", textDecoration: "line-through" }}>
                  $7/design × 10 = $70
                </span>
                <span style={{ color: "var(--txt3)" }}>→</span>
                <span style={{ color: "#16A34A", fontWeight: 700 }}>$55/mo for 10 = save $15</span>
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                  style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A" }}
                >
                  21% off
                </span>
              </div>
              <p className="mb-2 text-[11px] sm:text-xs" style={{ color: "var(--txt2)" }}>
                Includes priority turnaround, free revisions, format conversions & rollover credits
              </p>
              <Link href="/subscribe">
                <Button variant="grad" size="sm">
                  Compare Plans →
                </Button>
              </Link>
            </div>

            {/* Guarantees */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--txt2)] sm:text-xs">
                <span className="text-xs">🛡️</span> Revisions until it runs right
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--txt2)] sm:text-xs">
                <span className="text-xs">♾️</span> Free unlimited revisions
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--txt2)] sm:text-xs">
                <span className="text-xs">⚡</span> Late delivery = free upgrade
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--txt2)] sm:text-xs">
                <span className="text-xs">💳</span> Pay only when satisfied
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--txt2)] sm:text-xs">
                <span className="text-xs">📞</span> 1-hour support response
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
