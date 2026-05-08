"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";

import { EmbroideryHoop } from "./embroidery-hoop";

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const callouts = [
  {
    label: "Satin stitch",
    desc: "Clean columns for letters, borders, outlines, and detail shapes.",
  },
  {
    label: "Fill & underlay",
    desc: "Balanced density and underlay for polos, caps, jackets, and patches.",
  },
  {
    label: "Run stitch routing",
    desc: "Optimized pathing reduces trims, thread jumps, and production time.",
  },
];

const images = [
  { real: "/digitizing/Before-1.png", digital: "/digitizing/After-1.png" },
  { real: "/digitizing/Before-2.png", digital: "/digitizing/After-2.png" },
  { real: "/digitizing/Before-3.png", digital: "/digitizing/After-3.png" },
  { real: "/digitizing/Before-4.png", digital: "/digitizing/After-4.png" },
  { real: "/digitizing/Before-5.png", digital: "/digitizing/After-5.png" },
  { real: "/digitizing/Before-6.png", digital: "/digitizing/After-6.png" },
] as const;

const trustItems = [
  "Machine-ready stitch paths",
  "Before / after proofing",
  "Clean trims & routing",
  "Commercial embroidery flow",
];

export function StitchTransformSection() {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const prefersReduced = useReducedMotion();

  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [mobileView, setMobileView] = React.useState<"before" | "after">(
    "after",
  );

  const activeImage = images[activeIndex];

  React.useEffect(() => {
    if (prefersReduced || isPaused) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, 3800);

    return () => window.clearInterval(interval);
  }, [prefersReduced, isPaused]);

  return (
    <section
      ref={ref}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative isolate overflow-hidden bg-[#f7f7fb] px-4 py-16 text-slate-950 dark:bg-[#050814] dark:text-white md:px-8 md:py-24 lg:py-28"
    >
      <SectionBackground />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-indigo-500/25 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px bg-gradient-to-r from-transparent via-violet-500/25 to-transparent" />

      <div className="page-shell relative z-10">
        {/* Header */}
        <motion.div
          initial={prefersReduced ? {} : { opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease }}
          className="mx-auto mb-10 max-w-4xl text-center md:mb-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-white/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-indigo-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06] dark:text-indigo-200 sm:tracking-[0.28em]">
            <Sparkles className="h-3.5 w-3.5" />
            Stitch by stitch
          </div>

          <h2 className="mt-5 text-3xl font-black tracking-[-0.055em] text-slate-950 dark:text-white md:text-5xl lg:text-6xl">
            Your artwork, built to run on a{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 bg-clip-text text-transparent dark:from-indigo-300 dark:via-violet-300 dark:to-blue-300">
              real machine.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-600 dark:text-white/58 md:text-base">
            Digitizing is not just tracing. Every file is built with correct
            underlay, optimized stitch density, clean routing, and production
            logic for commercial embroidery machines.
          </p>

          <div className="mx-auto mt-7 flex max-w-4xl flex-wrap justify-center gap-2">
            {trustItems.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[10px] font-bold text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.05] dark:text-white/55 sm:text-[11px]"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-300" />
                {item}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Phone layout */}
        <div className="mx-auto grid w-full max-w-md gap-5 md:hidden">
          <motion.div
            initial={prefersReduced ? {} : { opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, ease }}
          >
            <MobilePreview
              activeImage={activeImage}
              activeIndex={activeIndex}
              mobileView={mobileView}
              setMobileView={setMobileView}
              setActiveIndex={setActiveIndex}
            />
          </motion.div>

          <DetailsPanel compact />

          <CalloutCards
            inView={inView}
            prefersReduced={Boolean(prefersReduced)}
          />
        </div>

        {/* Desktop / tablet layout */}
        <div className="hidden items-start gap-8 md:grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <motion.div
            initial={prefersReduced ? {} : { opacity: 0, x: -32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, ease }}
            className="relative"
          >
            <DesktopPreview
              activeImage={activeImage}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
              prefersReduced={Boolean(prefersReduced)}
            />
          </motion.div>

          <motion.div
            initial={prefersReduced ? {} : { opacity: 0, x: 28 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease }}
            className="flex flex-col gap-5"
          >
            <DetailsPanel />

            <CalloutCards
              inView={inView}
              prefersReduced={Boolean(prefersReduced)}
            />
          </motion.div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes stitch-transform-flow {
          to {
            stroke-dashoffset: -260;
          }
        }

        @keyframes stitch-transform-flow-delayed {
          to {
            stroke-dashoffset: 260;
          }
        }

        .stitch-transform-dash {
          stroke-dasharray: 12 14;
          animation: stitch-transform-flow 15s linear infinite;
        }

        .stitch-transform-dash-delayed {
          stroke-dasharray: 8 16;
          animation: stitch-transform-flow-delayed 18s linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .stitch-transform-dash,
          .stitch-transform-dash-delayed {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}

function MobilePreview({
  activeImage,
  activeIndex,
  mobileView,
  setMobileView,
  setActiveIndex,
}: {
  activeImage: (typeof images)[number];
  activeIndex: number;
  mobileView: "before" | "after";
  setMobileView: React.Dispatch<React.SetStateAction<"before" | "after">>;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
}) {
  return (
    <div className="mx-auto w-full overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white/80 p-3 shadow-xl shadow-slate-950/10 backdrop-blur-xl dark:border-white/[0.1] dark:bg-white/[0.055] dark:shadow-black/30">
      <div className="mb-3 grid gap-3 px-1">
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-300">
            Preview
          </p>
          <h3 className="mt-1 text-lg font-black tracking-tight text-slate-950 dark:text-white">
            Before / After
          </h3>
        </div>

        <div className="mx-auto flex rounded-full border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-white/[0.06]">
          {(["before", "after"] as const).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setMobileView(view)}
              className={[
                "rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] transition",
                mobileView === view
                  ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                  : "text-slate-500 dark:text-white/45",
              ].join(" ")}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-[280px] overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950 sm:h-[380px]">
        <Image
          key={`${activeIndex}-${mobileView}`}
          src={mobileView === "before" ? activeImage.real : activeImage.digital}
          alt={`${mobileView} stitch preview ${activeIndex + 1}`}
          fill
          className="object-contain p-2"
          sizes="(max-width: 640px) calc(100vw - 32px), 380px"
          priority={activeIndex === 0}
        />

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-center">
          <span className="inline-flex rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-950">
            {mobileView === "before" ? "Original artwork" : "Digitized output"}
          </span>
        </div>
      </div>

      <ThumbnailRow
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        mobile
      />
    </div>
  );
}

function DesktopPreview({
  activeImage,
  activeIndex,
  setActiveIndex,
  prefersReduced,
}: {
  activeImage: (typeof images)[number];
  activeIndex: number;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
  prefersReduced: boolean;
}) {
  return (
    <>
      <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-blue-500/20 blur-3xl" />

      <div className="relative rounded-[2rem] border border-slate-200 bg-white/75 p-4 shadow-2xl shadow-slate-950/10 backdrop-blur-xl dark:border-white/[0.1] dark:bg-white/[0.055] dark:shadow-black/30">
        <div className="mb-4 flex items-center justify-between gap-4 px-1">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-indigo-600 dark:text-indigo-300">
              Before / After
            </p>
            <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950 dark:text-white">
              Artwork to stitch preview
            </h3>
          </div>

          <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/45">
            Auto running
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[76px_1fr]">
          <ThumbnailRow
            activeIndex={activeIndex}
            setActiveIndex={setActiveIndex}
          />

          <div className="order-1 min-h-[420px] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-950/95 p-3 dark:border-white/10 lg:order-2 lg:min-h-[520px]">
            <motion.div
              key={activeIndex}
              initial={prefersReduced ? {} : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease }}
              className="h-full"
            >
              <EmbroideryHoop
                realSrc={activeImage.real}
                digitalSrc={activeImage.digital}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}

function ThumbnailRow({
  activeIndex,
  setActiveIndex,
  mobile = false,
}: {
  activeIndex: number;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
  mobile?: boolean;
}) {
  return (
    <div
      className={[
        mobile
          ? "mx-auto mt-3 flex max-w-full justify-start gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "order-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:order-1 lg:flex-col lg:overflow-visible lg:pb-0",
      ].join(" ")}
    >
      {images.map((img, index) => {
        const isActive = activeIndex === index;

        return (
          <button
            key={img.real}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`View stitch transformation ${index + 1}`}
            aria-pressed={isActive}
            className={[
              "relative shrink-0 overflow-hidden rounded-2xl border transition-all duration-300",
              mobile ? "h-12 w-12" : "h-16 w-16 lg:h-[72px] lg:w-[72px]",
              isActive
                ? "scale-105 border-indigo-500 shadow-lg shadow-indigo-500/20"
                : "border-slate-200 opacity-60 hover:scale-105 hover:opacity-100 dark:border-white/10",
            ].join(" ")}
          >
            <Image
              src={img.real}
              alt={`Preview ${index + 1}`}
              fill
              className="object-cover"
              sizes={mobile ? "48px" : "72px"}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-1.5 py-0.5 text-[8px] font-bold text-white">
              {index + 1}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function DetailsPanel({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={[
        "rounded-[1.75rem] border border-slate-200 bg-white/75 shadow-sm shadow-slate-950/5 backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.045] dark:shadow-black/20",
        compact ? "p-5" : "p-6",
      ].join(" ")}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-300">
        Production logic
      </p>

      <h3 className="mt-3 text-xl font-black tracking-tight text-slate-950 dark:text-white md:text-2xl">
        Built for clean stitches, fewer trims, and smoother runs.
      </h3>

      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-white/52">
        Each design is planned for fabric behavior, stitch type, direction,
        density, and machine movement — not only how the artwork looks on
        screen.
      </p>
    </div>
  );
}

function CalloutCards({
  inView,
  prefersReduced,
}: {
  inView: boolean;
  prefersReduced: boolean;
}) {
  return (
    <div className="grid gap-3">
      {callouts.map(({ label, desc }, index) => (
        <motion.div
          key={label}
          className="group rounded-[1.5rem] border border-slate-200 bg-white/75 p-4 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-950/5 dark:border-white/[0.08] dark:bg-white/[0.045] dark:hover:border-white/[0.16] dark:hover:shadow-black/20"
          initial={prefersReduced ? {} : { opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{
            duration: 0.35,
            delay: 0.2 + index * 0.08,
            ease,
          }}
        >
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.06]">
              <CheckCircle2 className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
            </div>

            <div>
              <div className="text-sm font-black text-slate-950 dark:text-white">
                {label}
              </div>
              <div className="mt-1 text-xs leading-6 text-slate-500 dark:text-white/48">
                {desc}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function SectionBackground() {
  return (
    <>
      <div className="absolute inset-0 -z-30 bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.14),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.12),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.1),transparent_38%)]" />

      <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,rgba(15,23,42,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.055)_1px,transparent_1px)] bg-[size:42px_42px] [mask-image:radial-gradient(ellipse_75%_70%_at_50%_45%,black,transparent_78%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)]" />

      <ThreadLines position="top" />
      <ThreadLines position="bottom" />
    </>
  );
}

function ThreadLines({ position }: { position: "top" | "bottom" }) {
  const isBottom = position === "bottom";
  const gradientId = isBottom ? "threadGoldBlueBottom" : "threadGoldBlueTop";

  return (
    <svg
      viewBox="0 0 1200 120"
      className={[
        "pointer-events-none absolute inset-x-0 hidden h-28 w-full opacity-60 dark:opacity-40 md:block",
        isBottom ? "bottom-0 rotate-180" : "top-0",
      ].join(" ")}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0 42 C120 8 210 92 335 42 C470 -12 555 112 702 48 C835 -8 950 74 1200 32"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M0 42 C120 8 210 92 335 42 C470 -12 555 112 702 48 C835 -8 950 74 1200 32"
        fill="none"
        stroke="rgba(99,102,241,0.55)"
        strokeWidth="1.2"
        strokeLinecap="round"
        className="stitch-transform-dash"
      />

      <path
        d="M0 78 C150 112 244 20 390 74 C540 132 650 22 790 76 C930 130 1040 56 1200 84"
        fill="none"
        stroke="rgba(196,149,42,0.55)"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="stitch-transform-dash-delayed"
      />

      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2="1200"
          y2="120"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#c4952a" />
          <stop offset="0.45" stopColor="#6366f1" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
    </svg>
  );
}