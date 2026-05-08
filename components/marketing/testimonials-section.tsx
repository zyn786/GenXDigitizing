"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Quote,
  Sparkles,
  Star,
} from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const PLACEHOLDER_TESTIMONIALS = [
  {
    quote:
      "Files ran smoothly on first load. No callbacks, no machine errors, and the stitch path looked clean.",
    name: "Sample Decorator",
    company: "Embroidery Shop",
    initials: "SD",
    color:
      "bg-indigo-500/10 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300",
    glow: "from-indigo-500/20 to-blue-500/10",
  },
  {
    quote:
      "The proof-first workflow made approval easier. We could review the artwork clearly before final files.",
    name: "Sample Print Shop",
    company: "Promo Apparel",
    initials: "SP",
    color:
      "bg-violet-500/10 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300",
    glow: "from-violet-500/20 to-fuchsia-500/10",
  },
  {
    quote:
      "Fast turnaround, clean communication, and production-ready files in the formats we needed.",
    name: "Sample Brand Team",
    company: "Custom Apparel",
    initials: "SB",
    color:
      "bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
    glow: "from-amber-500/20 to-orange-500/10",
  },
];

const trustPoints = [
  "Proof-first approval",
  "DST / PES delivery",
  "Revision-friendly process",
  "Production-ready output",
];

