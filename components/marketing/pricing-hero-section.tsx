"use client";

import { motion } from "framer-motion";
import { ArrowRight, BadgeDollarSign, CheckCircle2, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const highlights = [
  "First design free — no card required",
  "Revisions included in every order",
  "Rush and same-day options available",
  "All major machine formats",
];

export function PricingHeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-10 pt-16 md:px-8 md:pt-20">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-4rem] top-[-2rem] h-64 w-64 rounded-full bg-amber-500/[0.07] blur-3xl" />
        <div className="absolute left-[-3rem] top-[30%] h-56 w-56 rounded-full bg-primary/[0.08] blur-3xl" />
        <div className="absolute bottom-0 right-1/3 h-40 w-80 rounded-full bg-violet-500/[0.06] blur-3xl" />
      </div>

      <div className="page-shell relative z-10 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease }}
          className="glass-panel premium-shadow rounded-[2rem] border-border/80 p-5 md:p-10"
        >
          {/* Eyebrow */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400">
            <BadgeDollarSign className="h-3 w-3" />
            Transparent Pricing
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            {/* Left content */}
            <div>
              <div className="section-eyebrow">Pricing</div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
                Transparent pricing for{" "}
                <span className="gradient-text-gold">every production job.</span>
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                Starter jobs from $15. Production-ready digitizing from $35. Rush and specialty
                work quoted individually. All orders include a proof and revision path.
              </p>

              {/* Highlights */}
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {highlights.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: CTA panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.15, ease }}
              className="rounded-[1.5rem] border border-primary/20 bg-primary/5 p-6"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">First Order Free</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                New clients get their first digitizing job at no cost. No credit card required.
              </p>
              <div className="mt-4 flex flex-col gap-2.5">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_rgba(99,102,241,0.35)] transition hover:opacity-90"
                >
                  Get a free quote
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/orders"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-card/60 px-5 py-2.5 text-sm font-medium transition hover:bg-card hover:shadow-md"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Place direct order
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
