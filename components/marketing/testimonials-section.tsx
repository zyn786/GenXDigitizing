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
      "bg-[#2563EB]/10 text-[#2563EB] dark:bg-indigo-400/10 dark:text-indigo-300",
    glow: "from-[#2563EB]/22 via-[#6D35FF]/12 to-[#0EA5E9]/10",
  },
  {
    quote:
      "The proof-first workflow made approval easier. We could review the artwork clearly before final files.",
    name: "Sample Print Shop",
    company: "Promo Apparel",
    initials: "SP",
    color:
      "bg-[#6D35FF]/10 text-[#6D35FF] dark:bg-cyan-400/10 dark:text-cyan-300",
    glow: "from-[#6D35FF]/24 via-[#7C3AED]/12 to-[#2563EB]/10",
  },
  {
    quote:
      "Fast turnaround, clean communication, and production-ready files in the formats we needed.",
    name: "Sample Brand Team",
    company: "Custom Apparel",
    initials: "SB",
    color:
      "bg-[#0EA5E9]/10 text-[#0284C7] dark:bg-blue-400/10 dark:text-blue-300",
    glow: "from-[#0EA5E9]/22 via-[#2563EB]/12 to-[#6D35FF]/10",
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
    <section className="relative isolate overflow-hidden bg-[#F7F8FF] px-4 py-10 text-[#050816] dark:bg-[#050814] dark:text-slate-100 sm:py-12 md:px-8 md:py-24 lg:py-28">
      <TestimonialsBackground />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-slate-300/80 to-transparent dark:via-white/15" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px bg-gradient-to-r from-transparent via-slate-300/80 to-transparent dark:via-white/15" />

      <div className="page-shell relative z-10">
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 14 }}
          whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.35, ease }}
          className="mx-auto mb-8 max-w-4xl text-center md:mb-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#6D35FF]/20 bg-white/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#5B21B6] shadow-sm backdrop-blur dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300 sm:tracking-[0.28em]">
            <Sparkles className="h-3.5 w-3.5" />
            Client stories
          </div>

          <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-[#050816] dark:text-slate-100 sm:text-4xl md:mt-5 md:text-5xl lg:text-6xl">
            Trusted workflow for decorators and{" "}
            <span className="bg-gradient-to-r from-[#6D35FF] via-[#7C3AED] to-[#2563EB] bg-clip-text text-transparent dark:from-indigo-300 dark:via-cyan-300 dark:to-blue-300">
              print shops.
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#525866] dark:text-slate-400 md:mt-5 md:text-base md:leading-7">
            A proof-first process built around clean communication, fast
            turnaround, and machine-ready embroidery files.
          </p>

          <div className="mx-auto mt-5 flex max-w-4xl flex-wrap justify-center gap-1.5 md:mt-7 md:gap-2">
            {trustPoints.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1.5 text-[10px] font-bold text-slate-600 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-[#0B1120] dark:text-slate-300 sm:px-3 sm:text-[11px]"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-[#2563EB] dark:text-indigo-300" />
                {item}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Mobile horizontal scroll */}
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden">
          {PLACEHOLDER_TESTIMONIALS.map((item, index) => (
            <TestimonialCard
              key={item.name}
              item={item}
              index={index}
              prefersReduced={Boolean(prefersReduced)}
              className="w-[82vw] shrink-0 snap-center"
              mobile
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

        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 12 }}
          whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.32, delay: 0.08, ease }}
          className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row md:mt-9 md:gap-3"
        >
          <Link
            href="/portfolio"
            className="inline-flex min-h-[40px] items-center justify-center rounded-full bg-gradient-to-r from-[#6D35FF] to-[#2563EB] px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-[#6D35FF]/20 transition hover:-translate-y-0.5 hover:opacity-95 dark:from-indigo-500 dark:to-blue-500 md:min-h-[46px] md:px-5 md:py-3 md:text-sm"
          >
            See before &amp; after work
            <ArrowRight className="ml-2 h-3.5 w-3.5 md:h-4 md:w-4" />
          </Link>

          <Link
            href="/order"
            className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-slate-300 bg-white/80 px-4 py-2.5 text-xs font-black text-[#050816] shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white dark:border-slate-700 dark:bg-[#0B1120] dark:text-slate-100 dark:hover:bg-[#111C31] md:min-h-[46px] md:px-5 md:py-3 md:text-sm"
          >
            Start an order
          </Link>
        </motion.div>

        <p className="mx-auto mt-4 max-w-2xl text-center text-[11px] leading-5 text-slate-500 dark:text-slate-500 md:mt-5 md:text-xs md:leading-6">
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

        @media (max-width: 767px) {
          .testimonial-thread-dash,
          .testimonial-thread-float {
            animation: none !important;
          }
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
  mobile = false,
}: {
  item: (typeof PLACEHOLDER_TESTIMONIALS)[number];
  index: number;
  prefersReduced: boolean;
  className?: string;
  mobile?: boolean;
}) {
  return (
    <motion.article
      initial={prefersReduced ? false : { opacity: 0, y: 14 }}
      whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.32,
        delay: prefersReduced ? 0 : index * 0.04,
        ease,
      }}
      className={`group relative ${className}`}
    >
      <div
        className={`pointer-events-none absolute -inset-1 hidden rounded-[2.15rem] bg-gradient-to-br opacity-0 blur-xl transition duration-500 md:block md:group-hover:opacity-100 ${item.glow}`}
      />

      <div
        className={[
          "relative h-full overflow-hidden border border-slate-200 bg-white/85 shadow-sm shadow-slate-950/5 backdrop-blur-xl transition-all duration-300 dark:border-slate-800 dark:bg-[#0B1120] dark:shadow-black/20",
          mobile
            ? "rounded-[1.5rem] p-4"
            : "rounded-[2rem] p-6 md:p-7 md:group-hover:-translate-y-1 md:group-hover:border-slate-300 md:group-hover:bg-white md:group-hover:shadow-2xl md:group-hover:shadow-slate-950/10 dark:md:group-hover:border-slate-700 dark:md:group-hover:bg-[#0F172A] dark:md:group-hover:shadow-black/40",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-gradient-to-br from-slate-100 to-transparent opacity-70 dark:from-indigo-400/10 md:h-28 md:w-28 md:opacity-80" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, starIndex) => (
                <Star
                  key={starIndex}
                  className="h-3.5 w-3.5 fill-[#2563EB] text-[#2563EB] dark:fill-indigo-300 dark:text-indigo-300 md:h-4 md:w-4"
                />
              ))}
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-[#0F172A] dark:text-slate-500 md:h-10 md:w-10 md:rounded-2xl">
              <Quote className="h-4 w-4" />
            </div>
          </div>

          <blockquote className="mt-4 text-[13px] leading-6 text-[#525866] dark:text-slate-400 md:mt-6 md:text-sm md:leading-7">
            “{item.quote}”
          </blockquote>

          <div className="mt-5 h-px w-full bg-gradient-to-r from-slate-200 via-slate-300 to-transparent dark:from-slate-700 dark:via-slate-800 md:mt-6" />

          <div className="mt-4 flex items-center gap-3 md:mt-5">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black md:h-11 md:w-11 ${item.color}`}
            >
              {item.initials}
            </div>

            <div>
              <div className="text-sm font-black text-[#050816] dark:text-slate-100">
                {item.name}
              </div>

              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {item.company}
              </div>
            </div>
          </div>

          <div className="mt-4 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400 dark:border-slate-700 dark:bg-[#0F172A] dark:text-slate-500 md:mt-5 md:text-[10px] md:tracking-[0.18em]">
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(109,53,255,0.13),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(37,99,235,0.1),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(14,165,233,0.08),transparent_38%)] dark:bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.12),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(56,189,248,0.08),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.08),transparent_38%)]" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:radial-gradient(ellipse_75%_70%_at_50%_45%,black,transparent_78%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] md:bg-[size:42px_42px]" />

      <svg
        className="testimonial-thread-float absolute -left-32 top-10 hidden h-64 w-[52rem] opacity-42 dark:opacity-28 md:block"
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
          stroke="rgba(109,53,255,0.42)"
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
            <stop stopColor="#6D35FF" />
            <stop offset="0.5" stopColor="#2563EB" />
            <stop offset="1" stopColor="#0EA5E9" />
          </linearGradient>
        </defs>
      </svg>

      <svg
        className="testimonial-thread-float absolute -right-32 bottom-8 hidden h-64 w-[52rem] rotate-180 opacity-36 dark:opacity-24 md:block"
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
          stroke="rgba(37,99,235,0.4)"
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
            <stop stopColor="#0EA5E9" />
            <stop offset="0.5" stopColor="#2563EB" />
            <stop offset="1" stopColor="#6D35FF" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}