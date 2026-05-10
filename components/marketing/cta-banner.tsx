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
    <section className="relative isolate overflow-hidden bg-[#F7F8FF] px-4 py-12 text-[#050816] dark:bg-[#050814] dark:text-slate-100 md:px-8 md:py-20 lg:py-24">
      <CtaBackground />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-slate-300/80 to-transparent dark:via-white/15" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px bg-gradient-to-r from-transparent via-slate-300/80 to-transparent dark:via-white/15" />

      <div className="page-shell relative z-10">
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 18 }}
          whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.38, ease }}
          className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white/90 p-3 shadow-xl shadow-slate-950/10 backdrop-blur-xl dark:border-slate-800 dark:bg-[#0B1120] dark:shadow-black/30 sm:rounded-[2rem] md:p-4"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#6D35FF]/8 via-transparent to-[#0EA5E9]/8 dark:from-indigo-400/8 dark:to-cyan-400/6" />
          <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-bl-full bg-gradient-to-br from-slate-100 to-transparent opacity-80 dark:from-indigo-400/10" />

          <div className="relative overflow-hidden rounded-[1.45rem] border border-slate-200 bg-white/85 px-5 py-8 dark:border-slate-800 dark:bg-[#0F172A] sm:rounded-[1.75rem] md:px-8 md:py-10 lg:px-10 lg:py-12">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:radial-gradient(ellipse_75%_70%_at_50%_45%,black,transparent_78%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)]" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-center">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#6D35FF]/20 bg-white/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#5B21B6] shadow-sm backdrop-blur dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300 sm:tracking-[0.24em]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Get started today
                </div>

                <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-black tracking-[-0.055em] text-[#050816] dark:text-slate-100 sm:text-4xl md:text-5xl lg:mx-0 lg:text-6xl">
                  Ready for embroidery files that{" "}
                  <span className="bg-gradient-to-r from-[#6D35FF] via-[#7C3AED] to-[#2563EB] bg-clip-text text-transparent dark:from-indigo-300 dark:via-cyan-300 dark:to-blue-300">
                    run without rework?
                  </span>
                </h2>

                <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#525866] dark:text-slate-400 sm:text-base lg:mx-0">
                  Send us your artwork and get a production-ready proof back
                  within 24 hours. No setup confusion, no guesswork — just clean
                  files your decorator can run.
                </p>

                <div className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2 lg:mx-0 lg:justify-start">
                  {trustItems.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-[#111C31] dark:text-slate-300"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#2563EB] dark:text-indigo-300" />
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-8 flex flex-col justify-center gap-2.5 sm:flex-row lg:justify-start">
                  <Button
                    asChild
                    shape="pill"
                    size="lg"
                    className="min-h-[46px] w-full border-0 bg-gradient-to-r from-[#6D35FF] to-[#2563EB] text-white shadow-lg shadow-[#6D35FF]/20 transition hover:-translate-y-0.5 hover:opacity-95 dark:from-indigo-500 dark:to-blue-500 sm:w-auto"
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
                    className="min-h-[46px] w-full border-slate-300 bg-white/80 text-[#050816] backdrop-blur hover:-translate-y-0.5 hover:bg-white dark:border-slate-700 dark:bg-[#0B1120] dark:text-slate-100 dark:hover:bg-[#111C31] sm:w-auto"
                  >
                    <Link href="/order">Place direct order</Link>
                  </Button>

                  <Button
                    asChild
                    variant="ghost"
                    shape="pill"
                    size="lg"
                    className="min-h-[46px] w-full border border-slate-300 bg-white/45 text-[#050816] backdrop-blur hover:-translate-y-0.5 hover:bg-white/80 dark:border-slate-700 dark:bg-[#0B1120]/70 dark:text-slate-200 dark:hover:bg-[#111C31] sm:w-auto"
                  >
                    <Link href="/login">Client portal</Link>
                  </Button>
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-[#6D35FF]/18 via-[#7C3AED]/8 to-[#2563EB]/18 blur-3xl dark:from-indigo-500/16 dark:via-cyan-500/8 dark:to-blue-500/12" />

                  <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-950/10 backdrop-blur-xl dark:border-slate-800 dark:bg-[#0B1120] dark:shadow-black/30">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#6D35FF]/8 via-transparent to-[#0EA5E9]/8 dark:from-indigo-400/8 dark:to-cyan-400/6" />

                    <div className="relative z-10">
                      <div className="mb-5 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#2563EB] dark:text-indigo-300">
                            Start order
                          </p>

                          <h3 className="mt-1 text-xl font-black tracking-tight text-[#050816] dark:text-slate-100">
                            Upload artwork now
                          </h3>
                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#6D35FF]/10 bg-[#6D35FF]/10 text-[#2563EB] dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300">
                          <UploadCloud className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-[#0F172A]">
                        <div className="rounded-2xl border border-dashed border-[#6D35FF]/35 bg-white/80 p-5 text-center dark:border-indigo-400/30 dark:bg-[#0B1120]">
                          <UploadCloud className="mx-auto h-8 w-8 text-[#2563EB] dark:text-indigo-300" />

                          <p className="mt-3 text-sm font-black text-[#050816] dark:text-slate-100">
                            JPG, PNG, PDF, AI, EPS
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                            Add size, placement, fabric, colors, and notes.
                          </p>
                        </div>

                        <div className="mt-4 grid gap-3">
                          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 dark:border-slate-700 dark:bg-[#111C31]">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                              Proof delivery
                            </span>

                            <span className="text-xs font-black text-[#050816] dark:text-slate-100">
                              Within 24 hr
                            </span>
                          </div>

                          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 dark:border-slate-700 dark:bg-[#111C31]">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                              Final files
                            </span>

                            <span className="text-xs font-black text-[#050816] dark:text-slate-100">
                              DST / PES
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-[#2563EB]/15 bg-[#2563EB]/10 p-4 dark:border-indigo-400/20 dark:bg-indigo-400/10">
                        <div className="flex items-start gap-3">
                          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB] dark:text-indigo-300" />

                          <p className="text-xs leading-6 text-[#525866] dark:text-slate-400">
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

        @media (max-width: 767px) {
          .cta-thread-dash,
          .cta-thread-float {
            animation: none !important;
          }
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
      {/* Main dark premium gradient */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#EFF6FF_0%,#EEF2FF_35%,#F5F3FF_70%,#F8FAFC_100%)] dark:bg-[linear-gradient(135deg,#050814_0%,#0B1120_35%,#111827_70%,#020617_100%)]" />

      {/* Large blurred glow orbs */}
      <div className="absolute -left-32 top-0 h-[30rem] w-[30rem] rounded-full bg-[#6D35FF]/25 blur-3xl" />
      <div className="absolute right-[-8rem] top-[20%] h-[26rem] w-[26rem] rounded-full bg-[#2563EB]/20 blur-3xl" />
      <div className="absolute bottom-[-10rem] left-[30%] h-[28rem] w-[28rem] rounded-full bg-[#0EA5E9]/15 blur-3xl" />

      {/* Soft radial overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_45%)]" />

      {/* Grid texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30 [mask-image:radial-gradient(ellipse_75%_70%_at_50%_45%,black,transparent_78%)]" />

      {/* Animated top thread */}
      <svg
        className="cta-thread-float absolute -left-32 top-8 hidden h-64 w-[52rem] opacity-40 md:block"
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
          stroke="rgba(255,255,255,0.25)"
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
            <stop stopColor="#6D35FF" />
            <stop offset="0.5" stopColor="#2563EB" />
            <stop offset="1" stopColor="#0EA5E9" />
          </linearGradient>
        </defs>
      </svg>

      {/* Bottom thread */}
      <svg
        className="cta-thread-float absolute -right-32 bottom-8 hidden h-64 w-[52rem] rotate-180 opacity-30 md:block"
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
          stroke="rgba(255,255,255,0.2)"
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
            <stop stopColor="#0EA5E9" />
            <stop offset="0.5" stopColor="#2563EB" />
            <stop offset="1" stopColor="#6D35FF" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}