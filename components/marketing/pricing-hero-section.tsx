"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  Sparkles,
  Zap,
} from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const highlights = [
  "First design free — no card required",
  "Revisions included in every order",
  "Rush and same-day options available",
  "All major machine formats",
];

export function PricingHeroSection() {
  const prefersReduced = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden bg-[#f7f7fb] px-4 pb-10 pt-24 text-slate-950 dark:bg-[#050814] dark:text-white sm:pt-28 md:px-8 md:pb-14 md:pt-32 lg:pt-36">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-72 w-[24rem] -translate-x-1/2 rounded-full bg-amber-500/[0.1] blur-3xl dark:bg-amber-400/[0.08] sm:w-[40rem]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(245,158,11,0.12),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(99,102,241,0.1),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(168,85,247,0.08),transparent_38%)] dark:bg-[radial-gradient(circle_at_18%_20%,rgba(245,158,11,0.12),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(99,102,241,0.14),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(168,85,247,0.12),transparent_38%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:radial-gradient(ellipse_75%_70%_at_50%_45%,black,transparent_78%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] md:bg-[size:42px_42px]" />
      </div>

      <div className="page-shell relative z-10 max-w-5xl">
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 14 }}
          animate={prefersReduced ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease }}
          className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white/80 p-5 shadow-sm shadow-slate-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045] dark:shadow-black/20 sm:rounded-[1.75rem] sm:p-6 md:rounded-[2rem] md:p-10"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-indigo-500/10 opacity-80" />
          <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-gradient-to-br from-amber-100 to-transparent opacity-80 dark:from-white/[0.06]" />

          <div className="relative z-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200 sm:px-4 sm:tracking-[0.24em]">
              <BadgeDollarSign className="h-3.5 w-3.5" />
              Transparent Pricing
            </div>

            <div className="grid gap-7 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-10">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-white/65">
                  Pricing
                </div>

                <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-[-0.05em] text-slate-950 dark:text-white sm:text-4xl md:text-5xl lg:text-6xl">
                  Transparent pricing for{" "}
                  <span className="bg-gradient-to-r from-amber-600 via-orange-500 to-indigo-600 bg-clip-text text-transparent dark:from-amber-300 dark:via-orange-300 dark:to-indigo-300">
                    every production job.
                  </span>
                </h1>

                <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 dark:text-white/58 sm:text-base sm:leading-7">
                  Starter jobs from $15. Production-ready digitizing from $35.
                  Rush and specialty work quoted individually. All orders
                  include a proof and revision path.
                </p>

                <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  {highlights.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm font-medium text-slate-600 dark:text-white/55"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
                      <span className="leading-5">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <motion.div
                initial={prefersReduced ? false : { opacity: 0, scale: 0.97 }}
                animate={prefersReduced ? undefined : { opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: 0.06, ease }}
                className="relative overflow-hidden rounded-[1.35rem] border border-indigo-500/15 bg-indigo-500/10 p-5 shadow-sm shadow-indigo-500/10 backdrop-blur-xl dark:border-indigo-400/15 dark:bg-indigo-400/10 sm:rounded-[1.5rem] sm:p-6"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-amber-500/10" />

                <div className="relative z-10">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-500/10 bg-white/70 text-indigo-700 shadow-sm dark:border-indigo-400/10 dark:bg-white/[0.06] dark:text-indigo-300">
                    <Sparkles className="h-5 w-5" />
                  </div>

                  <h3 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">
                    First Order Free
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-white/58">
                    New clients get their first digitizing job at no cost. No
                    credit card required.
                  </p>

                  <div className="mt-5 flex flex-col gap-2.5">
                    <Link
                      href="/contact"
                      className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 dark:bg-indigo-300 dark:text-slate-950 dark:hover:bg-indigo-200"
                    >
                      Get a free quote
                      <ArrowRight className="h-4 w-4" />
                    </Link>

                    <Link
                      href="/order"
                      className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/70 px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white/75 dark:hover:bg-white/[0.1]"
                    >
                      <Zap className="h-4 w-4" />
                      Place direct order
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}