"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { Search, ChevronDown, ChevronUp, Star, ArrowRight, Upload, Check, Shield, Zap, GripHorizontal } from "lucide-react";
import { SITE_STATS, fmtPlus } from "@/lib/site-config";
import { Button } from "@/components/ui/Button";
import dynamic from "next/dynamic";
import { FreeDesignsPreview } from "@/components/free-designs/FreeDesignsPreview";
import { TrustStatsSection } from "@/components/shared/TrustStatsSection";

const PortfolioPreview = dynamic(
  () => import("@/components/portfolio/PortfolioPreview").then((m) => ({ default: m.PortfolioPreview })),
  { ssr: false, loading: () => <div className="py-16" /> }
);


// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════


const SERVICE_CARDS = [
  { emoji: "🧵", title: "Embroidery Digitizing", label: "DST / PES Ready" },
  { emoji: "✦", title: "Vector Artwork", label: "AI / EPS / SVG" },
  { emoji: "🏷️", title: "Custom Patches", label: "Merrow / PVC / Woven" },
  { emoji: "🧢", title: "3D Puff Caps", label: "Raised Stitch Finish" },
  { emoji: "🧥", title: "Jacket Back", label: "Stitch Finish" },
  { emoji: "👕", title: "Left Chest", label: "Small Logo Digitizing" },
];

const SERVICES_GRID = [
  { emoji: "🧢", label: "Cap Digitizing", href: "/services" },
  { emoji: "👕", label: "Left Chest", href: "/services" },
  { emoji: "🧥", label: "Jacket Back", href: "/services" },
  { emoji: "🎩", label: "3D Puff", href: "/services" },
  { emoji: "🏷️", label: "Patches", href: "/services" },
  { emoji: "✏️", label: "Vector Conversion", href: "/services" },
  { emoji: "🧣", label: "Beanies", href: "/services" },
  { emoji: "🪣", label: "Towels", href: "/services" },
  { emoji: "🎒", label: "Bags", href: "/services" },
  { emoji: "👔", label: "Uniforms", href: "/services" },
  { emoji: "⚽", label: "Sportswear", href: "/services" },
  { emoji: "🏢", label: "Corporate Apparel", href: "/services" },
];

const CASE_STUDY = {
  client: "GENX",
  industry: "Promotional Products",
  problem: "Their previous digitizer produced files with inconsistent density. Caps, in particular, had thread breaks on curved sections and registration errors on small text.",
  solution: "GenX manually digitized 200+ cap designs with structural underlay, adjusted stitch angles for curved surfaces, and provided sew-out photos with every proof.",
  results: [
    { metric: "98%", label: "First-run approval rate" },
    { metric: "40%", label: "Fewer thread breaks" },
    { metric: "12h", label: "Average turnaround" },
  ],
};

// ═══════════════════════════════════════════════════════════════
// SHARED SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#2563EB]/8 text-[#2563EB] border border-[#2563EB]/15">
      {children}
    </span>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-10 sm:mb-14">
      <h2 className="font-syne font-bold text-3xl md:text-5xl mb-4 leading-[1.15] bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm sm:text-base text-[var(--txt2)] max-w-xl mx-auto">{subtitle}</p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// INFINITE SERVICE CARDS SLIDER
// ═══════════════════════════════════════════════════════════════

