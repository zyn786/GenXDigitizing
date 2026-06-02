"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { GradientOrb } from "@/components/shared/GradientOrb";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SERVICE_CATEGORIES } from "@/lib/utils";
import { SITE_STATS, fmtPlus } from "@/lib/site-config";
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

const CATEGORY_THEMES: Record<string, {
  border: string; glow: string; gradient: string; soft: string;
  badge: string; emoji: string; name: string;
}> = {
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
    <div className="bg-[var(--bg)] text-[var(--txt)] overflow-x-hidden">
      {/* HEADER */}
      <section className="relative text-center py-10 sm:py-14 lg:py-20 px-4 sm:px-6">
        <GradientOrb color="#2563EB" size={340} className="top-[-140px] left-1/2 -translate-x-1/2 opacity-15" />

        <Badge className="mb-4 px-4 py-1.5 rounded-full bg-[#16A34A]/10 border border-[#16A34A]/20 text-[#16A34A] uppercase tracking-wider text-xs">
          Transparent Pricing
        </Badge>

        <h1 className="font-syne font-bold text-[clamp(32px,7vw,64px)] leading-[1.05] mb-4">
          Simple,
          <span className="block bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">
            No-Surprise Pricing
          </span>
        </h1>

        <p className="text-sm sm:text-base lg:text-lg text-[var(--txt2)] max-w-[720px] mx-auto leading-relaxed">
          Professional embroidery services with revisions, rush delivery,
          and format conversion always included.
        </p>

        {/* Social proof strip */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2 sm:gap-3 mt-8 px-4 sm:px-0">
          {[
            { emoji: "⭐", label: `${SITE_STATS.avgRating} / 5 Rating`, sub: `${fmtPlus(SITE_STATS.verifiedReviews)} reviews` },
            { emoji: "📦", label: `${fmtPlus(SITE_STATS.ordersCompleted)} Orders`, sub: "Delivered worldwide" },
            { emoji: "⚡", label: "3–24h Average", sub: "Turnaround time" },
            { emoji: "💳", label: "Pay When Satisfied", sub: "No risk to you" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2.5 px-3 sm:px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
              <span className="text-lg sm:text-xl flex-shrink-0">{s.emoji}</span>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-semibold text-[var(--txt)] truncate">{s.label}</p>
                <p className="text-[10px] text-[var(--txt3)]">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Testimonial quote */}
        <div className="mt-5 max-w-[600px] mx-auto px-4 sm:px-0">
          <div className="flex items-start gap-3 p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
            <span className="text-xl sm:text-2xl flex-shrink-0 mt-0.5">💬</span>
            <div>
              <p className="text-[13px] sm:text-sm text-[var(--txt2)] italic leading-relaxed">
                &ldquo;GenX digitized 200+ designs for our streetwear brand. Zero errors, always on time, and the free format conversion saves us hours every week.&rdquo;
              </p>
              <p className="text-[11px] sm:text-xs text-[var(--txt3)] mt-2">
                — <strong className="text-[var(--txt)]">Marcus R.</strong>, Streetwear Brand Owner, USA
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING CARDS */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 pb-16 sm:pb-20 md:pb-24 space-y-6 sm:space-y-8">
        {categoryOrder.map((cat) => {
          const tiersList = grouped[cat];
          if (!tiersList || tiersList.length === 0) return null;

          const theme = CATEGORY_THEMES[cat] || CATEGORY_THEMES.digitizing;
          const catMeta = SERVICE_CATEGORIES[cat as ServiceCategory];

          return (
            <AnimatedSection key={cat} className="!py-0" direction="up">
              <div
                className={`relative overflow-hidden rounded-2xl sm:rounded-[32px] border bg-[var(--surface)]/90 backdrop-blur-xl ${theme.border} ${theme.glow} transition-transform duration-300 hover:-translate-y-1`}
              >
                <div className={`h-1.5 w-full bg-gradient-to-r ${theme.gradient}`} />

                <div className="relative px-4 sm:px-7 py-5 sm:py-7 border-b border-white/5">
                  <div className={`absolute inset-0 bg-gradient-to-r ${theme.soft}`} />
                  <div className="relative flex items-center gap-3 sm:gap-4">
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-2xl sm:text-3xl text-white shadow-2xl flex-shrink-0`}>
                      {theme.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-syne font-bold text-xl sm:text-3xl mb-1">{theme.name}</h2>
                      <p className="text-[var(--txt2)] text-xs sm:text-sm">
                        {catMeta?.label || theme.name} — starting from ${Math.min(...tiersList.map(t => t.price))}
                      </p>
                    </div>
                    <Link href="/register" className="hidden sm:block flex-shrink-0">
                      <Button variant="grad" size="md" className="whitespace-nowrap">
                        Start Order →
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Mobile: tier cards */}
                <div className="sm:hidden px-4 py-4 space-y-3">
                  {tiersList.map((tier, i) => (
                    <div
                      key={tier.id}
                      className="relative rounded-2xl bg-[var(--bg)] border border-[var(--border2)] overflow-hidden shadow-sm"
                    >
                      {/* Colored left accent */}
                      <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-gradient-to-b ${theme.gradient}`} />
                      <div className="flex items-center justify-between p-4 pl-5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[13px] font-bold text-[var(--txt)]">{tier.size_desc}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${theme.badge}`}>{tier.label}</span>
                          </div>
                          <div className="text-[11px] text-[var(--txt3)]">
                            {tier.is_big_design ? "Complex design" : "Standard turnaround"} · {tier.est_hours}
                          </div>
                          <div className="flex gap-1.5 mt-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] font-medium border border-[#16A34A]/15">⚡ Rush FREE</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <div className="font-syne font-bold text-2xl leading-none text-[var(--txt)]">${tier.price}</div>
                          <div className="text-[10px] text-[var(--txt3)] mt-0.5">USD</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Mobile: badges + CTA */}
                <div className="sm:hidden mx-4 mb-4 p-4 rounded-2xl bg-[var(--elevated)] border border-[var(--border)]">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {["♾️ Free Revisions", "🔄 Format Conversion", "⚡ Rush Delivery"].map((item) => (
                      <span key={item} className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[var(--bg)] text-[var(--txt2)] border border-[var(--border)]">{item}</span>
                    ))}
                  </div>
                  <Link href="/register" className="block">
                    <Button variant="grad" size="md" className="w-full rounded-full">Order Now →</Button>
                  </Link>
                </div>

                {/* Desktop: 3-column grid */}
                <div className="hidden sm:grid sm:grid-cols-3">
                  {tiersList.map((tier, i) => (
                    <div
                      key={tier.id}
                      className={`relative p-7 flex flex-col ${
                        i !== tiersList.length - 1
                          ? "sm:border-r border-[var(--border2)]"
                          : ""
                      }`}
                    >
                      <Badge className={`mb-5 px-3 py-1 rounded-full text-xs ${theme.badge}`}>
                        {tier.label}
                      </Badge>
                      <div className="flex items-end gap-2 mb-3">
                        <div className="font-syne font-bold text-5xl leading-none">${tier.price}</div>
                        <span className="text-sm text-[var(--txt3)] mb-1">USD</span>
                      </div>
                      <div className="text-base font-medium mb-1">{tier.size_desc}</div>
                      <div className="text-sm text-[var(--txt3)] mb-5">
                        {tier.is_big_design ? "Complex design — ~12h" : "Standard turnaround"}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-auto">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/15">⚡ Rush FREE</span>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--border)] border border-[var(--border2)] text-[var(--txt2)]">🕐 {tier.est_hours}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop: badges only */}
                <div className="hidden sm:flex px-7 py-4 border-t border-white/5 flex-wrap items-center gap-2 bg-black/[0.02]">
                  {["♾️ Free Revisions", "🔄 Format Conversion", "⚡ Rush Delivery"].map((item) => (
                    <span key={item} className={`px-3 py-1 rounded-full text-xs border ${theme.badge}`}>{item}</span>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          );
        })}

        {/* Testimonials */}
        <div className="pt-4 sm:pt-6">
          <div className="text-center mb-6 sm:mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#F59E0B]/10 text-[#92400E] border border-[#F59E0B]/20 mb-3">
{`⭐ Trusted by ${fmtPlus(SITE_STATS.clientsServed)} Clients`}
            </span>
            <h2 className="font-syne font-bold text-xl sm:text-3xl mb-2">What Our Clients Say</h2>
            <p className="text-sm text-[var(--txt2)] max-w-lg mx-auto">Real feedback from real clients who trust us with their embroidery digitizing.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
            {[
              {
                quote: "Fastest turnaround I've seen. Submitted 15 cap logos at 10pm — all 15 were in my inbox by morning. The stitch quality is flawless.",
                name: "David K.",
                role: "Promotional Products Distributor, Canada",
                stars: 5,
              },
              {
                quote: "We switched from a $25/design service to GenX at $7. Better quality, faster delivery, and free revisions. Best vendor decision we've made.",
                name: "Sarah M.",
                role: "Corporate Apparel Brand, UK",
                stars: 5,
              },
              {
                quote: "Their vector redraw service is incredible. We send hand-drawn sketches and get back production-ready vectors. Saves our design team days of work.",
                name: "James T.",
                role: "Screen Printing Shop, Australia",
                stars: 5,
              },
            ].map((t) => (
              <div key={t.name} className="rounded-2xl p-5 bg-[var(--surface)] border border-[var(--border)] flex flex-col">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <span key={i} className="text-sm" style={{ color: "#F59E0B" }}>★</span>
                  ))}
                </div>
                <p className="text-[13px] text-[var(--txt2)] leading-relaxed italic mb-4 flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="text-xs font-semibold text-[var(--txt)]">{t.name}</p>
                  <p className="text-[10px] text-[var(--txt3)]">{t.role}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust badges row */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {[
              "🧵 Hand-digitized by professionals",
              "✅ Machine-tested before delivery",
              "🔄 All embroidery formats supported",
              `🌍 Clients in ${fmtPlus(SITE_STATS.countriesServed)} countries`,
            ].map((b) => (
              <span key={b} className="text-[11px] sm:text-xs text-[var(--txt2)] px-3 py-1.5 rounded-full bg-[var(--elevated)] border border-[var(--border2)]">
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* FREE SECTION */}
        <div className="pt-6 sm:pt-8">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="font-syne font-bold text-2xl sm:text-4xl mb-3">
              What's Always
              <span className="block bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">Included Free</span>
            </h2>
            <p className="text-sm sm:text-base text-[var(--txt2)] max-w-2xl mx-auto">No hidden charges. Everything below comes standard with every order.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {FREE.map((item) => (
              <div key={item.title}
                className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#16A34A]/15 bg-[var(--surface)] p-4 sm:p-6 text-center shadow-[0_0_30px_rgba(22,163,74,0.06)] transition-transform duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-[#16A34A]/10 to-transparent" />
                <div className="relative z-10">
                  <div className="text-2xl sm:text-4xl mb-2 sm:mb-4">{item.emoji}</div>
                  <h3 className="font-syne font-bold text-sm sm:text-lg mb-1 sm:mb-2 text-[#16A34A]">{item.title}</h3>
                  <p className="text-[11px] sm:text-sm text-[var(--txt2)] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FINAL CTA */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-[36px] border border-[#2563EB]/20 bg-gradient-to-br from-[#2563EB]/15 via-white/40 to-[#F97316]/10 p-6 sm:p-12 text-center shadow-[0_0_60px_rgba(37,99,235,0.12)]">
          <GradientOrb color="#2563EB" size={200} className="-top-24 left-1/2 -translate-x-1/2 opacity-15" />
          <div className="relative z-10">
            <h2 className="font-syne font-bold text-2xl sm:text-4xl mb-3 sm:mb-4">Ready to Get Started?</h2>
            <p className="text-sm sm:text-lg text-[var(--txt2)] max-w-2xl mx-auto mb-6 sm:mb-8">
              Create your account in seconds and start submitting professional embroidery jobs today.
            </p>
            <div className="flex flex-nowrap items-center justify-center gap-2 sm:gap-4">
              <Link href="/register">
                <Button variant="grad" size="md" className="sm:size-lg">Create Free Account →</Button>
              </Link>
              <Link href="/contact">
                <Button variant="ghost" size="md" className="sm:size-lg">Ask a Question</Button>
              </Link>
            </div>

            {/* Guarantees */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 mt-6">
              <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-[var(--txt2)]">
                <span className="text-xs">🛡️</span> {SITE_STATS.satisfactionRate}% satisfaction guarantee
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-[var(--txt2)]">
                <span className="text-xs">♾️</span> Free unlimited revisions
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-[var(--txt2)]">
                <span className="text-xs">⚡</span> Late delivery = free upgrade
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-[var(--txt2)]">
                <span className="text-xs">💳</span> Pay only when satisfied
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-[var(--txt2)]">
                <span className="text-xs">📞</span> 1-hour support response
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
