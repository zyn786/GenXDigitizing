"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Clock3, Mail, MessageCircle, Shield } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const promises = [
  { icon: Clock3, text: "Reply within 24 hours" },
  { icon: Mail, text: "Direct response — no AI bots" },
  { icon: Shield, text: "Your artwork stays private" },
  { icon: MessageCircle, text: "Ongoing chat support" },
];

export function ContactHeroSection() {
  const prefersReduced = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden bg-[#f7f7fb] px-4 pb-10 pt-24 text-slate-950 dark:bg-[#050814] dark:text-white sm:pt-28 md:px-8 md:pb-14 md:pt-32 lg:pt-36">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-72 w-[24rem] -translate-x-1/2 rounded-full bg-indigo-500/[0.08] blur-3xl dark:bg-indigo-400/[0.08] sm:w-[40rem]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.12),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(56,189,248,0.08),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(168,85,247,0.07),transparent_38%)] dark:bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.12),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(56,189,248,0.08),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(168,85,247,0.08),transparent_38%)]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:radial-gradient(ellipse_75%_70%_at_50%_45%,black,transparent_78%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] md:bg-[size:42px_42px]" />
      </div>

      <div className="page-shell relative z-10 max-w-5xl">
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 14 }}
          animate={prefersReduced ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease }}
          className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white/90 p-5 shadow-sm shadow-slate-950/5 backdrop-blur-xl dark:border-slate-800 dark:bg-[#0B1120] dark:shadow-black/30 sm:rounded-[1.75rem] sm:p-6 md:rounded-[2rem] md:p-10"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/8 via-transparent to-cyan-500/8 dark:from-indigo-400/8 dark:to-cyan-400/6" />
          <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-gradient-to-br from-slate-100 to-transparent opacity-80 dark:from-indigo-400/10" />

          <div className="relative z-10 grid gap-7 lg:grid-cols-[1.2fr_0.8fr] lg:items-start lg:gap-10">
            <div>
              <motion.div
                initial={prefersReduced ? false : { opacity: 0, y: 12 }}
                animate={prefersReduced ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.04, ease }}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300 sm:px-4 sm:tracking-[0.24em]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(99,102,241,0.8)] dark:bg-indigo-300" />
                Contact Us
              </motion.div>

              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Contact
              </div>

              <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-[-0.05em] text-slate-950 dark:text-slate-100 sm:text-4xl md:text-5xl lg:text-6xl">
                Tell us about your project — we&rsquo;ll reply within{" "}
                <span className="bg-gradient-to-r from-indigo-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent dark:from-indigo-300 dark:via-cyan-300 dark:to-blue-300">
                  24 hours.
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-base sm:leading-7">
                Share your artwork, garment type, placement, and turnaround
                needs. We&rsquo;ll come back with a clear quote and a plan to
                get your files production-ready.
              </p>
            </div>

            <motion.div
              initial={prefersReduced ? false : { opacity: 0, x: 14 }}
              animate={prefersReduced ? undefined : { opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.08, ease }}
              className="space-y-3"
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                What to expect
              </p>

              {promises.map(({ icon: Icon, text }, index) => (
                <motion.div
                  key={text}
                  initial={prefersReduced ? false : { opacity: 0, x: 10 }}
                  animate={prefersReduced ? undefined : { opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: prefersReduced ? 0 : 0.12 + index * 0.04,
                    ease,
                  }}
                  className="group relative overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-[#0F172A] dark:hover:border-slate-600 dark:hover:bg-[#111C31] sm:rounded-[1.5rem]"
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/6 via-transparent to-cyan-500/6 dark:from-indigo-400/6 dark:to-cyan-400/5" />

                  <div className="relative z-10 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/10 bg-indigo-500/10 text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300">
                      <Icon className="h-4 w-4" />
                    </div>

                    <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                      {text}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}