function ServiceCardsSlider() {
  return (
    <div className="relative overflow-hidden py-2" aria-label="Our services">
      <div className="flex gap-3 animate-marquee w-max">
        {/* Render 3 sets for seamless loop */}
        {[...SERVICE_CARDS, ...SERVICE_CARDS, ...SERVICE_CARDS].map((card, i) => (
          <div
            key={`${card.title}-${i}`}
            className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 flex-shrink-0 min-w-[180px] sm:min-w-[220px]"
          >
            <span className="text-xl flex-shrink-0">{card.emoji}</span>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[var(--txt)] truncate">{card.title}</div>
              <div className="text-[10px] text-[var(--txt3)]">{card.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BEFORE/AFTER SLIDER
// ═══════════════════════════════════════════════════════════════

function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  beforeAlt,
  afterAlt,
}: {
  beforeUrl: string;
  afterUrl: string;
  beforeAlt: string;
  afterAlt: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [containerWidth, setContainerWidth] = useState(0);
  const dragging = useRef(false);

  // Measure container width for image alignment
  const measure = useCallback(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const updatePosition = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(2, Math.min(98, (x / rect.width) * 100));
    setPosition(pct);
  }, []);

  const startDrag = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    dragging.current = true;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    updatePosition(clientX);

    const onMove = (ev: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      const cx = "touches" in ev ? ev.touches[0].clientX : (ev as MouseEvent).clientX;
      updatePosition(cx);
    };

    const onUp = () => {
      dragging.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onUp);
  }, [updatePosition]);

  return (
    <div
      ref={containerRef}
      className="relative aspect-[3/2] sm:aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden select-none cursor-col-resize bg-[var(--elevated)] border border-[var(--border)] shadow-sm"
      onMouseDown={startDrag}
      onTouchStart={startDrag}
    >
      {/* Before image (full width, underneath) */}
      <img
        src={beforeUrl}
        alt={beforeAlt}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
        fetchPriority="high"
        width={800}
        height={600}
      />

      {/* After image (clipped from left — fixed width = container width) */}
      <div
        className="absolute top-0 left-0 h-full overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <img
          src={afterUrl}
          alt={afterAlt}
          className="absolute top-0 left-0 h-full object-cover"
          style={{ width: containerWidth || "100%", maxWidth: "none" }}
          draggable={false}
          fetchPriority="high"
          width={800}
          height={600}
        />
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-[3px] bg-white shadow-md pointer-events-none"
        style={{ left: `${position}%`, transform: "translateX(-50%)" }}
      >
        {/* Drag handle knob */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border-2 border-[var(--border)] shadow-lg flex items-center justify-center pointer-events-none">
          <GripHorizontal size={14} className="text-[var(--txt3)]" />
        </div>
      </div>

      {/* Labels */}
      <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-sm z-10 pointer-events-none">
        Before
      </span>
      <span className="absolute top-3 left-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#16A34A] text-white z-10 pointer-events-none">
        After
      </span>

      {/* Bottom hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm border border-[var(--border)] rounded-full px-4 py-1.5 text-xs font-semibold text-[var(--txt)] shadow-sm z-10 pointer-events-none whitespace-nowrap">
        ← Drag to compare →
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION: HERO
// ═══════════════════════════════════════════════════════════════

function HeroSection() {
  return (
    <section className="relative pt-4 sm:pt-6 pb-12 sm:pb-16 md:pb-20 overflow-hidden" aria-labelledby="hero-heading">
      {/* Service cards slider — below nav */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 mb-6 sm:mb-8">
        <ServiceCardsSlider />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Left: Copy + CTAs */}
          <div className="text-center lg:text-left">
            {/* Trust bar */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 mb-6 text-xs sm:text-sm font-medium text-[var(--txt2)] bg-[var(--surface)] px-3 sm:px-4 py-2 rounded-full border border-[var(--border)]">
              <span className="flex items-center gap-0.5 text-[#F59E0B]" aria-label={`${SITE_STATS.avgRating} out of 5 stars`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={12} fill="#F59E0B" stroke="none" />
                ))}
              </span>
              <span className="text-[var(--txt3)]">·</span>
              <span className="font-semibold text-[var(--txt)]">{fmtPlus(SITE_STATS.ordersCompleted)} Orders</span>
              <span className="text-[var(--txt3)]">·</span>
              <span>{fmtPlus(SITE_STATS.countriesServed)} Countries</span>
              <span className="text-[var(--txt3)]">·</span>
              <span className="text-[#16A34A] font-medium">Free Revisions</span>
            </div>

            {/* Headline */}
            <h1 id="hero-heading" className="font-syne font-bold text-[clamp(32px,7vw,64px)] leading-[1.08] mb-4 sm:mb-5 text-[var(--txt)] tracking-[-0.02em]">
              Your Logo,<br />
              <span className="bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">
                Machine-Ready in 12 Hours
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-sm sm:text-base text-[var(--txt2)] leading-relaxed mb-6 sm:mb-8 max-w-[480px] mx-auto lg:mx-0">
              We hand-digitize every design for cleaner sew-outs, fewer thread breaks, and perfect machine compatibility.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8">
              <Link href="/contact">
                <Button variant="grad" size="lg" className="w-full sm:w-auto" rightIcon={<Upload size={16} />}>
                  Upload Your Design — Free Quote
                </Button>
              </Link>
              <Link href="/portfolio">
                <Button variant="outline" size="lg" className="w-full sm:w-auto" rightIcon={<ArrowRight size={16} />}>
                  View Portfolio
                </Button>
              </Link>
            </div>

            {/* Trust checks */}
            <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 justify-center lg:justify-start text-xs sm:text-sm text-[var(--txt2)] mb-6">
              <span className="inline-flex items-center gap-1.5">
                <Check size={14} className="text-[#16A34A]" /> Free revisions
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check size={14} className="text-[#16A34A]" /> All file formats
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check size={14} className="text-[#16A34A]" /> Pay when satisfied
              </span>
            </div>

          </div>

          {/* Right: Before/After Slider */}
          <div className="relative">
            <BeforeAfterSlider
              beforeUrl="https://res.cloudinary.com/djoixgojj/image/upload/v1779288234/Before-5_upqe91.webp"
              afterUrl="https://res.cloudinary.com/djoixgojj/image/upload/v1779288234/After-5_hod7v0.webp"
              beforeAlt="Original logo artwork before digitizing"
              afterAlt="Production-ready digitized embroidery file with stitch paths"
            />
            <p className="text-center text-[10px] sm:text-xs text-[var(--txt3)] mt-3">
              Real sew-out comparison — drag the handle to compare
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION: WHY MANUAL VS AUTO
// ═══════════════════════════════════════════════════════════════

const COMPARISON_ROWS = [
  { feature: "Quality", manual: "Clean, production-grade stitch paths", auto: "Jagged paths, uneven edges", manualWin: true },
  { feature: "Stitch Pathing", manual: "Optimized for fabric type and curve", auto: "Generic algorithm, ignores fabric", manualWin: true },
  { feature: "Density Control", manual: "Adjusted per material and design", auto: "One-size-fits-all density", manualWin: true },
  { feature: "Small Text", manual: "Sharp, readable at 5mm+", auto: "Blurry, often illegible", manualWin: true },
  { feature: "Production Reliability", manual: "Runs clean, minimal thread breaks", auto: "Frequent breaks, registration errors", manualWin: true },
  { feature: "Trims & Jumps", manual: "Minimal, efficient path planning", auto: "Excessive, wastes thread and time", manualWin: true },
];

function ManualVsAutoSection() {
  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-[#FAFAF9]" aria-labelledby="comparison-heading">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-12">
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-block mb-4">
            <SectionBadge>Quality Matters</SectionBadge>
          </div>
          <h2 id="comparison-heading" className="font-syne font-bold text-3xl md:text-5xl mb-4 leading-[1.15] text-[var(--txt)]">
            <span className="bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">Manual</span>{" "}
            Digitizing{" "}
            vs{" "}
            <span className="bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">Auto-Tracing</span>{" "}
            Software
          </h2>
          <p className="text-sm sm:text-base text-[var(--txt2)] max-w-xl mx-auto">
            Cheap services use one-click auto-trace. We hand-place every stitch. Here&apos;s why it matters for your machine.
          </p>
        </div>

        {/* Mobile: stacked cards */}
        <div className="lg:hidden space-y-3">
          {COMPARISON_ROWS.map((row) => (
            <div key={row.feature} className="bg-white rounded-xl p-4 border border-[var(--border)]">
              <p className="font-syne font-bold text-sm text-[var(--txt)] mb-3">{row.feature}</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs">
                  <Check size={14} className="text-[#16A34A] mt-0.5 flex-shrink-0" />
                  <span className="text-[var(--txt2)]">{row.manual}</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-red-400 mt-0.5 flex-shrink-0 font-bold">✕</span>
                  <span className="text-[var(--txt3)]">{row.auto}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: comparison table */}
        <div className="hidden lg:block overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
          <div className="grid grid-cols-[1.5fr_1fr_1fr] bg-[var(--elevated)] border-b border-[var(--border)]">
            <div className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--txt2)]">Feature</div>
            <div className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#16A34A] flex items-center gap-1.5">
              <Check size={14} /> Manual (GenX)
            </div>
            <div className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--txt3)]">Auto-Trace Software</div>
          </div>
          {COMPARISON_ROWS.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-[1.5fr_1fr_1fr] ${i % 2 === 0 ? "bg-white" : "bg-[var(--surface)]"}`}
            >
              <div className="px-6 py-4 text-sm font-semibold text-[var(--txt)]">{row.feature}</div>
              <div className="px-6 py-4 text-sm text-[var(--txt2)] flex items-center gap-2">
                <Check size={14} className="text-[#16A34A] flex-shrink-0" />
                <span>{row.manual}</span>
              </div>
              <div className="px-6 py-4 text-sm text-[var(--txt3)] flex items-center gap-2">
                <span className="text-red-400 font-bold flex-shrink-0">✕</span>
                <span>{row.auto}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION: SERVICES GRID
// ═══════════════════════════════════════════════════════════════

function ServicesGridSection() {
  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24" aria-labelledby="services-grid-heading">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-block mb-4">
            <SectionBadge>What We Digitize</SectionBadge>
          </div>
          <h2 id="services-grid-heading" className="font-syne font-bold text-3xl md:text-5xl mb-4 leading-[1.15] text-[var(--txt)]">
            Every Garment.{" "}
            <span className="bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">Every Format.</span>
          </h2>
          <p className="text-sm sm:text-base text-[var(--txt2)] max-w-xl mx-auto">
            From standard left chest logos to complex 3D puff caps — we digitize for every application and every machine.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
          {SERVICES_GRID.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="group flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-5 rounded-2xl
                bg-[var(--surface)] border border-[var(--border)]
                hover:border-[#2563EB]/30 hover:shadow-sm hover:bg-white
                transition-all duration-200 no-underline text-center"
            >
              <span className="text-2xl sm:text-3xl">{s.emoji}</span>
              <span className="text-xs sm:text-sm font-semibold text-[var(--txt)] group-hover:text-[#2563EB] transition-colors leading-tight">
                {s.label}
              </span>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href="/services">
            <Button variant="outline" size="sm" className="rounded-full" rightIcon={<ArrowRight size={14} />}>
              View all services
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION: CASE STUDY
// ═══════════════════════════════════════════════════════════════

function CaseStudySection() {
  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24" aria-labelledby="case-study-heading">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-12">
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-block mb-4">
            <SectionBadge>Case Study</SectionBadge>
          </div>
          <h2 id="case-study-heading" className="font-syne font-bold text-3xl md:text-5xl mb-4 leading-[1.15] text-[var(--txt)]">
            How{" "}
            <span className="bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">{CASE_STUDY.client}</span>{" "}
            Reduced Thread Breaks by 40%
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {/* Problem */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-red-200 shadow-sm relative">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-5">
              <span className="text-xl">⚠️</span>
            </div>
            <span className="absolute top-6 right-6 text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Phase 1</span>
            <h3 className="font-syne font-bold text-xl text-[var(--txt)] mb-3">The Problem</h3>
            <p className="text-sm text-[var(--txt2)] leading-relaxed">{CASE_STUDY.problem}</p>
          </div>

          {/* Solution */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-blue-200 shadow-sm relative">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-5">
              <span className="text-xl">🔧</span>
            </div>
            <span className="absolute top-6 right-6 text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">Phase 2</span>
            <h3 className="font-syne font-bold text-xl text-[var(--txt)] mb-3">The Solution</h3>
            <p className="text-sm text-[var(--txt2)] leading-relaxed">{CASE_STUDY.solution}</p>
          </div>

          {/* Results */}
          <div className="bg-gradient-to-br from-[#0F3460] via-[#1D4ED8] to-[#2563EB] rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-5">
              <Zap size={22} className="text-white" />
            </div>
            <span className="absolute top-6 right-6 text-[10px] font-bold uppercase tracking-wider text-white/70 bg-white/10 px-2 py-0.5 rounded-full">Phase 3</span>
            <h3 className="font-syne font-bold text-xl mb-6">The Results</h3>
            <div className="space-y-5">
              {CASE_STUDY.results.map((r) => (
                <div key={r.label} className="flex items-baseline gap-2">
                  <div className="font-syne font-bold text-3xl sm:text-4xl leading-none">{r.metric}</div>
                  <div className="text-xs text-white/60">{r.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION: PRICING
// ═══════════════════════════════════════════════════════════════

function PricingSection({ tiers }: { tiers: Record<string, { size: string; price: string }[]> }) {
  const plans = [
    {
      name: "Embroidery Digitizing",
      emoji: "🧵",
      desc: "Clean, production-ready stitch files",
      price: "From $7",
      tiers: tiers.digitizing || [],
      gradient: "from-[#2563EB] to-[#1D4ED8]",
    },
    {
      name: "Vector Art Conversion",
      emoji: "✏️",
      desc: "Scalable vectors for print and web",
      price: "From $8",
      tiers: tiers.vector || [],
      gradient: "from-[#F97316] to-[#EA580C]",
    },
    {
      name: "Custom Patches",
      emoji: "🏷️",
      desc: "Embroidered, PVC, woven, leather",
      price: "From $5",
      tiers: tiers.sewout || [],
      gradient: "from-[#16A34A] to-[#15803D]",
    },
  ];

  return (
    <section className="py-16 md:py-20 lg:py-24 bg-[#FAFAF9]" aria-labelledby="pricing-heading">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-block mb-4">
            <SectionBadge>Pricing</SectionBadge>
          </div>
          <h2 id="pricing-heading" className="font-syne font-bold text-3xl md:text-5xl mb-4 leading-[1.15] text-[var(--txt)]">
            <span className="bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">Transparent Pricing.</span>{" "}
            No Surprises.
          </h2>
          <p className="text-sm sm:text-base text-[var(--txt2)] max-w-xl mx-auto">
            All plans include free revisions, free format conversion, and free rush delivery. Pay only when satisfied.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="relative flex flex-col rounded-2xl bg-white p-6 sm:p-7 border border-[var(--border)] shadow-sm"
            >
              <div className="text-center">
                <span className="text-3xl mb-3 block">{plan.emoji}</span>
                <h3 className="font-syne font-bold text-lg mb-1 text-[var(--txt)]">{plan.name}</h3>
                <p className="text-xs text-[var(--txt3)] mb-3">{plan.desc}</p>
                <div className={`font-syne font-bold text-3xl mb-1 bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>
                  {plan.price}
                </div>
                <p className="text-[10px] text-[var(--txt3)] mb-5">per design</p>
              </div>

              {/* Tier list */}
              <div className="space-y-2 mb-6 flex-1">
                {plan.tiers.length > 0 ? (
                  plan.tiers.slice(0, 5).map((t: { size: string; price: string }) => (
                    <div key={t.size} className="flex items-center justify-between text-xs py-1.5 border-b border-[var(--border)] last:border-b-0">
                      <span className="text-[var(--txt2)]">{t.size}</span>
                      <span className="font-semibold text-[var(--txt)]">{t.price}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[var(--txt3)] text-center py-4">Starting at {plan.price.toLowerCase()}</p>
                )}
              </div>

              <Link href="/client/new-order" className="mt-auto">
                <Button variant="grad" size="sm" className="w-full">
                  Order Now
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Always Included */}
        <div className="max-w-3xl mx-auto mt-10 sm:mt-12 text-center">
          <p className="text-xs font-semibold text-[var(--txt3)] uppercase tracking-wider mb-4">Always Included — Free With Every Order</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[var(--txt2)]">
            <span className="inline-flex items-center gap-1"><Check size={12} className="text-[#16A34A]" /> Unlimited revisions</span>
            <span className="inline-flex items-center gap-1"><Check size={12} className="text-[#16A34A]" /> Format conversion</span>
            <span className="inline-flex items-center gap-1"><Check size={12} className="text-[#16A34A]" /> Rush delivery</span>
            <span className="inline-flex items-center gap-1"><Check size={12} className="text-[#16A34A]" /> Machine-tested</span>
            <span className="inline-flex items-center gap-1"><Check size={12} className="text-[#16A34A]" /> Pay when satisfied</span>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-[var(--txt2)]">
            Bulk orders?{" "}
            <Link href="/pricing" className="text-[#2563EB] hover:underline font-semibold">See volume discounts</Link>
            {" "}·{" "}
            Enterprise?{" "}
            <Link href="/contact" className="text-[#2563EB] hover:underline font-semibold">Contact sales</Link>
          </p>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION: TESTIMONIALS
// ═══════════════════════════════════════════════════════════════

function TestimonialsSection({ testimonials }: { testimonials: { name: string; company: string; text: string; stars: number; country: string }[] }) {
  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24" aria-labelledby="testimonials-heading">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-block mb-4">
            <SectionBadge>Testimonials</SectionBadge>
          </div>
          <h2 id="testimonials-heading" className="font-syne font-bold text-3xl md:text-5xl mb-4 leading-[1.15] bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">
            Trusted by {fmtPlus(SITE_STATS.clientsServed)} Clients Worldwide
          </h2>
          <p className="text-sm sm:text-base text-[var(--txt2)] max-w-xl mx-auto">
            Real feedback from embroidery professionals who use our files on production machines every day.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-6xl mx-auto">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-[var(--surface)] rounded-2xl p-5 sm:p-6 border border-[var(--border)]">
              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-3" aria-label={`${t.stars} out of 5 stars`}>
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} size={14} fill="#F59E0B" stroke="none" />
                ))}
              </div>
              <blockquote className="text-sm text-[var(--txt2)] leading-relaxed mb-4">
                &ldquo;{t.text}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white text-xs font-bold">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--txt)]">{t.name}</div>
                  <div className="flex items-center gap-1.5 text-[10px] text-[var(--txt3)]">
                    <span>{t.company}</span>
                    <span>·</span>
                    <span>{t.country}</span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] text-[9px] font-medium">
                      <Shield size={9} /> Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION: FAQ
// ═══════════════════════════════════════════════════════════════

function FAQSection({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered = search.trim()
    ? faqs.filter((f) =>
        f.q.toLowerCase().includes(search.toLowerCase()) ||
        f.a.toLowerCase().includes(search.toLowerCase())
      )
    : faqs;

  return (
    <section className="py-16 md:py-20 lg:py-24 bg-[var(--surface)] border-y border-[var(--border)]" aria-labelledby="faq-heading">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 md:px-12">
        <div className="text-center mb-10">
          <div className="inline-block mb-4">
            <SectionBadge>FAQ</SectionBadge>
          </div>
          <h2 id="faq-heading" className="font-syne font-bold text-3xl md:text-5xl mb-4 leading-[1.15] bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">
            Got Questions? We&apos;ve Got Answers.
          </h2>
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto mb-8">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--txt3)]" />
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOpenIndex(null); }}
            placeholder="Search questions..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] bg-white text-sm text-[var(--txt)]
              placeholder:text-[var(--txt3)] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]/40 transition-all"
            aria-label="Search frequently asked questions"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-sm text-[var(--txt3)] py-8">
            No matches found. Try a different search or <Link href="/contact" className="text-[#2563EB] hover:underline">contact us</Link>.
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((f, i) => (
              <div key={i} className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-[var(--txt)] hover:bg-[var(--elevated)]/50 transition-colors"
                  aria-expanded={openIndex === i}
                >
                  <span>{f.q}</span>
                  {openIndex === i ? <ChevronUp size={16} className="text-[var(--txt3)] flex-shrink-0" /> : <ChevronDown size={16} className="text-[var(--txt3)] flex-shrink-0" />}
                </button>
                {openIndex === i && (
                  <div className="px-5 pb-4 text-sm text-[var(--txt2)] leading-relaxed">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION: FINAL CTA
// ═══════════════════════════════════════════════════════════════

function FinalCTASection() {
  return (
    <section className="py-12 sm:py-16 md:py-24">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 md:px-12 text-center">
        <div className="relative rounded-3xl bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#0F3460] p-8 sm:p-12 md:p-16 overflow-hidden shadow-xl">
          {/* Glow orbs */}
          <div className="absolute -top-[30%] -right-[10%] w-[350px] h-[350px] rounded-full bg-[#60A5FA] opacity-[0.1] blur-3xl pointer-events-none" />
          <div className="absolute -bottom-[20%] -left-[10%] w-[300px] h-[300px] rounded-full bg-[#F97316] opacity-[0.06] blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Badge */}
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-white/15 text-white border border-white/20 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
              Start in Under 2 Minutes
            </span>

            {/* Heading */}
            <h2 className="font-syne font-bold text-3xl sm:text-4xl md:text-5xl text-white mb-4 leading-[1.1] max-w-2xl mx-auto">
              Ready to Get Production-Ready Files?
            </h2>

            {/* Subtext */}
            <p className="text-white/70 text-sm sm:text-base max-w-lg mx-auto mb-8 leading-relaxed">
              Upload your design. Get a free quote in under 1 hour. Pay only when you&apos;re satisfied with the proof.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Link href="/contact">
                <Button variant="grad" size="lg" className="w-full sm:w-auto rounded-full" rightIcon={<Upload size={16} />}>
                  Upload Your Design — Free Quote
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="ghost" size="lg" className="w-full sm:w-auto rounded-full">
                  Register Now
                </Button>
              </Link>
            </div>

            {/* Trust checks */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/60">
              <span className="inline-flex items-center gap-1.5"><Check size={12} className="text-[#4ADE80]" /> Free revisions forever</span>
              <span className="inline-flex items-center gap-1.5"><Check size={12} className="text-[#4ADE80]" /> All machine formats</span>
              <span className="inline-flex items-center gap-1.5"><Check size={12} className="text-[#4ADE80]" /> Pay when satisfied</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// HOW IT WORKS (kept from old — toned down)
// ═══════════════════════════════════════════════════════════════

function HowItWorksSection({ process }: { process: { title: string; desc: string; icon: string }[] }) {
  return (
    <section className="py-12 sm:py-16 md:py-20" aria-labelledby="process-heading">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-block mb-4">
            <SectionBadge>How It Works</SectionBadge>
          </div>
          <h2 id="process-heading" className="font-syne font-bold text-3xl md:text-5xl mb-4 leading-[1.15] text-[var(--txt)]">
            Order in Minutes,{" "}
            <span className="bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">Delivered Fast</span>
          </h2>
        </div>

        {/* Mobile: compact list */}
        <div className="lg:hidden space-y-2 max-w-lg mx-auto">
          {process.map((step: any, i: number) => (
            <div
              key={step.n}
              className="flex items-center gap-3 bg-white rounded-xl p-3 border border-[var(--border)]"
            >
              <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-lg flex-shrink-0">
                {step.icon}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[var(--txt)]">{step.title}</div>
                <div className="text-[11px] text-[var(--txt3)] truncate">{step.desc}</div>
              </div>
              {i < process.length - 1 && (
                <span className="text-[var(--border3)] flex-shrink-0 ml-auto">↓</span>
              )}
            </div>
          ))}
        </div>

        {/* Desktop: 4-column grid */}
        <div className="hidden lg:grid grid-cols-4 gap-6 max-w-5xl mx-auto">
          {process.map((step: any, i: number) => {
            const phases = ["Phase 1", "Phase 2", "Phase 3", "Phase 4"];
            return (
              <div
                key={step.n}
                className="relative text-center bg-white rounded-2xl p-6 border border-[var(--border)] hover:border-[#2563EB]/20 hover:shadow-sm transition-all duration-200"
              >
                {i < process.length - 1 && (
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs font-bold shadow-md">
                    →
                  </div>
                )}
                <div className="font-syne font-bold text-xs tracking-[0.2em] uppercase mb-3 text-[#2563EB]">
                  {phases[i]}
                </div>
                <div className="w-[52px] h-[52px] rounded-full mx-auto mb-3 bg-[#EFF6FF] border-2 border-[#2563EB]/20 flex items-center justify-center text-[22px]">
                  {step.icon}
                </div>
                <h3 className="font-syne font-bold text-base mb-1.5 text-[var(--txt)]">{step.title}</h3>
                <p className="text-sm text-[var(--txt2)] leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

interface Props {
  services: any[];
  process: any[];
  testimonials: any[];
  faqs: { q: string; a: string }[];
}

export function LandingClient({ services, process, testimonials, faqs }: Props) {
  // Build tiers map from services
  const tiers: Record<string, { size: string; price: string }[]> = {};
  for (const svc of services) {
    const cat = svc.title.toLowerCase().includes("vector") ? "vector"
      : svc.title.toLowerCase().includes("patch") ? "sewout"
      : "digitizing";
    tiers[cat] = svc.tiers || [];
  }

  return (
    <div className="bg-[var(--bg)] text-[var(--txt)] overflow-x-hidden">
      {/* ── HERO ─────────────────────────────────── */}
      <HeroSection />

      {/* ── TRUST & STATS ──────────────────────────── */}
      <TrustStatsSection />

      {/* ── MANUAL VS AUTO ─────────────────────────── */}
      <ManualVsAutoSection />

      {/* ── SERVICES GRID ─────────────────────────── */}
      <ServicesGridSection />


      {/* ── HOW IT WORKS ──────────────────────────── */}
      <HowItWorksSection process={process} />

      {/* ── PORTFOLIO ─────────────────────────────── */}
      <PortfolioPreview />

      {/* ── PRICING ───────────────────────────────── */}
      <PricingSection tiers={tiers} />

      {/* ── CASE STUDY ────────────────────────────── */}
      <CaseStudySection />

      {/* ── TESTIMONIALS ──────────────────────────── */}
      <TestimonialsSection testimonials={testimonials} />

      {/* ── FREE DESIGNS ──────────────────────────── */}
      <FreeDesignsPreview />

      {/* ── FAQ ───────────────────────────────────── */}
      <FAQSection faqs={faqs} />

      {/* ── FINAL CTA ─────────────────────────────── */}
      <FinalCTASection />
    </div>
  );
}
