"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, ArrowRight, Check, FileImage, ChevronRight, Clock, Sparkles } from "lucide-react";
import { PricingCalculator } from "@/components/marketing/PricingCalculator";
import { SewOutShowcase } from "@/components/marketing/SewOutShowcase";
import { EnterpriseTestimonials } from "@/components/marketing/EnterpriseTestimonials";
import { ProductionGuarantee } from "@/components/marketing/ProductionGuarantee";
import { OrderIntakeForm } from "@/components/marketing/OrderIntakeForm";
import { GlassHeader } from "@/components/marketing/GlassHeader";

/* ═════════════════════════════════════════════════════════════
   HEADER
   ═════════════════════════════════════════════════════════════ */
function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[var(--border)]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 lg:h-[68px]">
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
        <nav className="hidden lg:flex items-center gap-1">
          {["Home", "Services", "Portfolio", "Pricing"].map((item) => (
            <Link
              key={item}
              href={item === "Home" ? "/" : `/${item.toLowerCase()}`}
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-[var(--txt2)]
                hover:text-[var(--txt)] hover:bg-[var(--elevated)] transition-all duration-200 no-underline"
            >
              {item}
            </Link>
          ))}
        </nav>

        {/* Right CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href="/contact"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold
              bg-[#10B981] text-white hover:bg-[#059669]
              shadow-[0_4px_14px_rgba(16,185,129,0.25)]
              active:scale-[0.98] transition-all duration-200 no-underline"
          >
            Get a Free Quote
            <ArrowRight size={15} />
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2.5 rounded-xl hover:bg-[var(--elevated)] transition-colors"
            aria-label="Toggle menu"
          >
            <div className="flex flex-col gap-[5px] w-5">
              <span className={`block h-[2px] w-5 bg-[var(--txt)] transition-all duration-200 ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
              <span className={`block h-[2px] w-5 bg-[var(--txt)] transition-all duration-200 ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block h-[2px] w-5 bg-[var(--txt)] transition-all duration-200 ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-[var(--border)] bg-white overflow-hidden"
          >
            <nav className="px-4 py-3 flex flex-col gap-1">
              {["Home", "Services", "Portfolio", "Pricing", "Contact"].map((item) => (
                <Link
                  key={item}
                  href={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-3 rounded-lg text-sm font-medium text-[var(--txt2)]
                    hover:text-[var(--txt)] hover:bg-[var(--elevated)] transition-all duration-150 no-underline"
                >
                  {item}
                </Link>
              ))}
              <Link
                href="/contact"
                onClick={() => setMenuOpen(false)}
                className="mt-2 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold
                  bg-[#10B981] text-white active:scale-[0.98] transition-transform no-underline"
              >
                Get a Free Quote
                <ArrowRight size={15} />
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ═════════════════════════════════════════════════════════════
   FILE UPLOAD MOCKUP
   ═════════════════════════════════════════════════════════════ */
function UploadMockup() {
  return (
    <div className="relative">
      <div
        className="relative bg-white rounded-2xl border-2 border-dashed border-[#2563EB]/30
          p-8 sm:p-10 text-center shadow-[0_8px_40px_rgba(37,99,235,0.06)]
          hover:border-[#2563EB]/50 transition-colors duration-300"
      >
        <div
          className="absolute inset-0 rounded-2xl opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#2563EB 1px, transparent 1px), linear-gradient(90deg, #2563EB 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
        />
        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-[#2563EB]/10 flex items-center justify-center mx-auto mb-4">
            <Upload size={28} className="text-[#2563EB]" />
          </div>
          <h3 className="font-jakarta font-bold text-lg text-[var(--txt)] mb-2">
            Drag & drop your design file
          </h3>
          <p className="text-sm text-[var(--txt2)] mb-4">
            AI, PNG, PDF, JPG — any format accepted
          </p>
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--elevated)] border border-[var(--border)] text-sm font-medium text-[var(--txt2)]">
            <FileImage size={16} />
            Browse files
          </div>
          <p className="text-[11px] text-[var(--txt3)] mt-3">Max file size: 50MB</p>
        </div>
      </div>

      {/* Floating status badge */}
      <div className="absolute -bottom-3 -right-3 sm:-right-6 bg-white rounded-xl px-4 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-[var(--border)] flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
        <span className="text-xs font-semibold text-[var(--txt)]">Files processed in ~12h</span>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   TRUST INDICATORS
   ═════════════════════════════════════════════════════════════ */
const TRUST_ITEMS = [
  "Zero Thread Breaks Guarantee",
  "24-Hour Turnaround",
  "Trusted by 10,000+ Brands",
];

function TrustIndicators() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {TRUST_ITEMS.map((text) => (
        <div key={text} className="flex items-center gap-1.5 text-xs sm:text-sm text-[var(--txt2)]">
          <Check size={14} className="text-[#10B981] flex-shrink-0" />
          <span className="font-medium">{text}</span>
        </div>
      ))}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   TABBED SERVICES
   ═════════════════════════════════════════════════════════════ */
const TABS = [
  {
    id: "digitizing",
    label: "Embroidery Digitizing",
    emoji: "🧵",
    before: {
      title: "Client Artwork",
      desc: "Low-res JPG, hand sketch, or scanned logo submitted by the client. May have fuzzy edges, incorrect colors, or missing details.",
      tags: ["Unoptimized", "Low-res source", "No stitch data"],
    },
    after: {
      title: "Production-Ready File",
      desc: "Manually digitized with correct underlay, balanced stitch density, clean trims, and optimized routing for commercial machines.",
      tags: ["DST / PES / EMB", "Machine-tested", "12h delivery"],
    },
  },
  {
    id: "vector",
    label: "Vector Artwork Conversion",
    emoji: "✏️",
    before: {
      title: "Raster Source",
      desc: "Pixel-based JPG or PNG artwork. Cannot be scaled without quality loss. Colors may be inconsistent across print runs.",
      tags: ["Pixel-based", "Not scalable", "Color shifts"],
    },
    after: {
      title: "Clean Vector Output",
      desc: "Manual redraw into clean, scalable vector paths. Perfect for screen printing, DTF, heat transfer, and large-format production.",
      tags: ["AI / SVG / EPS", "Infinitely scalable", "Print-ready"],
    },
  },
  {
    id: "patches",
    label: "Custom Patches",
    emoji: "🏷️",
    before: {
      title: "Concept or Sketch",
      desc: "Rough idea, hand-drawn sketch, or reference image. Needs to be translated into a production-ready patch design.",
      tags: ["Concept only", "No thread plan", "Undefined backing"],
    },
    after: {
      title: "Production Patch File",
      desc: "Complete patch digitizing with thread color matching, defined borders, backing specification, and bulk-ready production file.",
      tags: ["Merrow / PVC / Woven", "Thread-matched", "Bulk-ready"],
    },
  },
];

function TabbedServices() {
  const [activeTab, setActiveTab] = useState("digitizing");
  const active = TABS.find((t) => t.id === activeTab)!;

  return (
    <section id="services" className="py-16 sm:py-20 lg:py-24">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#2563EB]/8 text-[#2563EB] border border-[#2563EB]/15 mb-4">
            <Sparkles size={12} />
            Our Precision Services
          </span>
          <h2 className="font-jakarta font-extrabold text-3xl sm:text-4xl lg:text-5xl mb-3 tracking-tight">
            Production-ready output,
            <span className="block bg-gradient-to-r from-[#2563EB] to-[#10B981] bg-clip-text text-transparent">
              every single time
            </span>
          </h2>
          <p className="text-base sm:text-lg text-[var(--txt2)] max-w-[640px] mx-auto">
            Three specialized services built for commercial embroidery shops, apparel brands, and print businesses.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8 sm:mb-10">
          <div className="inline-flex bg-[var(--elevated)] rounded-xl p-1 gap-1 flex-wrap justify-center">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 sm:px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap min-h-[44px] ${
                  activeTab === tab.id
                    ? "bg-white text-[var(--txt)] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                    : "text-[var(--txt2)] hover:text-[var(--txt)]"
                }`}
              >
                <span className="hidden sm:inline mr-1.5">{tab.emoji}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content — Before vs After */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="max-w-[960px] mx-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Before card */}
              <div className="bg-white rounded-2xl border border-[var(--border)] p-6 sm:p-8">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                  <h3 className="font-jakarta font-bold text-sm uppercase tracking-wider text-[#92400E]">
                    Before — {active.before.title}
                  </h3>
                </div>
                <p className="text-sm text-[var(--txt2)] leading-relaxed mb-4">{active.before.desc}</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {active.before.tags.map((tag) => (
                    <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-[#FEF3C7]/40 to-[#FDE68A]/20 border border-dashed border-[#F59E0B]/20 flex items-center justify-center">
                  <span className="text-4xl opacity-20">📷</span>
                </div>
              </div>

              {/* After card */}
              <div className="bg-white rounded-2xl border-2 border-[#10B981]/30 p-6 sm:p-8 shadow-[0_4px_24px_rgba(16,185,129,0.06)]">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="w-3 h-3 rounded-full bg-[#10B981]" />
                  <h3 className="font-jakarta font-bold text-sm uppercase tracking-wider text-[#059669]">
                    After — {active.after.title}
                  </h3>
                </div>
                <p className="text-sm text-[var(--txt2)] leading-relaxed mb-4">{active.after.desc}</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {active.after.tags.map((tag) => (
                    <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-[#ECFDF5]/60 to-[#A7F3D0]/20 border border-dashed border-[#10B981]/30 flex items-center justify-center">
                  <span className="text-4xl opacity-25">🧵</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center mt-8">
              <Link
                href="/client/new-order"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold
                  bg-[#10B981] text-white hover:bg-[#059669]
                  shadow-[0_4px_14px_rgba(16,185,129,0.25)]
                  active:scale-[0.98] transition-all duration-200 no-underline"
              >
                Upload Your {activeTab === "digitizing" ? "Logo" : activeTab === "vector" ? "Artwork" : "Design"} →
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ═════════════════════════════════════════════════════════════
   LANDING CLIENT
   ═════════════════════════════════════════════════════════════ */
export function LandingClient() {
  return (
    <div className="bg-[var(--bg)] text-[var(--txt)] overflow-hidden">
      <GlassHeader />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="pt-28 sm:pt-32 lg:pt-36 pb-12 sm:pb-16 lg:pb-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* LEFT — Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#10B981]/10 text-[#059669] border border-[#10B981]/20 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                #1 B2B Embroidery Production Platform
              </div>

              <h1 className="font-jakarta font-extrabold text-[clamp(32px,6vw,60px)] leading-[1.06] mb-4 tracking-tight">
                Production-Ready
                <span className="block bg-gradient-to-r from-[#2563EB] to-[#10B981] bg-clip-text text-transparent">
                  Accuracy. Guaranteed.
                </span>
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-[var(--txt2)] leading-relaxed mb-6 max-w-[520px] mx-auto lg:mx-0">
                Professional embroidery digitizing, vector conversion, and custom patches — delivered with surgical precision. Machine-tested files. 24-hour turnaround. Zero thread breaks.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center gap-3 mb-6 justify-center lg:justify-start">
                <Link
                  href="/client/new-order"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold
                    bg-[#10B981] text-white hover:bg-[#059669]
                    shadow-[0_4px_20px_rgba(16,185,129,0.3)]
                    active:scale-[0.98] transition-all duration-200 no-underline w-full sm:w-auto justify-center min-h-[52px]"
                >
                  Get a Free Quote
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/portfolio"
                  className="inline-flex items-center gap-1.5 px-5 py-3.5 rounded-xl text-sm font-semibold
                    text-[var(--txt)] bg-white border border-[var(--border)]
                    hover:border-[var(--border3)] active:scale-[0.98] transition-all duration-200 no-underline
                    w-full sm:w-auto justify-center min-h-[52px]"
                >
                  View Our Work
                  <ChevronRight size={16} />
                </Link>
              </div>

              <TrustIndicators />
            </div>

            {/* RIGHT — Upload mockup */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-[440px]">
                <UploadMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TABBED SERVICES ──────────────────────────────────── */}
      <TabbedServices />

      {/* ── REAL-WORLD SEW-OUT SHOWCASE ──────────────────────── */}
      <SewOutShowcase />

      {/* ── ENTERPRISE TESTIMONIALS ──────────────────────────── */}
      <EnterpriseTestimonials />

      {/* ── PRICING CALCULATOR ────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-[var(--elevated)]/50">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#10B981]/10 text-[#059669] border border-[#10B981]/20 mb-4">
              <Sparkles size={12} />
              Get an Instant Quote
            </span>
            <h2 className="font-jakarta font-extrabold text-3xl sm:text-4xl mb-2 tracking-tight">
              Calculate your price
              <span className="block bg-gradient-to-r from-[#2563EB] to-[#10B981] bg-clip-text text-transparent">
                in 30 seconds
              </span>
            </h2>
          </div>
          <PricingCalculator />
        </div>
      </section>

      {/* ── ORDER INTAKE FORM ────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-[#0F1115]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/20 mb-4">
              <Sparkles size={12} />
              Start Your Production Order
            </span>
            <h2 className="font-jakarta font-extrabold text-3xl sm:text-4xl mb-2 tracking-tight text-white">
              Ready to get
              <span className="block bg-gradient-to-r from-[#2563EB] to-[#10B981] bg-clip-text text-transparent">
                production files?
              </span>
            </h2>
          </div>
          <OrderIntakeForm />
        </div>
      </section>

      {/* ── PRODUCTION-READY GUARANTEE ───────────────────────── */}
      <ProductionGuarantee />
    </div>
  );
}