export function TestimonialsSection() {
  const prefersReduced = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden bg-[#f7f7fb] px-4 py-16 text-slate-950 dark:bg-[#050814] dark:text-white md:px-8 md:py-24 lg:py-28">
      <TestimonialsBackground />

      <div className="page-shell relative z-10">
        {/* Header */}
        <motion.div
          initial={prefersReduced ? {} : { opacity: 0, y: 24 }}
          whileInView={prefersReduced ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease }}
          className="mx-auto mb-10 max-w-4xl text-center md:mb-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-white/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-indigo-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06] dark:text-indigo-200">
            <Sparkles className="h-3.5 w-3.5" />
            Client stories
          </div>

          <h2 className="mt-5 text-3xl font-black tracking-[-0.055em] text-slate-950 dark:text-white md:text-5xl lg:text-6xl">
            Trusted workflow for decorators and{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 bg-clip-text text-transparent dark:from-indigo-300 dark:via-violet-300 dark:to-blue-300">
              print shops.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-600 dark:text-white/58 md:text-base">
            A proof-first process built around clean communication, fast
            turnaround, and machine-ready embroidery files.
          </p>

          <div className="mx-auto mt-7 flex max-w-4xl flex-wrap justify-center gap-2">
            {trustPoints.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.05] dark:text-white/55"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-300" />
                {item}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Phone horizontal scroll */}
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden">
          {PLACEHOLDER_TESTIMONIALS.map((item, index) => (
            <TestimonialCard
              key={item.name}
              item={item}
              index={index}
              prefersReduced={Boolean(prefersReduced)}
              className="w-[84vw] shrink-0 snap-center"
            />
          ))}
        </div>

        {/* Desktop grid */}
        <div className="hidden gap-5 md:grid md:grid-cols-3">
          {PLACEHOLDER_TESTIMONIALS.map((item, index) => (
            <TestimonialCard
              key={item.name}
              item={item}
              index={index}
              prefersReduced={Boolean(prefersReduced)}
            />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={prefersReduced ? {} : { opacity: 0, y: 16 }}
          whileInView={prefersReduced ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, delay: 0.18, ease }}
          className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"
        >
          <Link
            href="/portfolio"
            className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-white/90"
          >
            See before &amp; after work
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>

          <Link
            href="/orders"
            className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-slate-300 bg-white/70 px-5 py-3 text-sm font-bold text-slate-800 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]"
          >
            Start an order
          </Link>
        </motion.div>

        <p className="mx-auto mt-5 max-w-2xl text-center text-xs leading-6 text-slate-500 dark:text-white/35">
          Preview testimonial copy shown here should be replaced with real client
          reviews before public launch.
        </p>
      </div>

      <style jsx global>{`
        @keyframes testimonial-thread-flow {
          to {
            stroke-dashoffset: -260;
          }
        }

        @keyframes testimonial-thread-float {
          0%,
          100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(18px, -12px, 0) rotate(1deg);
          }
        }

        .testimonial-thread-dash {
          stroke-dasharray: 12 14;
          animation: testimonial-thread-flow 16s linear infinite;
        }

        .testimonial-thread-float {
          animation: testimonial-thread-float 8s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .testimonial-thread-dash,
          .testimonial-thread-float {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}

function TestimonialCard({
  item,
  index,
  prefersReduced,
  className = "",
}: {
  item: (typeof PLACEHOLDER_TESTIMONIALS)[number];
  index: number;
  prefersReduced: boolean;
  className?: string;
}) {
  return (
    <motion.article
      initial={prefersReduced ? {} : { opacity: 0, y: 24 }}
      whileInView={prefersReduced ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.42, delay: index * 0.08, ease }}
      className={`group relative ${className}`}
    >
      <div
        className={`pointer-events-none absolute -inset-1 rounded-[2.15rem] bg-gradient-to-br opacity-0 blur-xl transition duration-500 group-hover:opacity-100 ${item.glow}`}
      />

      <div className="relative h-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-sm shadow-slate-950/5 backdrop-blur-xl transition-all duration-500 group-hover:-translate-y-1 group-hover:border-slate-300 group-hover:shadow-2xl group-hover:shadow-slate-950/10 dark:border-white/[0.08] dark:bg-white/[0.045] dark:shadow-black/20 dark:group-hover:border-white/[0.16] dark:group-hover:shadow-black/40 md:p-7">
        <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-gradient-to-br from-slate-100 to-transparent opacity-80 dark:from-white/[0.06]" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, starIndex) => (
                <Star
                  key={starIndex}
                  className="h-4 w-4 fill-amber-400 text-amber-400"
                />
              ))}
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/30">
              <Quote className="h-4 w-4" />
            </div>
          </div>

          <blockquote className="mt-6 text-sm leading-7 text-slate-600 dark:text-white/58">
            “{item.quote}”
          </blockquote>

          <div className="mt-6 h-px w-full bg-gradient-to-r from-slate-200 via-slate-300 to-transparent dark:from-white/10 dark:via-white/15" />

          <div className="mt-5 flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black ${item.color}`}
            >
              {item.initials}
            </div>

            <div>
              <div className="text-sm font-black text-slate-950 dark:text-white">
                {item.name}
              </div>
              <div className="mt-0.5 text-xs text-slate-500 dark:text-white/42">
                {item.company}
              </div>
            </div>
          </div>

          <div className="mt-5 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/30">
            Preview feedback
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function TestimonialsBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.14),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.12),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.1),transparent_38%)]" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.055)_1px,transparent_1px)] bg-[size:42px_42px] [mask-image:radial-gradient(ellipse_75%_70%_at_50%_45%,black,transparent_78%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)]" />

      <svg
        className="testimonial-thread-float absolute -left-32 top-10 hidden h-64 w-[52rem] opacity-55 dark:opacity-35 md:block"
        viewBox="0 0 840 260"
        fill="none"
      >
        <path
          d="M24 140 C118 42 212 226 326 108 C442 -12 548 214 662 92 C728 22 778 56 820 84"
          stroke="url(#testimonialThreadTop)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          className="testimonial-thread-dash"
          d="M24 140 C118 42 212 226 326 108 C442 -12 548 214 662 92 C728 22 778 56 820 84"
          stroke="rgba(99,102,241,0.5)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        <defs>
          <linearGradient
            id="testimonialThreadTop"
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
        className="testimonial-thread-float absolute -right-32 bottom-8 hidden h-64 w-[52rem] rotate-180 opacity-45 dark:opacity-28 md:block"
        viewBox="0 0 840 260"
        fill="none"
      >
        <path
          d="M24 140 C118 42 212 226 326 108 C442 -12 548 214 662 92 C728 22 778 56 820 84"
          stroke="url(#testimonialThreadBottom)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          className="testimonial-thread-dash"
          d="M24 140 C118 42 212 226 326 108 C442 -12 548 214 662 92 C728 22 778 56 820 84"
          stroke="rgba(245,158,11,0.52)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        <defs>
          <linearGradient
            id="testimonialThreadBottom"
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