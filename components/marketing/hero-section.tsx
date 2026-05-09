"use client";

import * as React from "react";
import Image from "next/image";
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
  "Bulk Orders, Bigger Savings",
  "Free First Order",
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

const portfolioSlides = [
  {
    src: "/images/After-1.png",
    title: "Jacket Front Digitizing",
    label: "Clean stitch proof",
    href: "/portfolio",
  },
  {
    src: "/images/After-2.png",
    title: "Vector Conversion",
    label: "Sharp output",
    href: "/portfolio",
  },
  {
    src: "/images/After-3.png",
    title: "Cap & jacket Back Digitizing",
    label: "Production-ready files",
    href: "/portfolio",
  },
  {
    src: "/images/After-4.png",
    title: "Patch Artwork",
    label: "Place it on anything",
    href: "/portfolio",
  },
];

export function HeroSection() {
  const prefersReduced = useReducedMotion();

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-[#f7f7fb] text-slate-950 dark:bg-[#050814] dark:text-white">
      <HeroBackground />

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-start px-4 pb-24 pt-[7.35rem] sm:pb-28 sm:pt-32 md:px-8 md:pb-32 md:pt-36 lg:justify-center lg:pb-32 lg:pt-40">
        {/* MOBILE SERVICE SLIDER */}
        <motion.div
          initial={prefersReduced ? {} : { opacity: 0, y: 16 }}
          animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease }}
          className="mb-5 block lg:hidden"
        >
          <MobileServiceSlider />
        </motion.div>

        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          {/* LEFT CONTENT */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={prefersReduced ? {} : { opacity: 0, y: 18 }}
              animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08, ease }}
              className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-white/70 px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.18em] text-indigo-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06] dark:text-indigo-200 sm:tracking-[0.28em] md:mb-7 md:px-4 md:py-2 md:text-[10px] lg:mx-0"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.9)]" />
              <Sparkles className="h-3 w-3 opacity-70" />
              Premium Embroidery Digitizing
            </motion.div>

            <motion.h1
              initial={prefersReduced ? {} : { opacity: 0, y: 24 }}
              animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.12, ease }}
              className="mx-auto max-w-4xl text-[2.18rem] font-black leading-[1.02] tracking-[-0.055em] text-slate-950 dark:text-white sm:text-5xl md:text-6xl lg:mx-0 lg:text-[4.65rem] lg:leading-[0.98]"
            >
              Digitizing that looks{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 bg-clip-text text-transparent dark:from-indigo-300 dark:via-violet-300 dark:to-blue-300">
                ready before it stitches.
              </span>
            </motion.h1>

            <motion.p
              initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
              animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2, ease }}
              className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-white/58 md:text-base lg:mx-0"
            >
              Embroidery digitizing, clean vector redraws, custom patches, and
              print-ready artwork delivered with sharp stitch quality, fast
              turnaround, and a full revision path.
            </motion.p>

            {/* BUTTONS */}
            <motion.div
              initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
              animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.28, ease }}
              className="mt-5 flex flex-col items-center gap-3 lg:items-start"
            >
              <div className="mx-auto flex w-full max-w-[360px] flex-row items-center justify-center gap-2 sm:max-w-none sm:flex-wrap lg:mx-0 lg:justify-start">
                <Button
                  asChild
                  variant="premium"
                  shape="pill"
                  size="sm"
                  className="h-10 min-w-0 flex-1 px-3 text-[11px] font-bold shadow-xl shadow-indigo-500/20 sm:h-11 sm:flex-none sm:px-5 sm:text-sm"
                >
                  <Link href="/contact">
                    <span className="sm:hidden">New Quote</span>
                    <span className="hidden sm:inline">Get a free quote</span>
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  shape="pill"
                  size="sm"
                  className="h-10 min-w-0 flex-1 border-slate-300 bg-white/60 px-3 text-[11px] font-bold text-slate-900 backdrop-blur hover:bg-white dark:border-white/15 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1] sm:h-11 sm:flex-none sm:px-5 sm:text-sm"
                >
                  <Link href="/orders">
                    <span className="sm:hidden">Order Now</span>
                    <span className="hidden sm:inline">Place Direct Order</span>
                  </Link>
                </Button>

                <Button
                asChild
                variant="ghost"
                shape="pill"
                size="sm"
                className="h-10 min-w-0 flex-1 border border-slate-300 bg-white/30 px-3 text-[11px] font-bold text-slate-800 backdrop-blur hover:bg-white/70 dark:border-white/15 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.1] sm:h-11 sm:flex-none sm:px-5 sm:text-sm"
              >
                <Link href="/login">
                  <span className="sm:hidden">Login/Signup</span>
                  <span className="hidden sm:inline">Client portal</span>
                </Link>
              </Button>
              </div>

              <p className="text-[10px] tracking-wide text-slate-500 dark:text-white/35 sm:text-[11px]">
                Free first file · No credit card required · 24-hr turnaround
              </p>
            </motion.div>

            {/* STATS */}
            <motion.div
              initial={prefersReduced ? {} : { opacity: 0, y: 16 }}
              animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.4, ease }}
              className="mx-auto mt-5 grid w-full max-w-[340px] grid-cols-3 overflow-hidden rounded-2xl border border-slate-200 bg-white/70 shadow-lg shadow-slate-950/5 backdrop-blur divide-x divide-slate-200 dark:border-white/[0.1] dark:bg-white/[0.055] dark:divide-white/[0.08] sm:max-w-md lg:mx-0 lg:w-fit"
            >
              {stats.map(({ value, label }) => (
                <div
                  key={label}
                  className="min-w-0 px-2 py-2.5 text-center sm:px-7 sm:py-4"
                >
                  <div className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-base font-black tracking-tight text-transparent dark:from-indigo-300 dark:to-violet-300 sm:text-2xl">
                    {value}
                  </div>
                  <div className="mt-0.5 text-[7.5px] font-semibold text-slate-500 dark:text-white/45 sm:text-[11px]">
                    {label}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* MOBILE PORTFOLIO PREVIEW BELOW STATS */}
            <motion.div
              initial={prefersReduced ? {} : { opacity: 0, y: 18 }}
              animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.48, ease }}
              className="mx-auto mt-5 block w-full max-w-[460px] lg:hidden"
            >
              <MobilePortfolioPreview prefersReduced={Boolean(prefersReduced)} />
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
<div className="fixed bottom-0 left-0 right-0 z-[60] overflow-hidden whitespace-nowrap border-t border-slate-200 bg-white/80 py-3.5 shadow-[0_-20px_60px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-white/[0.07] dark:bg-[#07111f]/85 md:absolute md:z-20 md:py-4">
  <div className="hero-ticker-track">
    {[...tickerItems, ...tickerItems].map((item, index) => (
      <span
        key={`${item}-${index}`}
        className="inline-flex shrink-0 items-center whitespace-nowrap px-6 text-sm font-black italic uppercase tracking-wide text-indigo-700 dark:text-indigo-300 sm:text-base md:px-10 md:text-xl"
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

        @keyframes hero-mobile-service-scroll {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-33.333%, 0, 0);
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

        @keyframes hero-mobile-thread-flow {
          to {
            stroke-dashoffset: -260;
          }
        }

        @keyframes hero-mobile-thread-flow-reverse {
          to {
            stroke-dashoffset: 260;
          }
        }

        @keyframes hero-mobile-thread-float {
          0%,
          100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(14px, -10px, 0) rotate(1deg);
          }
        }

        @keyframes hero-mobile-thread-float-reverse {
          0%,
          100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(-14px, 10px, 0) rotate(-1deg);
          }
        }

        @keyframes hero-mobile-node-pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.45;
          }
          50% {
            transform: scale(1.55);
            opacity: 0.95;
          }
        }

        .hero-ticker-track {
          display: inline-block;
          min-width: max-content;
          animation: hero-ticker 22s linear infinite;
        }

        .hero-card-track {
          animation: hero-card-scroll 24s linear infinite;
        }

        .hero-card-marquee:hover .hero-card-track {
          animation-play-state: paused;
        }

        .hero-mobile-service-track {
          display: flex;
          width: max-content;
          animation: hero-mobile-service-scroll 18s linear infinite;
          will-change: transform;
        }

        .hero-mobile-service-slider:hover .hero-mobile-service-track {
          animation-play-state: paused;
        }

        .hero-stitch-dash {
          stroke-dasharray: 14 12;
          animation: hero-stitch-flow 14s linear infinite;
        }

        .hero-float {
          animation: hero-float 7s ease-in-out infinite;
        }

        .hero-mobile-thread-dash {
          stroke-dasharray: 10 12;
          animation: hero-mobile-thread-flow 14s linear infinite;
        }

        .hero-mobile-thread-dash-slow {
          stroke-dasharray: 4 10;
          animation: hero-mobile-thread-flow 18s linear infinite;
        }

        .hero-mobile-thread-dash-reverse {
          stroke-dasharray: 10 12;
          animation: hero-mobile-thread-flow-reverse 16s linear infinite;
        }

        .hero-mobile-thread-float {
          animation: hero-mobile-thread-float 7s ease-in-out infinite;
        }

        .hero-mobile-thread-float-reverse {
          animation: hero-mobile-thread-float-reverse 8s ease-in-out infinite;
        }

        .hero-mobile-node-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: hero-mobile-node-pulse 3.2s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-ticker-track,
          .hero-card-track,
          .hero-mobile-service-track,
          .hero-stitch-dash,
          .hero-float,
          .hero-mobile-thread-dash,
          .hero-mobile-thread-dash-slow,
          .hero-mobile-thread-dash-reverse,
          .hero-mobile-thread-float,
          .hero-mobile-thread-float-reverse,
          .hero-mobile-node-pulse {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}

