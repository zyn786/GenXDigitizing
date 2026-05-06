"use client";

import { motion } from "framer-motion";
import { Images, Layers, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const stats = [
  { value: "1,200+", label: "Completed jobs" },
  { value: "3",      label: "Service types" },
  { value: "24hr",   label: "Turnaround" },
  { value: "∞",      label: "Revisions" },
];

const serviceChips = [
  { icon: Layers, label: "Embroidery Digitizing" },
  { icon: Images, label: "Vector Art" },
  { icon: Sparkles, label: "Custom Patches" },
];

export function PortfolioHeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-10 pt-16 md:px-8 md:pt-20">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-5rem] top-0 h-72 w-72 rounded-full bg-indigo-500/[0.08] blur-3xl" />
        <div className="absolute right-[-3rem] top-[20%] h-56 w-56 rounded-full bg-violet-500/[0.07] blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-primary/[0.05] blur-3xl" />
      </div>

      <div className="page-shell relative z-10">
        <div className="glass-panel premium-shadow rounded-[2rem] border-border/80 p-5 md:p-10">
          {/* Top bar */}
          <div className="mb-4 flex flex-wrap items-center gap-3 md:mb-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-primary"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.8)]" />
              Production Portfolio
            </motion.div>
          </div>

          {/* Main content grid */}
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            {/* Left: text */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.05, ease }}
              >
                <div className="section-eyebrow">Portfolio</div>
                <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
                  Production-quality work across{" "}
                  <span className="gradient-text">every service</span> we offer.
                </h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                  Real examples of embroidery digitizing, vector art conversion, and custom patch
                  work — from concept to production-ready output. Every file ships with a
                  proof-first workflow and revision path included.
                </p>
              </motion.div>

              {/* Service chips */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15, ease }}
                className="mt-6 flex flex-wrap gap-2"
              >
                {serviceChips.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-3 py-1.5 text-xs font-medium text-muted-foreground"
                  >
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    {label}
                  </div>
                ))}
              </motion.div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25, ease }}
                className="mt-6"
              >
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_30px_rgba(99,102,241,0.35)] transition hover:opacity-90 hover:shadow-[0_12px_40px_rgba(99,102,241,0.45)]"
                >
                  Get your first order free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </div>

            {/* Right: stats strip */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease }}
              className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3 lg:flex-col"
            >
              {stats.map(({ value, label }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 + i * 0.08, ease }}
                  className="rounded-[1.5rem] border border-border/60 bg-card/60 px-4 py-3 backdrop-blur-sm sm:flex-1 sm:min-w-[120px] lg:min-w-0"
                >
                  <div className="text-xl font-bold tracking-tight gradient-text md:text-2xl">{value}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
