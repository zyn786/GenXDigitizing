"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Layers3,
  MousePointer2,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const stats = [
  { value: "1,200+", label: "Files delivered" },
  { value: "24 hr", label: "Turnaround" },
  { value: "∞", label: "Revisions included" },
];

const tickerItems = [
  "First Design On Us",
  "Embroidery Digitizing",
  "Vector Redraw",
  "Custom Patches",
  "DTF / Screen Print Ready",
  "Bulk Orders, Bigger Savings",
];

const floatingCards = [
  {
    title: "Embroidery Digitizing",
    label: "DST / PES Ready",
    icon: "🧵",
  },
  {
    title: "Vector Artwork",
    label: "AI / EPS / SVG",
    icon: "✦",
  },
  {
    title: "Custom Patches",
    label: "Merrow / PVC / Woven",
    icon: "🏷️",
  },
  {
    title: "3D Puff Caps",
    label: "Raised Stitch Finish",
    icon: "🧢",
  },
];

export function HeroSection() {
  const prefersReduced = useReducedMotion();

  return (
    <section className="relative -mt-20 min-h-screen overflow-hidden bg-[#f7f7fb] text-slate-950 dark:bg-[#050814] dark:text-white">
      <HeroBackground />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 pb-28 pt-28 sm:pb-32 md:px-8 md:pt-36 lg:pb-32">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          {/* LEFT CONTENT */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={prefersReduced ? {} : { opacity: 0, y: 18 }}
              animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease }}
              className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-white/70 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.22em] text-indigo-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06] dark:text-indigo-200 sm:tracking-[0.28em] md:mb-7 md:px-4 md:py-2 md:text-[10px] lg:mx-0"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.9)]" />
              <Sparkles className="h-3 w-3 opacity-70" />
              Premium Embroidery Digitizing
            </motion.div>

            <motion.h1
              initial={prefersReduced ? {} : { opacity: 0, y: 24 }}
              animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.08, ease }}
              className="mx-auto max-w-4xl text-[2.65rem] font-black leading-[0.98] tracking-[-0.06em] text-slate-950 dark:text-white sm:text-5xl md:text-6xl lg:mx-0 lg:text-[4.65rem]"
            >
              Digitizing that looks{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 bg-clip-text text-transparent dark:from-indigo-300 dark:via-violet-300 dark:to-blue-300">
                ready before it stitches.
              </span>
            </motion.h1>

            <motion.p
              initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
              animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.18, ease }}
              className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-600 dark:text-white/58 md:text-base lg:mx-0"
            >
              Embroidery digitizing, clean vector redraws, custom patches, and
              print-ready artwork delivered with sharp stitch quality, fast
              turnaround, and a full revision path.
            </motion.p>

            <motion.div
              initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
              animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.28, ease }}
              className="mt-7 flex flex-col items-center gap-3 lg:items-start"
            >
              <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-center lg:justify-start">
                <Button
                  asChild
                  variant="premium"
                  shape="pill"
                  size="lg"
                  className="min-h-[46px] w-full shadow-xl shadow-indigo-500/20 sm:w-auto"
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
                  className="min-h-[46px] w-full border-slate-300 bg-white/60 text-slate-900 backdrop-blur hover:bg-white dark:border-white/15 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1] sm:w-auto"
                >
                  <Link href="/orders">Place Direct Order</Link>
                </Button>

                <Button
                  asChild
                  variant="ghost"
                  shape="pill"
                  size="lg"
                  className="min-h-[46px] w-full border border-slate-300 bg-white/30 text-slate-800 backdrop-blur hover:bg-white/70 dark:border-white/15 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.1] sm:w-auto"
                >
                  <Link href="/portfolio">View our work</Link>
                </Button>
              </div>

              <p className="text-[11px] tracking-wide text-slate-500 dark:text-white/35">
                Free first file · No credit card required · 24-hr turnaround
              </p>
            </motion.div>

            {/* STATS */}
            <motion.div
              initial={prefersReduced ? {} : { opacity: 0, y: 16 }}
              animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.4, ease }}
              className="mx-auto mt-7 flex w-fit max-w-full overflow-hidden rounded-3xl border border-slate-200 bg-white/70 shadow-xl shadow-slate-950/5 backdrop-blur divide-x divide-slate-200 dark:border-white/[0.1] dark:bg-white/[0.055] dark:divide-white/[0.08] lg:mx-0"
            >
              {stats.map(({ value, label }) => (
                <div
                  key={label}
                  className="min-w-0 px-3 py-3 text-center sm:px-7 sm:py-4"
                >
                  <div className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-lg font-black tracking-tight text-transparent dark:from-indigo-300 dark:to-violet-300 sm:text-2xl">
                    {value}
                  </div>
                  <div className="mt-0.5 text-[9px] text-slate-500 dark:text-white/45 sm:text-[11px]">
                    {label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* DESKTOP VISUAL ONLY */}
          <motion.div
            initial={prefersReduced ? {} : { opacity: 0, x: 30, scale: 0.96 }}
            animate={prefersReduced ? {} : { opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.18, ease }}
            className="relative mx-auto hidden w-full max-w-[520px] lg:block"
          >
            <DesktopProductionVisual />
          </motion.div>
        </div>
      </div>

      {/* TICKER */}
      <div className="absolute bottom-0 left-0 right-0 z-20 overflow-hidden whitespace-nowrap border-t border-slate-200 bg-white/70 py-3 shadow-[0_-20px_60px_rgba(15,23,42,0.06)] backdrop-blur-md dark:border-white/[0.07] dark:bg-[#07111f]/70 md:py-4">
        <div className="hero-ticker-track">
          {[...tickerItems, ...tickerItems].map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="inline-flex shrink-0 items-center whitespace-nowrap px-5 text-xs font-black italic uppercase tracking-wide text-indigo-700 dark:text-indigo-300 sm:text-sm md:px-10 md:text-lg"
            >
              <span className="mr-5 text-violet-500/50 md:mr-10">◆</span>
              {item}
            </span>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes hero-ticker {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-50%, 0, 0);
          }
        }

        @keyframes hero-card-scroll {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-50%, 0, 0);
          }
        }

        @keyframes hero-stitch-flow {
          to {
            stroke-dashoffset: -260;
          }
        }

        @keyframes hero-float {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -16px, 0);
          }
        }

        .hero-ticker-track {
          display: inline-block;
          min-width: max-content;
          animation: hero-ticker 34s linear infinite;
        }

        .hero-card-track {
          animation: hero-card-scroll 24s linear infinite;
        }

        .hero-card-marquee:hover .hero-card-track {
          animation-play-state: paused;
        }

        .hero-stitch-dash {
          stroke-dasharray: 14 12;
          animation: hero-stitch-flow 14s linear infinite;
        }

        .hero-float {
          animation: hero-float 7s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-ticker-track,
          .hero-card-track,
          .hero-stitch-dash,
          .hero-float {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}

function DesktopProductionVisual() {
  return (
    <>
      <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-blue-500/20 blur-3xl" />

      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white/75 p-4 shadow-2xl shadow-slate-950/10 backdrop-blur-xl dark:border-white/[0.1] dark:bg-white/[0.055] dark:shadow-black/30">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-300">
              Live Production
            </p>
            <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950 dark:text-white">
              From artwork to stitch file
            </h3>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-indigo-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-indigo-300">
            <Layers3 className="h-5 w-5" />
          </div>
        </div>

        <div className="relative h-[340px] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-950 dark:border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(99,102,241,0.42),transparent_30%),radial-gradient(circle_at_78%_68%,rgba(168,85,247,0.25),transparent_32%)]" />

          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:34px_34px] opacity-35" />

          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 520 340"
            fill="none"
          >
            <path
              className="hero-stitch-dash"
              d="M54 214 C96 82 190 270 252 144 C325 -2 398 244 466 98"
              stroke="url(#heroThread)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M128 230 L154 104 L250 212 L326 92 L398 230"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1.5"
            />
            <circle cx="128" cy="230" r="6" fill="#818cf8" />
            <circle cx="154" cy="104" r="6" fill="#a78bfa" />
            <circle cx="250" cy="212" r="6" fill="#60a5fa" />
            <circle cx="326" cy="92" r="6" fill="#c084fc" />
            <circle cx="398" cy="230" r="6" fill="#818cf8" />

            <defs>
              <linearGradient
                id="heroThread"
                x1="54"
                y1="0"
                x2="466"
                y2="340"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#818cf8" />
                <stop offset="0.5" stopColor="#c084fc" />
                <stop offset="1" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute left-5 top-5 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white shadow-xl backdrop-blur-md">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/50">
              Source
            </p>
            <p className="mt-1 text-sm font-bold">Rough Logo.png</p>
          </div>

          <div className="absolute bottom-5 right-5 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white shadow-xl backdrop-blur-md">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/50">
              Output
            </p>
            <p className="mt-1 text-sm font-bold">DST · PES · PDF Proof</p>
          </div>

          <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[2rem] border border-white/15 bg-white/10 shadow-2xl backdrop-blur-md">
            <MousePointer2 className="h-9 w-9 text-white" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.045]">
            <BadgeCheck className="mb-2 h-5 w-5 text-indigo-600 dark:text-indigo-300" />
            <p className="text-sm font-bold text-slate-950 dark:text-white">
              Proof-first flow
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-white/45">
              JPG/PNG approval before final files.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.045]">
            <Sparkles className="mb-2 h-5 w-5 text-violet-600 dark:text-violet-300" />
            <p className="text-sm font-bold text-slate-950 dark:text-white">
              Clean production
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-white/45">
              Better trims, fills, and stitch paths.
            </p>
          </div>
        </div>
      </div>

      <div className="hero-card-marquee pointer-events-none absolute -bottom-8 left-1/2 hidden w-[680px] -translate-x-1/2 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] xl:block">
        <div className="hero-card-track flex w-max gap-3">
          {[...floatingCards, ...floatingCards].map((card, index) => (
            <div
              key={`${card.title}-${index}`}
              className="flex w-48 shrink-0 items-center gap-3 rounded-2xl border border-white/15 bg-slate-950/75 p-3 text-white shadow-xl backdrop-blur-xl"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg">
                {card.icon}
              </div>
              <div>
                <p className="text-xs font-black">{card.title}</p>
                <p className="mt-0.5 text-[10px] text-white/45">
                  {card.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function HeroBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.18),transparent_32%),radial-gradient(circle_at_80%_15%,rgba(168,85,247,0.16),transparent_30%),radial-gradient(circle_at_50%_90%,rgba(59,130,246,0.12),transparent_36%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.22),transparent_32%),radial-gradient(circle_at_80%_15%,rgba(168,85,247,0.18),transparent_30%),radial-gradient(circle_at_50%_90%,rgba(59,130,246,0.12),transparent_36%)]" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.07)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_42%,black,transparent_78%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.055)_1px,transparent_1px)]" />

      <HeroSvgBackground />
    </>
  );
}

function HeroSvgBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
    >
      <svg
        className="hero-float absolute -left-28 top-24 hidden h-72 w-[46rem] opacity-55 dark:opacity-40 md:block"
        viewBox="0 0 720 280"
        fill="none"
      >
        <path
          d="M24 170 C128 42 218 250 340 126 C462 2 548 220 696 88"
          stroke="url(#bgThreadOne)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          className="hero-stitch-dash"
          d="M24 170 C128 42 218 250 340 126 C462 2 548 220 696 88"
          stroke="rgba(99,102,241,0.45)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient
            id="bgThreadOne"
            x1="24"
            y1="0"
            x2="696"
            y2="280"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#6366f1" />
            <stop offset="0.5" stopColor="#a855f7" />
            <stop offset="1" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
      </svg>

      <svg
        className="absolute right-[-5rem] top-20 hidden h-80 w-80 opacity-45 dark:opacity-30 md:block"
        viewBox="0 0 320 320"
        fill="none"
      >
        <path
          d="M58 212 C82 78 196 62 246 122 C284 168 220 246 132 230"
          stroke="rgba(99,102,241,0.35)"
          strokeWidth="1.5"
        />
        <circle cx="58" cy="212" r="6" fill="#6366f1" />
        <circle cx="132" cy="230" r="6" fill="#60a5fa" />
        <circle cx="246" cy="122" r="6" fill="#a855f7" />
        <path
          d="M58 212 L34 232 M58 212 L82 192 M132 230 L108 252 M132 230 L158 208 M246 122 L270 100 M246 122 L224 144"
          stroke="rgba(15,23,42,0.28)"
          strokeWidth="1"
          className="dark:stroke-white/25"
        />
      </svg>

      <svg
        className="absolute bottom-20 left-8 hidden h-56 w-56 rotate-[-10deg] opacity-40 dark:opacity-25 lg:block"
        viewBox="0 0 240 240"
        fill="none"
      >
        <path
          d="M120 22 L185 48 L214 114 L191 183 L120 218 L49 183 L26 114 L55 48 Z"
          stroke="rgba(245,158,11,0.45)"
          strokeWidth="2"
        />
        <path
          className="hero-stitch-dash"
          d="M120 39 L173 60 L197 115 L178 171 L120 200 L62 171 L43 115 L67 60 Z"
          stroke="rgba(245,158,11,0.55)"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}