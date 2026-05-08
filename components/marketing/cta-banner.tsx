"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  Sparkles,
  UploadCloud,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const trustItems = [
  "Free first file",
  "24-hour turnaround",
  "Proof-first approval",
  "DST / PES ready",
];

export function FinalCtaBanner() {
  const prefersReduced = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden bg-[#f7f7fb] px-4 py-16 text-slate-950 dark:bg-[#050814] dark:text-white md:px-8 md:py-24 lg:py-28">
      <CtaBackground />

      {/* Matching top and bottom section dividers */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-indigo-500/25 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px bg-gradient-to-r from-transparent via-violet-500/25 to-transparent" />

      <div className="page-shell relative z-10">
        <motion.div
          initial={prefersReduced ? {} : { opacity: 0, y: 24 }}
          whileInView={prefersReduced ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease }}
          className="relative overflow-hidden rounded-[2.25rem] border border-slate-200 bg-white/80 p-4 shadow-2xl shadow-slate-950/10 backdrop-blur-xl dark:border-white/[0.1] dark:bg-white/[0.055] dark:shadow-black/30 md:p-5"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.16),transparent_34%),radial-gradient(circle_at_85%_75%,rgba(168,85,247,0.14),transparent_34%)]" />

          <div className="relative overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white/75 px-5 py-8 dark:border-white/[0.08] dark:bg-[#07111f]/65 md:px-10 md:py-12 lg:px-12 lg:py-14">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.055)_1px,transparent_1px)] bg-[size:38px_38px] [mask-image:radial-gradient(ellipse_75%_70%_at_50%_45%,black,transparent_78%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)]" />

            <div className="relative z-10 grid gap-9 lg:grid-cols-[1fr_0.72fr] lg:items-center">
              {/* Left content */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-white/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-indigo-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06] dark:text-indigo-200 sm:tracking-[0.28em]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Get started today
                </div>

                <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-black tracking-[-0.055em] text-slate-950 dark:text-white md:text-5xl lg:mx-0 lg:text-6xl">
                  Ready for embroidery files that{" "}
                  <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 bg-clip-text text-transparent dark:from-indigo-300 dark:via-violet-300 dark:to-blue-300">
                    run without rework?
                  </span>
                </h2>

                <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-600 dark:text-white/58 md:text-base lg:mx-0">
                  Send us your artwork and get a production-ready proof back
                  within 24 hours. No setup confusion, no guesswork — just clean
                  files your decorator can run.
                </p>

                <div className="mx-auto mt-7 flex max-w-3xl flex-wrap justify-center gap-2 lg:mx-0 lg:justify-start">
                  {trustItems.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.05] dark:text-white/55"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-300" />
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                  <Button
                    asChild
                    variant="premium"
                    shape="pill"
                    size="lg"
                    className="min-h-[48px] w-full shadow-xl shadow-indigo-500/20 sm:w-auto"
                  >
                    <Link href="/contact">
                      Get a free quote
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    shape="pill"
                    size="lg"
                    className="min-h-[48px] w-full border-slate-300 bg-white/70 text-slate-900 backdrop-blur hover:bg-white dark:border-white/15 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1] sm:w-auto"
                  >
                    <Link href="/orders">Place direct order</Link>
                  </Button>

                  <Button
                    asChild
                    variant="ghost"
                    shape="pill"
                    size="lg"
                    className="min-h-[48px] w-full border border-slate-300 bg-white/30 text-slate-800 backdrop-blur hover:bg-white/70 dark:border-white/15 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.1] sm:w-auto"
                  >
                    <Link href="/login">Client portal</Link>
                  </Button>
                </div>
              </div>

              {/* Desktop side card */}
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-indigo-500/25 via-violet-500/10 to-blue-500/15 blur-3xl" />

                  <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white/80 p-5 shadow-xl shadow-slate-950/10 backdrop-blur-xl dark:border-white/[0.1] dark:bg-white/[0.055] dark:shadow-black/30">
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.26em] text-indigo-600 dark:text-indigo-300">
                          Start order
                        </p>
                        <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950 dark:text-white">
                          Upload artwork now
                        </h3>
                      </div>

                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-indigo-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-indigo-300">
                        <UploadCloud className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/70">
                      <div className="rounded-2xl border border-dashed border-indigo-500/35 bg-white/70 p-5 text-center dark:bg-white/[0.04]">
                        <UploadCloud className="mx-auto h-8 w-8 text-indigo-600 dark:text-indigo-300" />

                        <p className="mt-3 text-sm font-black text-slate-950 dark:text-white">
                          JPG, PNG, PDF, AI, EPS
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-white/45">
                          Add size, placement, fabric, colors, and notes.
                        </p>
                      </div>

                      <div className="mt-4 grid gap-3">
                        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/[0.045]">
                          <span className="text-xs font-bold text-slate-500 dark:text-white/45">
                            Proof delivery
                          </span>
                          <span className="text-xs font-black text-slate-950 dark:text-white">
                            Within 24 hr
                          </span>
                        </div>

                        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/[0.045]">
                          <span className="text-xs font-bold text-slate-500 dark:text-white/45">
                            Final files
                          </span>
                          <span className="text-xs font-black text-slate-950 dark:text-white">
                            DST / PES
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-indigo-500/15 bg-indigo-500/10 p-4 dark:border-indigo-400/15 dark:bg-indigo-400/10">
                      <div className="flex items-start gap-3">
                        <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700 dark:text-indigo-300" />
                        <p className="text-xs leading-6 text-slate-600 dark:text-white/55">
                          Proof images stay visible for review. Final machine
                          files unlock after payment approval.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        @keyframes cta-thread-flow {
          to {
            stroke-dashoffset: -260;
          }
        }

        @keyframes cta-thread-float {
          0%,
          100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(18px, -12px, 0) rotate(1deg);
          }
        }

        .cta-thread-dash {
          stroke-dasharray: 12 14;
          animation: cta-thread-flow 16s linear infinite;
        }

        .cta-thread-float {
          animation: cta-thread-float 8s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .cta-thread-dash,
          .cta-thread-float {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}

function CtaBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.12),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.1),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.08),transparent_38%)]" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:42px_42px] [mask-image:radial-gradient(ellipse_75%_70%_at_50%_45%,black,transparent_78%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]" />

      <svg
        className="cta-thread-float absolute -left-32 top-8 hidden h-64 w-[52rem] opacity-45 dark:opacity-30 md:block"
        viewBox="0 0 840 260"
        fill="none"
      >
        <path
          d="M24 140 C118 42 212 226 326 108 C442 -12 548 214 662 92 C728 22 778 56 820 84"
          stroke="url(#ctaThreadTop)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          className="cta-thread-dash"
          d="M24 140 C118 42 212 226 326 108 C442 -12 548 214 662 92 C728 22 778 56 820 84"
          stroke="rgba(99,102,241,0.5)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        <defs>
          <linearGradient
            id="ctaThreadTop"
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
        className="cta-thread-float absolute -right-32 bottom-8 hidden h-64 w-[52rem] rotate-180 opacity-38 dark:opacity-24 md:block"
        viewBox="0 0 840 260"
        fill="none"
      >
        <path
          d="M24 140 C118 42 212 226 326 108 C442 -12 548 214 662 92 C728 22 778 56 820 84"
          stroke="url(#ctaThreadBottom)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          className="cta-thread-dash"
          d="M24 140 C118 42 212 226 326 108 C442 -12 548 214 662 92 C728 22 778 56 820 84"
          stroke="rgba(245,158,11,0.5)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        <defs>
          <linearGradient
            id="ctaThreadBottom"
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