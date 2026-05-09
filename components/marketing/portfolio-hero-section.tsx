"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Images, Layers, Sparkles } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const stats = [
  { value: "1,200+", label: "Completed jobs" },
  { value: "3", label: "Service types" },
  { value: "24hr", label: "Turnaround" },
  { value: "∞", label: "Revisions" },
];

const serviceChips = [
  { icon: Layers, label: "Embroidery Digitizing" },
  { icon: Images, label: "Vector Art" },
  { icon: Sparkles, label: "Custom Patches" },
];

export function PortfolioHeroSection() {
  const prefersReduced = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden bg-[#f7f7fb] px-4 pb-10 pt-24 text-slate-950 dark:bg-[#050814] dark:text-white sm:pt-28 md:px-8 md:pb-14 md:pt-32 lg:pt-36">
      <PortfolioHeroBackground />

      <div className="page-shell relative z-10">
        <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white/90 p-5 shadow-sm shadow-slate-950/5 backdrop-blur-xl dark:border-slate-800 dark:bg-[#0B1120] dark:shadow-black/30 sm:rounded-[1.75rem] sm:p-6 md:rounded-[2rem] md:p-10">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/8 via-transparent to-cyan-500/8 dark:from-indigo-400/8 dark:to-cyan-400/6" />
          <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-gradient-to-br from-slate-100 to-transparent opacity-80 dark:from-indigo-400/10" />

          <div className="relative z-10">
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: 14 }}
              animate={prefersReduced ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700 shadow-sm backdrop-blur dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300 sm:px-4 sm:tracking-[0.24em]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(99,102,241,0.8)] dark:bg-indigo-300" />
              Production Portfolio
            </motion.div>

            <div className="grid gap-7 lg:grid-cols-[1.12fr_0.88fr] lg:items-start lg:gap-10">
              <motion.div
                initial={prefersReduced ? false : { opacity: 0, y: 14 }}
                animate={prefersReduced ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.04, ease }}
              >
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  Portfolio
                </div>

                <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-[-0.05em] text-slate-950 dark:text-slate-100 sm:text-4xl md:text-5xl lg:text-6xl">
                  Production-quality work across{" "}
                  <span className="bg-gradient-to-r from-indigo-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent dark:from-indigo-300 dark:via-cyan-300 dark:to-blue-300">
                    every service
                  </span>{" "}
                  we offer.
                </h1>

                <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-base sm:leading-7">
                  Real examples of embroidery digitizing, vector art
                  conversion, and custom patch work — from concept to
                  production-ready output. Every file ships with a proof-first
                  workflow and revision path included.
                </p>

                <div className="mt-5 flex flex-wrap gap-1.5 sm:gap-2">
                  {serviceChips.map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1.5 text-[10px] font-bold text-slate-600 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-[#111C31] dark:text-slate-300 sm:px-3 sm:text-xs"
                    >
                      <Icon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-300" />
                      {label}
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <Link
                    href="/contact"
                    className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-indigo-500 dark:shadow-indigo-500/20 dark:hover:bg-indigo-400"
                  >
                    Get your first order free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial={prefersReduced ? false : { opacity: 0, x: 16 }}
                animate={prefersReduced ? undefined : { opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.08, ease }}
                className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-1"
              >
                {stats.map(({ value, label }, index) => (
                  <motion.div
                    key={label}
                    initial={prefersReduced ? false : { opacity: 0, y: 12 }}
                    animate={prefersReduced ? undefined : { opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: prefersReduced ? 0 : 0.12 + index * 0.04,
                      ease,
                    }}
                    className="group relative overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-[#0F172A] dark:hover:border-slate-600 dark:hover:bg-[#111C31] sm:rounded-[1.5rem]"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/8 via-transparent to-cyan-500/8 dark:from-indigo-400/8 dark:to-cyan-400/5" />

                    <div className="relative z-10">
                      <div className="bg-gradient-to-r from-indigo-600 via-cyan-600 to-blue-600 bg-clip-text text-2xl font-black tracking-[-0.04em] text-transparent dark:from-indigo-300 dark:via-cyan-300 dark:to-blue-300 md:text-3xl">
                        {value}
                      </div>

                      <div className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                        {label}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PortfolioHeroBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute left-1/2 top-0 h-72 w-[24rem] -translate-x-1/2 rounded-full bg-indigo-500/[0.08] blur-3xl dark:bg-indigo-400/[0.08] sm:w-[40rem]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.11),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(56,189,248,0.08),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(168,85,247,0.06),transparent_38%)] dark:bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.12),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(56,189,248,0.08),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(168,85,247,0.08),transparent_38%)]" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:radial-gradient(ellipse_75%_70%_at_50%_45%,black,transparent_78%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] md:bg-[size:42px_42px]" />
    </div>
  );
}