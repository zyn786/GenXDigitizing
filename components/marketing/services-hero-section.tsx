"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Award, CheckCircle2, Cpu, Shapes } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const highlights = [
  {
    icon: Cpu,
    title: "Embroidery digitizing",
    text: "Production-ready stitch files for left chest logos, cap fronts, 3D puff, jacket backs, and specialty work — optimized for commercial machines.",
  },
  {
    icon: Shapes,
    title: "Vector art conversion",
    text: "Clean, scalable vector rebuilds from any artwork format — ready for apparel decoration, signage, print, and brand asset systems.",
  },
  {
    icon: Award,
    title: "Custom patches",
    text: "Embroidered, chenille, woven, PVC, and leather patch work with structured specification paths and approval-ready proofs.",
  },
];

const badges = [
  "24-hr turnaround",
  "Revisions included",
  "All machine formats",
  "Rush available",
];

export function ServicesHeroSection() {
  const prefersReduced = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden bg-[#f7f7fb] px-4 pb-10 pt-28 text-slate-950 dark:bg-[#050814] dark:text-white sm:pt-32 md:px-8 md:pb-14 md:pt-36 lg:pt-40">
      <ServicesHeroBackground />

      <div className="page-shell relative z-10">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-12">
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 14 }}
            animate={prefersReduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease }}
            className="space-y-5 md:space-y-6"
          >
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-white/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700 shadow-sm backdrop-blur dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300 sm:px-4 sm:tracking-[0.24em]">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(99,102,241,0.8)] dark:bg-indigo-300" />
                Our Services
              </div>

              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Services
              </div>

              <h1 className="mt-3 max-w-2xl text-3xl font-black tracking-[-0.05em] text-slate-950 dark:text-slate-100 sm:text-4xl md:text-5xl lg:text-6xl">
                Production-ready embroidery, vector art &amp;{" "}
                <span className="bg-gradient-to-r from-indigo-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent dark:from-indigo-300 dark:via-cyan-300 dark:to-blue-300">
                  custom patches.
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-base sm:leading-7">
                Every service is built around real production workflows — not
                generic templates. Files that run right the first time, with
                proofs and revisions included.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1 sm:gap-2">
              {badges.map((badge) => (
                <div
                  key={badge}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1.5 text-[10px] font-bold text-slate-600 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-[#111C31] dark:text-slate-300 sm:px-3 sm:text-xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-300" />
                  {badge}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 14 }}
            animate={prefersReduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05, ease }}
            className="grid gap-3 sm:gap-4"
          >
            {highlights.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.title}
                  initial={prefersReduced ? false : { opacity: 0, x: 12 }}
                  animate={prefersReduced ? undefined : { opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: prefersReduced ? 0 : 0.08 + index * 0.04,
                    ease,
                  }}
                >
                  <Card className="group relative h-fit overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white/90 shadow-sm shadow-slate-950/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-xl hover:shadow-slate-950/10 dark:border-slate-800 dark:bg-[#0B1120] dark:shadow-black/30 dark:hover:border-slate-700 dark:hover:bg-[#0F172A] sm:rounded-[1.75rem]">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/8 via-transparent to-cyan-500/8 dark:from-indigo-400/8 dark:to-cyan-400/6" />
                    <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-gradient-to-br from-slate-100 to-transparent opacity-80 dark:from-indigo-400/10" />

                    <CardContent className="relative z-10 flex gap-3 p-4 sm:gap-4 sm:p-5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/10 bg-indigo-500/10 text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300 sm:h-11 sm:w-11 sm:rounded-2xl">
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <h2 className="text-sm font-black tracking-tight text-slate-950 dark:text-slate-100">
                          {item.title}
                        </h2>

                        <p className="mt-1.5 text-[13px] leading-6 text-slate-600 dark:text-slate-400 sm:text-sm">
                          {item.text}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ServicesHeroBackground() {
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