"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  Download,
  FileUp,
  LockKeyhole,
  MessageSquareText,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const steps = [
  {
    number: "01",
    icon: FileUp,
    title: "Upload artwork",
    shortTitle: "Artwork received",
    text: "Upload your logo or design file — JPG, PNG, PDF, AI, EPS, or vector. Add placement, size, garment type, colors, and production notes.",
    chip: "Artwork",
    time: "2 min setup",
    file: "Logo.png",
    output: "Order brief created",
    color: "from-indigo-500/35 via-blue-500/12 to-transparent",
    iconColor: "text-indigo-700 dark:text-indigo-300",
    soft: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  },
  {
    number: "02",
    icon: WandSparkles,
    title: "Digitize & proof",
    shortTitle: "Proof prepared",
    text: "Our team builds the stitch file with correct density, underlay, trims, and pathing, then sends a clean JPG/PNG proof for review.",
    chip: "Proof",
    time: "Within 24 hr",
    file: "Proof.jpg",
    output: "Visual proof ready",
    color: "from-violet-500/35 via-fuchsia-500/12 to-transparent",
    iconColor: "text-violet-700 dark:text-violet-300",
    soft: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  {
    number: "03",
    icon: MessageSquareText,
    title: "Approve or revise",
    shortTitle: "Client review",
    text: "The client can approve, reject, or request revision. Comments go clearly to admin and designer so the file can be corrected fast.",
    chip: "Review",
    time: "Revision path",
    file: "Revision note",
    output: "Approved proof",
    color: "from-amber-500/35 via-orange-500/12 to-transparent",
    iconColor: "text-amber-700 dark:text-amber-300",
    soft: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  {
    number: "04",
    icon: Download,
    title: "Pay & download",
    shortTitle: "Final delivery",
    text: "After payment approval, final production files unlock for download — DST, PES, EMB, EXP, PDF proof, and other requested formats.",
    chip: "Delivery",
    time: "Files unlocked",
    file: "DST / PES / EMB",
    output: "Production-ready",
    color: "from-emerald-500/35 via-teal-500/12 to-transparent",
    iconColor: "text-emerald-700 dark:text-emerald-300",
    soft: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
];

const trustItems = [
  "Proof-first approval",
  "Revision-friendly",
  "DST / PES delivery",
  "Payment-locked files",
];

function useLargeScreen() {
  const [isLarge, setIsLarge] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");

    const update = () => setIsLarge(media.matches);

    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);

  return isLarge;
}

export function DeliverySequence() {
  const prefersReduced = useReducedMotion();
  const isLargeScreen = useLargeScreen();
  const [activeStep, setActiveStep] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);

  const active = steps[activeStep];
  const ActiveIcon = active.icon;

  React.useEffect(() => {
    if (prefersReduced || isPaused || !isLargeScreen) return;

    const interval = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % steps.length);
    }, 4600);

    return () => window.clearInterval(interval);
  }, [prefersReduced, isPaused, isLargeScreen]);

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative isolate overflow-hidden bg-[#f7f7fb] px-4 py-10 text-slate-950 dark:bg-[#050814] dark:text-white sm:py-12 md:px-8 md:py-20 lg:py-28"
    >
      <DeliveryBackground />

      <div className="page-shell relative z-10">
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 14 }}
          whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.35, ease }}
          className="mx-auto mb-7 max-w-4xl text-center md:mb-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-white/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06] dark:text-indigo-200 sm:tracking-[0.28em]">
            <Sparkles className="h-3.5 w-3.5" />
            How it works
          </div>

          <h2 className="mt-4 text-3xl font-black tracking-[-0.045em] text-slate-950 dark:text-white sm:text-4xl md:mt-5 md:text-5xl lg:text-6xl">
            Simple order flow to{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 bg-clip-text text-transparent dark:from-indigo-300 dark:via-violet-300 dark:to-blue-300">
              production-ready files.
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 dark:text-white/58 md:mt-5 md:text-base md:leading-7">
            Upload artwork, review the proof, request revisions, and unlock
            final machine files after payment approval.
          </p>
        </motion.div>

        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 12 }}
          whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.32, delay: 0.04, ease }}
          className="mx-auto mb-8 flex max-w-4xl flex-wrap justify-center gap-1.5 md:mb-10 md:gap-2"
        >
          {trustItems.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-2.5 py-1.5 text-[10px] font-bold text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.05] dark:text-white/55 sm:px-3 sm:text-[11px]"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-300" />
              {item}
            </span>
          ))}
        </motion.div>

        {/* Mobile / tablet premium vertical timeline */}
        <div className="relative mx-auto grid max-w-xl gap-9 pb-2 lg:hidden">
          <div className="absolute bottom-6 left-[28px] top-3 w-px bg-gradient-to-b from-violet-500/35 via-slate-300/50 to-transparent dark:from-violet-400/45 dark:via-white/10 dark:to-transparent" />

          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <motion.div
                key={step.number}
                initial={prefersReduced ? false : { opacity: 0, y: 14 }}
                whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.3,
                  delay: prefersReduced ? 0 : index * 0.05,
                  ease,
                }}
                className="relative grid grid-cols-[58px_1fr] items-start gap-4"
              >
                <div className="relative z-10 pt-1">
                  <div
                    className="text-4xl font-black leading-none tracking-[-0.1em] text-violet-600 dark:text-violet-500 sm:text-5xl"
                    style={{
                      textShadow:
                        "0 0 18px rgba(168,85,247,0.55), 0 0 34px rgba(99,102,241,0.25)",
                    }}
                  >
                    {step.number}
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white/80 p-4 shadow-lg shadow-slate-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.065] dark:shadow-black/20 sm:rounded-[1.5rem] sm:p-5">
                  <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${step.color} opacity-20 dark:opacity-25`}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(15,23,42,0.08)_1px,transparent_1px)] [background-size:18px_18px] opacity-25 dark:bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] dark:opacity-30" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300">
                        Step {step.number}
                      </span>

                      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/70 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
                        <Icon className={`h-4 w-4 ${step.iconColor}`} />
                      </div>
                    </div>

                    <h3 className="mt-3 text-base font-black tracking-tight text-slate-950 dark:text-white sm:text-lg">
                      {step.title}
                    </h3>

                    <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-white/55 sm:text-[13px]">
                      {step.text}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${step.soft}`}
                      >
                        {step.chip}
                      </span>

                      <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/35">
                        {step.time}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          <div className="relative grid grid-cols-[58px_1fr] items-start gap-4">
            <div className="relative z-10 flex justify-center pt-1">
              <div className="h-3 w-3 rounded-full bg-violet-500 shadow-[0_0_18px_rgba(168,85,247,0.7)] dark:bg-violet-400" />
            </div>

            <div className="rounded-[1.35rem] border border-indigo-500/15 bg-indigo-500/10 p-4 shadow-lg shadow-slate-950/10 backdrop-blur-xl dark:border-violet-400/15 dark:bg-violet-400/10 dark:shadow-black/20 sm:rounded-[1.5rem]">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700 dark:text-violet-300" />
                <p className="text-xs leading-6 text-slate-600 dark:text-white/55">
                  Final DST/PES production files stay locked until payment is
                  approved. Proof images remain visible for client review.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop interactive flow */}
        <div className="hidden lg:block">
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 12 }}
            whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.35, delay: 0.08, ease }}
            className="mb-8"
          >
            <div className="mx-auto flex w-full gap-3 rounded-[2rem] border border-slate-200 bg-white/65 p-2 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = activeStep === index;

                return (
                  <button
                    key={step.number}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveStep(index)}
                    className={[
                      "group relative flex-1 overflow-hidden rounded-[1.5rem] border px-4 py-3 text-left transition-all duration-300",
                      isActive
                        ? "border-indigo-500/30 bg-white shadow-lg shadow-indigo-500/10 dark:border-indigo-400/25 dark:bg-white/[0.075]"
                        : "border-transparent hover:bg-white/70 dark:hover:bg-white/[0.055]",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300",
                        step.color,
                        isActive ? "opacity-100" : "group-hover:opacity-60",
                      ].join(" ")}
                    />

                    <div className="relative z-10 flex items-center gap-3">
                      <div
                        className={[
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition",
                          isActive
                            ? "border-white/60 bg-white/80 dark:border-white/10 dark:bg-white/[0.08]"
                            : "border-slate-200 bg-white/55 dark:border-white/10 dark:bg-white/[0.04]",
                        ].join(" ")}
                      >
                        <Icon className={`h-4 w-4 ${step.iconColor}`} />
                      </div>

                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-white/30">
                          Step {step.number}
                        </div>
                        <div className="mt-0.5 text-sm font-black text-slate-950 dark:text-white">
                          {step.chip}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>

          <div className="grid items-start gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="grid gap-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = activeStep === index;
                const isDone = index < activeStep;

                return (
                  <motion.div
                    key={step.number}
                    initial={prefersReduced ? false : { opacity: 0, y: 16 }}
                    whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{
                      duration: 0.32,
                      delay: prefersReduced ? 0 : index * 0.04,
                      ease,
                    }}
                    onMouseEnter={() => setActiveStep(index)}
                    onFocus={() => setActiveStep(index)}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveStep(index)}
                      className="group block w-full rounded-[2rem] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f7fb] dark:focus-visible:ring-offset-[#050814]"
                    >
                      <Card
                        className={[
                          "relative overflow-hidden rounded-[2rem] border bg-white/82 shadow-sm shadow-slate-950/5 backdrop-blur-xl transition-all duration-300 dark:bg-white/[0.045] dark:shadow-black/20",
                          isActive
                            ? "border-indigo-500/35 shadow-2xl shadow-indigo-500/10 dark:border-indigo-400/30 dark:shadow-black/40"
                            : "border-slate-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-950/10 dark:border-white/[0.08] dark:hover:border-white/[0.14]",
                        ].join(" ")}
                      >
                        <div
                          className={[
                            "absolute inset-0 bg-gradient-to-br transition-opacity duration-300",
                            step.color,
                            isActive
                              ? "opacity-90"
                              : "opacity-35 group-hover:opacity-60",
                          ].join(" ")}
                        />

                        <CardContent className="relative z-10 p-6">
                          <div className="flex gap-4">
                            <div className="relative shrink-0">
                              <div
                                className={[
                                  "flex h-12 w-12 items-center justify-center rounded-2xl border shadow-sm transition-all duration-300",
                                  isActive
                                    ? "scale-105 border-white/50 bg-white/85 dark:border-white/10 dark:bg-white/[0.09]"
                                    : "border-slate-200 bg-white/70 dark:border-white/10 dark:bg-white/[0.05]",
                                ].join(" ")}
                              >
                                {isDone ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                                ) : (
                                  <Icon className={`h-5 w-5 ${step.iconColor}`} />
                                )}
                              </div>

                              <div className="absolute -right-1 -top-1 rounded-full border border-white bg-slate-950 px-1.5 py-0.5 text-[8px] font-black text-white dark:border-slate-900 dark:bg-white dark:text-slate-950">
                                {step.number}
                              </div>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${step.soft}`}
                                >
                                  {step.chip}
                                </span>

                                <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/30">
                                  {step.time}
                                </span>
                              </div>

                              <h3 className="mt-3 text-lg font-black tracking-tight text-slate-950 dark:text-white">
                                {step.title}
                              </h3>

                              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-white/52">
                                {step.text}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </button>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              initial={
                prefersReduced ? false : { opacity: 0, x: 18, scale: 0.98 }
              }
              whileInView={
                prefersReduced ? undefined : { opacity: 1, x: 0, scale: 1 }
              }
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.38, delay: 0.08, ease }}
              className="sticky top-28"
            >
              <div className="relative">
                <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-blue-500/15 blur-3xl" />

                <Card className="relative overflow-hidden rounded-[2.25rem] border border-slate-200 bg-white/82 shadow-2xl shadow-slate-950/10 backdrop-blur-xl dark:border-white/[0.1] dark:bg-white/[0.055] dark:shadow-black/30">
                  <CardContent className="p-6">
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-indigo-600 dark:text-indigo-300">
                          Live workflow preview
                        </p>
                        <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                          {active.shortTitle}
                        </h3>
                      </div>

                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.06]">
                        <ActiveIcon className={`h-5 w-5 ${active.iconColor}`} />
                      </div>
                    </div>

                    <div className="relative overflow-hidden rounded-[1.6rem] border border-slate-200 bg-slate-950 p-5 text-white dark:border-white/10">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.42),transparent_32%),radial-gradient(circle_at_85%_80%,rgba(168,85,247,0.25),transparent_32%)]" />
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:34px_34px] opacity-30" />

                      <div className="relative z-10">
                        <div className="flex items-center justify-between gap-3">
                          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                            Step {active.number}
                          </span>

                          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-950">
                            {active.chip}
                          </span>
                        </div>

                        <div className="mt-8 grid gap-4 sm:grid-cols-[0.8fr_1.2fr] sm:items-center">
                          <div className="relative mx-auto flex h-44 w-44 items-center justify-center rounded-[2rem] border border-white/15 bg-white/10 shadow-2xl backdrop-blur">
                            <div className="absolute inset-4 rounded-[1.5rem] border border-dashed border-white/15" />
                            <div className="absolute inset-8 rounded-full border border-white/10" />
                            <ActiveIcon className="relative z-10 h-12 w-12" />
                          </div>

                          <div>
                            <h4 className="text-2xl font-black tracking-tight">
                              {active.title}
                            </h4>

                            <p className="mt-3 text-sm leading-7 text-white/58">
                              {active.text}
                            </p>
                          </div>
                        </div>

                        <div className="mt-8 grid gap-3 sm:grid-cols-2">
                          <WorkflowPreviewBox
                            icon={PackageCheck}
                            label="Input"
                            value={active.file}
                          />

                          <WorkflowPreviewBox
                            icon={ShieldCheck}
                            label="Output"
                            value={active.output}
                          />
                        </div>

                        <div className="mt-8 space-y-3">
                          {steps.map((step, index) => {
                            const completed = index <= activeStep;

                            return (
                              <div
                                key={step.number}
                                className="flex items-center gap-3"
                              >
                                <div
                                  className={[
                                    "flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-black transition",
                                    completed
                                      ? "border-indigo-300 bg-indigo-300 text-slate-950"
                                      : "border-white/15 bg-white/5 text-white/30",
                                  ].join(" ")}
                                >
                                  {completed ? (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  ) : (
                                    step.number
                                  )}
                                </div>

                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                                  <div
                                    className={[
                                      "h-full rounded-full bg-gradient-to-r from-indigo-300 to-violet-300 transition-all duration-700",
                                      completed ? "w-full" : "w-0",
                                    ].join(" ")}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-8 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                          <div className="flex items-start gap-3">
                            <LockKeyhole className="mt-0.5 h-4 w-4 text-indigo-200" />
                            <p className="text-xs leading-6 text-white/58">
                              Final machine files stay locked until payment is
                              approved. Proof images remain visible for client
                              review.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes delivery-thread-flow {
          to {
            stroke-dashoffset: -260;
          }
        }

        @keyframes delivery-thread-float {
          0%,
          100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(18px, -12px, 0) rotate(1deg);
          }
        }

        .delivery-thread-dash {
          stroke-dasharray: 12 14;
          animation: delivery-thread-flow 15s linear infinite;
        }

        .delivery-thread-float {
          animation: delivery-thread-float 8s ease-in-out infinite;
        }

        @media (max-width: 767px) {
          .delivery-thread-dash,
          .delivery-thread-float {
            animation: none !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .delivery-thread-dash,
          .delivery-thread-float {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}

function WorkflowPreviewBox({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/40">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-2 text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function DeliveryBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.12),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.1),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.08),transparent_38%)] dark:bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.14),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.12),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.1),transparent_38%)]" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:radial-gradient(ellipse_75%_70%_at_50%_45%,black,transparent_78%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] md:bg-[size:42px_42px]" />

      <svg
        className="delivery-thread-float absolute -left-32 top-10 hidden h-64 w-[52rem] opacity-55 dark:opacity-35 md:block"
        viewBox="0 0 840 260"
        fill="none"
      >
        <path
          d="M24 140 C118 42 212 226 326 108 C442 -12 548 214 662 92 C728 22 778 56 820 84"
          stroke="url(#deliveryThreadTop)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          className="delivery-thread-dash"
          d="M24 140 C118 42 212 226 326 108 C442 -12 548 214 662 92 C728 22 778 56 820 84"
          stroke="rgba(99,102,241,0.5)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        <defs>
          <linearGradient
            id="deliveryThreadTop"
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
        className="delivery-thread-float absolute -right-32 bottom-8 hidden h-64 w-[52rem] rotate-180 opacity-45 dark:opacity-28 md:block"
        viewBox="0 0 840 260"
        fill="none"
      >
        <path
          d="M24 140 C118 42 212 226 326 108 C442 -12 548 214 662 92 C728 22 778 56 820 84"
          stroke="url(#deliveryThreadBottom)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          className="delivery-thread-dash"
          d="M24 140 C118 42 212 226 326 108 C442 -12 548 214 662 92 C728 22 778 56 820 84"
          stroke="rgba(245,158,11,0.52)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        <defs>
          <linearGradient
            id="deliveryThreadBottom"
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