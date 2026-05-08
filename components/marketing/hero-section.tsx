"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const stats = [
  { value: "1,200+", label: "Files delivered" }, // TODO: verify count before launch
  { value: "24 hr",  label: "Turnaround" },
  { value: "∞",      label: "Revision-inclusive" },
];

const tickerItems = [
  "Try Before You Buy, First Design On Us",
  "Risk-Free Start, Your First Design is Free",
  "Bulk Orders, Bigger Savings",
  "Scale Up, Spend Less",
  "Free to Start, Cheaper to Scale",
];

export function HeroSection() {
  const prefersReduced = useReducedMotion();

  return (
    <section className="relative min-h-screen overflow-hidden -mt-20">
      <video
        autoPlay muted loop playsInline preload="metadata"
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source media="(min-width: 768px)" src="/video/hero-bg-desktop.mp4" type="video/mp4" />
        <source src="/video/hero-bg-mobile.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[#07111f]/78" />
      {/* Subtle top glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.10),transparent_50%)]" />
      {/* Soft vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(7,17,31,0.55)_100%)]" />

      {/* ── Centered content ─────────────────────────────────── */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pb-20 pt-24 text-center md:px-8 md:pb-28 md:pt-40">

        {/* Eyebrow pill */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease }}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-indigo-300 md:mb-7 md:px-4 md:py-2 md:text-[10px]"
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.9)]" />
          <Sparkles className="h-3 w-3 opacity-70" />
          Premium Embroidery Digitizing
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1, ease }}
          className="max-w-sm sm:max-w-2xl md:max-w-4xl text-2xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[3.75rem] lg:leading-[1.08]"
        >
          Embroidery Digitizing, Vector Art &amp; Custom Patches —{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-300 bg-clip-text text-transparent">
            Delivered Production-Ready.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2, ease }}
          className="mt-4 max-w-[38rem] text-sm leading-7 text-white/55 md:mt-6 md:text-base"
        >
          Machine-ready files your decorators can run without callbacks — crisp stitch
          quality, fast delivery, full revision path.
        </motion.p>

        {/* CTA buttons + trust line */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.3, ease }}
          className="mt-6 flex flex-col items-center gap-3 md:mt-8"
        >
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:flex-wrap sm:justify-center">
            <Button asChild variant="premium" shape="pill" size="lg" className="min-h-[44px] w-full sm:w-auto">
              <Link href="/contact">
                Get a free quote
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" shape="pill" size="lg" className="min-h-[44px] w-full border border-white/20 text-white hover:border-white/30 hover:bg-white/10 sm:w-auto">
              <Link href="/orders">
                Place Direct Order
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              shape="pill"
              size="lg"
              className="min-h-[44px] w-full border border-white/20 text-white hover:border-white/30 hover:bg-white/10 sm:w-auto"
            >
              <Link href="/portfolio">
                View our work
              </Link>
            </Button>
          </div>
          <p className="text-[11px] tracking-wide text-white/30">
            Free first file · No credit card required · 24-hr turnaround
          </p>
        </motion.div>

        {/* Stats — glass card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.42, ease }}
          className="mt-6 flex overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.06] divide-x divide-white/[0.08]"
        >
          {stats.map(({ value, label }) => (
            <div key={label} className="px-3 py-2.5 text-center sm:px-7 sm:py-4">
              <div className="text-base font-bold tracking-tight sm:text-xl bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                {value}
              </div>
              <div className="mt-0.5 text-[9px] sm:text-[11px] text-white/45">{label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Infinite ticker strip ─────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 overflow-hidden border-t border-white/[0.07] bg-[#07111f]/55 py-3 backdrop-blur-md whitespace-nowrap md:py-4">
        <div className="marquee-track">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span
              key={i}
              className="inline-flex shrink-0 items-center whitespace-nowrap px-6 text-sm font-black italic uppercase tracking-wide text-indigo-300 md:px-10 md:text-lg"
            >
              <span className="mr-6 text-violet-400/50 md:mr-10">◆</span>
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
