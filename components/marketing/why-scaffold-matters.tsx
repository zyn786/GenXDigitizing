"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Card3D } from "@/components/ui/card-3d";
import { Card, CardContent } from "@/components/ui/card";

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const reasons = [
  {
    icon: ShieldCheck,
    title: "Machine-optimized stitch files",
    text: "Files are built for production, not just preview. Density, underlay, trims, and path direction are prepared for real machines and real garments.",
    color:
      "bg-indigo-500/10 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300",
    glow: "from-indigo-500/20 to-blue-500/10",
  },
  {
    icon: Clock3,
    title: "Turnaround you can plan around",
    text: "Standard jobs deliver in 24 hours, with rush options available. Every order has a clear timeline so you can confidently serve your clients.",
    color:
      "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
    glow: "from-emerald-500/20 to-teal-500/10",
  },
  {
    icon: RotateCcw,
    title: "Revisions are part of the process",
    text: "If the proof needs a change, we handle it. No hidden friction — just clear communication, proof approval, and a corrected production file.",
    color:
      "bg-violet-500/10 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300",
    glow: "from-violet-500/20 to-fuchsia-500/10",
  },
  {
    icon: LayoutDashboard,
    title: "Premium client portal access",
    text: "Track orders, approve proofs, request revisions, download files, and manage invoices from one clean place instead of messy email chains.",
    color:
      "bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
    glow: "from-amber-500/20 to-orange-500/10",
  },
];

const trustPoints = [
  "Proof-first approval",
  "DST / PES ready",
  "Manual quality check",
  "Client portal workflow",
];

export function WhyScaffoldMatters() {
  const prefersReduced = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden bg-[#f7f7fb] px-4 py-16 text-slate-950 dark:bg-[#050814] dark:text-white md:px-8 md:py-24 lg:py-28">
      <WhyGenXBackground />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/35 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-500/25 to-transparent" />

      <div className="page-shell relative z-10">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-14">
          {/* Left heading */}
          <motion.div
            initial={prefersReduced ? {} : { opacity: 0, y: 24 }}
            whileInView={prefersReduced ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease }}
            className="lg:sticky lg:top-28"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-white/75 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-indigo-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06] dark:text-indigo-200">
              <Sparkles className="h-3.5 w-3.5" />
              Why GenX
            </div>

            <h2 className="mt-5 max-w-2xl text-3xl font-black tracking-[-0.045em] text-slate-950 dark:text-white md:text-5xl lg:text-6xl">
              Built for decorators who need files that{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 bg-clip-text text-transparent dark:from-indigo-300 dark:via-violet-300 dark:to-blue-300">
                run right.
              </span>
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 dark:text-white/58 md:text-base">
              GenX Digitizing is designed around real production: clear proofs,
              machine-ready files, fast communication, and a workflow clients
              can actually trust.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {trustPoints.map((point) => (
                <span
                  key={point}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.05] dark:text-white/55"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-300" />
                  {point}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {reasons.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.title}
                  initial={prefersReduced ? {} : { opacity: 0, y: 24 }}
                  whileInView={prefersReduced ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, delay: index * 0.08, ease }}
                  className={index % 2 === 1 ? "sm:translate-y-8" : ""}
                >
                  <Card3D className="h-full rounded-[2rem]" intensity={7}>
                    <div className="group relative h-full overflow-visible rounded-[2rem]">
                      <div
                        className={[
                          "pointer-events-none absolute -inset-1 rounded-[2.15rem] bg-gradient-to-br opacity-0 blur-xl transition duration-500 group-hover:opacity-100",
                          item.glow,
                        ].join(" ")}
                      />

                      <Card className="relative h-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white/80 shadow-sm shadow-slate-950/5 backdrop-blur-xl transition-all duration-500 group-hover:-translate-y-1 group-hover:border-slate-300 group-hover:shadow-2xl group-hover:shadow-slate-950/10 dark:border-white/[0.08] dark:bg-white/[0.045] dark:shadow-black/20 dark:group-hover:border-white/[0.16] dark:group-hover:shadow-black/40">
                        <CardContent className="relative z-10 p-6 md:p-7">
                          <div className="flex items-start justify-between gap-4">
                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.color}`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>

                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/30">
                              0{index + 1}
                            </span>
                          </div>

                          <h3 className="mt-6 text-lg font-black tracking-tight text-slate-950 dark:text-white">
                            {item.title}
                          </h3>

                          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-white/52">
                            {item.text}
                          </p>

                          <div className="mt-6 h-px w-full bg-gradient-to-r from-slate-200 via-slate-300 to-transparent dark:from-white/10 dark:via-white/15" />

                          <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition group-hover:text-slate-900 dark:text-white/38 dark:group-hover:text-white/72">
                            Production-ready workflow
                            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                          </div>
                        </CardContent>

                        <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-gradient-to-br from-slate-100 to-transparent opacity-80 dark:from-white/[0.06]" />
                        <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-24 rounded-tr-full bg-gradient-to-tr from-indigo-500/10 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
                      </Card>
                    </div>
                  </Card3D>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes why-thread-flow {
          to {
            stroke-dashoffset: -260;
          }
        }

        @keyframes why-thread-float {
          0%,
          100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(20px, -14px, 0) rotate(1deg);
          }
        }

        .why-thread-dash {
          stroke-dasharray: 12 14;
          animation: why-thread-flow 16s linear infinite;
        }

        .why-thread-float {
          animation: why-thread-float 8s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .why-thread-dash,
          .why-thread-float {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}

function WhyGenXBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.14),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.12),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.1),transparent_38%)]" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.055)_1px,transparent_1px)] bg-[size:42px_42px] [mask-image:radial-gradient(ellipse_75%_70%_at_50%_45%,black,transparent_78%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)]" />

      <svg
        className="why-thread-float absolute -left-32 top-10 h-64 w-[52rem] opacity-55 dark:opacity-35"
        viewBox="0 0 840 260"
        fill="none"
      >
        <path
          d="M24 140 C118 42 212 226 326 108 C442 -12 548 214 662 92 C728 22 778 56 820 84"
          stroke="url(#whyThreadTop)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          className="why-thread-dash"
          d="M24 140 C118 42 212 226 326 108 C442 -12 548 214 662 92 C728 22 778 56 820 84"
          stroke="rgba(99,102,241,0.5)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        <defs>
          <linearGradient
            id="whyThreadTop"
            x1="24"
            y1="0"
            x2="820"
            y2="260"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#6366f1" />
            <stop offset="0.5" stopColor="#a855f7" />
            <stop offset="1" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
      </svg>

      <svg
        className="why-thread-float absolute -right-32 bottom-8 h-64 w-[52rem] rotate-180 opacity-45 dark:opacity-28"
        viewBox="0 0 840 260"
        fill="none"
      >
        <path
          d="M24 140 C118 42 212 226 326 108 C442 -12 548 214 662 92 C728 22 778 56 820 84"
          stroke="url(#whyThreadBottom)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          className="why-thread-dash"
          d="M24 140 C118 42 212 226 326 108 C442 -12 548 214 662 92 C728 22 778 56 820 84"
          stroke="rgba(245,158,11,0.52)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        <defs>
          <linearGradient
            id="whyThreadBottom"
            x1="24"
            y1="0"
            x2="820"
            y2="260"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#f59e0b" />
            <stop offset="0.5" stopColor="#a855f7" />
            <stop offset="1" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}