function MobilePortfolioPreview({
  prefersReduced,
}: {
  prefersReduced: boolean;
}) {
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    if (prefersReduced || portfolioSlides.length <= 1) return;

    const interval = window.setInterval(() => {
      setActive((current) => (current + 1) % portfolioSlides.length);
    }, 2600);

    return () => window.clearInterval(interval);
  }, [prefersReduced]);

  const slide = portfolioSlides[active];

  return (
    <Link href={slide.href || "/portfolio"} className="group block">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] p-2.5 shadow-2xl shadow-black/25 backdrop-blur-xl transition duration-300 group-active:scale-[0.98]">
        <div className="relative h-[235px] overflow-hidden rounded-[1.65rem] border border-white/10 bg-slate-950 sm:h-[270px]">
          <motion.div
            key={slide.src}
            initial={prefersReduced ? {} : { opacity: 0, scale: 1.08, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="absolute inset-0"
          >
            <Image
              src={slide.src}
              alt={slide.title}
              fill
              priority={active === 0}
              className="object-cover object-center"
              sizes="(max-width: 640px) calc(100vw - 32px), 460px"
            />
          </motion.div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/5" />

          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
            <div className="min-w-0 text-left">
              <p className="truncate text-lg font-black leading-tight text-white">
                {slide.title}
              </p>
              <p className="mt-1 truncate text-xs font-bold text-white/58">
                {slide.label}
              </p>
            </div>

            <div className="flex shrink-0 gap-1">
              {portfolioSlides.map((item, index) => (
                <span
                  key={item.src}
                  className={[
                    "h-1.5 rounded-full transition-all duration-300",
                    active === index ? "w-6 bg-white" : "w-1.5 bg-white/35",
                  ].join(" ")}
                />
              ))}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 h-1 w-full bg-white/15">
            <motion.div
              key={active}
              initial={prefersReduced ? { width: "100%" } : { width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.6, ease: "linear" }}
              className="h-full bg-white"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

function MobileServiceSlider() {
  const sliderItems = [...floatingCards, ...floatingCards, ...floatingCards];

  return (
    <div className="hero-mobile-service-slider -mx-4 overflow-hidden px-4 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <div className="hero-mobile-service-track flex w-max gap-2.5">
        {sliderItems.map((card, index) => (
          <div
            key={`${card.title}-${index}`}
            className="flex w-52 shrink-0 items-center gap-3 rounded-[1.45rem] border border-slate-200 bg-white/70 p-3 text-left shadow-lg shadow-slate-950/5 backdrop-blur-xl dark:border-white/[0.1] dark:bg-white/[0.055] dark:shadow-black/20"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-base dark:border-white/10 dark:bg-white/[0.06]">
              {card.icon}
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs font-black text-slate-950 dark:text-white">
                {card.title}
              </p>
              <p className="mt-0.5 truncate text-[11px] font-bold text-slate-500 dark:text-white/42">
                {card.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
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

      <MobileHeroThreads />
      <HeroSvgBackground />
    </>
  );
}

function MobileHeroThreads() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[2] overflow-hidden md:hidden"
    >
      <div className="absolute inset-0 opacity-45 [background-image:radial-gradient(rgba(79,70,229,0.24)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_28%,black,transparent_72%)] dark:opacity-35 dark:[background-image:radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)]" />

      <svg
        className="hero-mobile-thread-float absolute -left-24 top-[5.5rem] h-44 w-[42rem] opacity-65 dark:opacity-45"
        viewBox="0 0 680 180"
        fill="none"
      >
        <path
          d="M20 98 C92 28 168 154 252 82 C340 6 420 148 512 66 C570 16 628 42 662 72"
          stroke="url(#mobileHeroThreadOne)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        <path
          className="hero-mobile-thread-dash"
          d="M20 98 C92 28 168 154 252 82 C340 6 420 148 512 66 C570 16 628 42 662 72"
          stroke="rgba(99,102,241,0.7)"
          strokeWidth="1.1"
          strokeLinecap="round"
        />

        <circle
          className="hero-mobile-node-pulse"
          cx="92"
          cy="28"
          r="4"
          fill="#6366f1"
        />
        <circle
          className="hero-mobile-node-pulse"
          cx="252"
          cy="82"
          r="4"
          fill="#38bdf8"
          style={{ animationDelay: "0.45s" }}
        />
        <circle
          className="hero-mobile-node-pulse"
          cx="512"
          cy="66"
          r="4"
          fill="#a855f7"
          style={{ animationDelay: "0.9s" }}
        />

        <defs>
          <linearGradient
            id="mobileHeroThreadOne"
            x1="20"
            y1="0"
            x2="662"
            y2="180"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#6366f1" />
            <stop offset="0.5" stopColor="#a855f7" />
            <stop offset="1" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
      </svg>

      <svg
        className="absolute -right-28 top-[16rem] h-56 w-[34rem] rotate-[-8deg] opacity-45 dark:opacity-30"
        viewBox="0 0 540 220"
        fill="none"
      >
        <path
          className="hero-mobile-thread-dash-slow"
          d="M34 142 C92 42 184 198 260 96 C342 -12 438 158 506 54"
          stroke="rgba(245,158,11,0.58)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />

        <path
          d="M80 158 L110 108 M188 178 L220 130 M342 122 L376 76 M454 92 L488 48"
          stroke="rgba(15,23,42,0.22)"
          strokeWidth="1"
          className="dark:stroke-white/20"
        />
      </svg>

      <svg
        className="hero-mobile-thread-float-reverse absolute -left-36 bottom-20 h-48 w-[46rem] opacity-40 dark:opacity-28"
        viewBox="0 0 720 200"
        fill="none"
      >
        <path
          d="M24 118 C108 188 198 42 296 126 C394 210 482 44 584 120 C642 164 686 130 712 104"
          stroke="url(#mobileHeroThreadTwo)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        <path
          className="hero-mobile-thread-dash-reverse"
          d="M24 118 C108 188 198 42 296 126 C394 210 482 44 584 120 C642 164 686 130 712 104"
          stroke="rgba(56,189,248,0.58)"
          strokeWidth="1.1"
          strokeLinecap="round"
        />

        <defs>
          <linearGradient
            id="mobileHeroThreadTwo"
            x1="24"
            y1="0"
            x2="712"
            y2="200"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#38bdf8" />
            <stop offset="0.5" stopColor="#6366f1" />
            <stop offset="1" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>
    </div>
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