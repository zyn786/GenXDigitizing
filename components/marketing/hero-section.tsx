"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { usePreloader } from "@/components/layout/site-preloader";
import { DirectOrderModal } from "@/components/marketing/direct-order-modal";
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
  const { isRevealing } = usePreloader();

  return (
    <section className="relative min-h-screen overflow-hidden -mt-20">
      {/* Desktop YouTube embed (hidden on mobile) */}
      <div className="absolute inset-0 hidden md:block">
        <iframe
          src="https://www.youtube.com/embed/dYQ7iQJEJXw?autoplay=1&mute=1&loop=1&controls=0&playlist=dYQ7iQJEJXw&playsinline=1&rel=0&showinfo=0&modestbranding=1"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ width: "100vw", height: "56.25vw", minHeight: "100vh", minWidth: "177.77vh", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
          allow="autoplay; encrypted-media"
          allowFullScreen={false}
          title="GenX hero background"
        />
      </div>
      {/* Mobile YouTube Short embed (hidden on desktop) */}
      <div className="absolute inset-0 md:hidden">
        <iframe
          src="https://www.youtube.com/embed/Y-zhysHWyZI?autoplay=1&mute=1&loop=1&controls=0&playlist=Y-zhysHWyZI&playsinline=1&rel=0&showinfo=0&modestbranding=1"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ width: "100vw", height: "177.78vw", minHeight: "100vh", minWidth: "56.25vh", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
          allow="autoplay; encrypted-media"
          allowFullScreen={false}
          title="GenX hero background"
        />
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[#07111f]/78" />
      {/* Radial color glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(99,102,241,0.24),transparent_42%),radial-gradient(circle_at_78%_18%,rgba(139,92,246,0.20),transparent_38%),radial-gradient(circle_at_50%_88%,rgba(59,130,246,0.13),transparent_40%)]" />
      {/* Soft vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(7,17,31,0.55)_100%)]" />

      {/* ── Centered content ─────────────────────────────────── */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pb-28 pt-40 text-center md:px-8">

        {/* Eyebrow pill */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isRevealing ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.55, ease }}
          className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-300 backdrop-blur-xl"
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.9)]" />
          <Sparkles className="h-3 w-3 opacity-70" />
          Premium Embroidery Digitizing
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={isRevealing ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.65, delay: 0.1, ease }}
          className="max-w-4xl text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-[3.75rem] lg:leading-[1.08]"
        >
          Embroidery Digitizing, Vector Art &amp; Custom Patches —{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-300 bg-clip-text text-transparent">
            Delivered Production-Ready.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isRevealing ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.55, delay: 0.2, ease }}
          className="mt-6 max-w-[38rem] text-base leading-7 text-white/55"
        >
          Machine-ready files your decorators can run without callbacks — crisp stitch
          quality, fast delivery, full revision path.
        </motion.p>

        {/* CTA buttons + trust line */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isRevealing ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.55, delay: 0.3, ease }}
          className="mt-8 flex flex-col items-center gap-3"
        >
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild variant="premium" shape="pill" size="lg">
              <Link href="/contact">
                Get a free quote
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <DirectOrderModal mode="order" />
            <Button
              asChild
              variant="ghost"
              shape="pill"
              size="lg"
              className="border border-white/20 text-white hover:border-white/30 hover:bg-white/10"
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
          animate={isRevealing ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.55, delay: 0.42, ease }}
          className="mt-10 flex overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.05] backdrop-blur-sm divide-x divide-white/[0.08]"
        >
          {stats.map(({ value, label }) => (
            <div key={label} className="px-5 py-3 text-center sm:px-7 sm:py-4">
              <div className="text-lg font-bold tracking-tight sm:text-xl bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                {value}
              </div>
              <div className="mt-0.5 text-[10px] sm:text-[11px] text-white/45">{label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Infinite ticker strip ─────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 overflow-hidden border-t border-white/[0.07] bg-[#07111f]/55 py-4 backdrop-blur-md whitespace-nowrap">
        <div className="marquee-track">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span
              key={i}
              className="inline-flex shrink-0 items-center whitespace-nowrap px-10 text-lg font-black italic uppercase tracking-wide text-indigo-300"
            >
              <span className="mr-10 text-violet-400/50">◆</span>
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
