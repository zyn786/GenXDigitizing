"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Cpu,
  Shapes,
  Sparkles,
} from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

type ServiceDef = {
  icon: React.ElementType;
  title: string;
  href: Route;
  description: string;
  tags: string[];
  iconColor: string;
  iconBg: string;
  accentColor: string;
  accentGlow: string;
  tagStyle: string;
  bgImage: string;
};

const services: ServiceDef[] = [
  {
    icon: Cpu,
    title: "Embroidery Digitizing",
    href: "/services/embroidery-digitizing" as Route,
    description:
      "Production-ready digitizing for caps, jackets, polos, left chest logos, small text, and high-detail commercial embroidery.",
    tags: ["Left Chest", "Cap / Hat", "3D Puff", "Jacket Back"],
    iconColor: "text-[#2563EB] dark:text-indigo-300",
    iconBg: "bg-[#2563EB]/10 dark:bg-indigo-500/15",
    accentColor: "bg-[#2563EB]",
    accentGlow: "from-[#2563EB]/22 via-[#6D35FF]/12 to-[#0EA5E9]/10",
    tagStyle:
      "border-[#2563EB]/20 bg-[#2563EB]/10 text-[#1D4ED8] dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200",
    bgImage: "/services/embroidery-bg.jpg",
  },
  {
    icon: Shapes,
    title: "Vector Art Conversion",
    href: "/services/vector-art" as Route,
    description:
      "Clean, scalable logo rebuilds for apparel decoration, print workflows, signage, and brand asset systems.",
    tags: ["JPG to Vector", "Logo Redraw", "Print-Ready", "DTF / DTG"],
    iconColor: "text-[#6D35FF] dark:text-cyan-300",
    iconBg: "bg-[#6D35FF]/10 dark:bg-cyan-400/10",
    accentColor: "bg-[#6D35FF]",
    accentGlow: "from-[#6D35FF]/24 via-[#7C3AED]/12 to-[#2563EB]/10",
    tagStyle:
      "border-[#6D35FF]/20 bg-[#6D35FF]/10 text-[#5B21B6] dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-200",
    bgImage: "/services/vector-art-bg.jpg",
  },
  {
    icon: Award,
    title: "Custom Patches",
    href: "/services/custom-patches" as Route,
    description:
      "Structured patch planning for embroidered, woven, PVC, leather, and specialty patch production with approval-ready flow.",
    tags: ["Embroidered", "Chenille", "PVC / Woven", "Leather"],
    iconColor: "text-[#0EA5E9] dark:text-blue-300",
    iconBg: "bg-[#0EA5E9]/10 dark:bg-blue-400/10",
    accentColor: "bg-[#0EA5E9]",
    accentGlow: "from-[#0EA5E9]/22 via-[#2563EB]/12 to-[#6D35FF]/10",
    tagStyle:
      "border-[#0EA5E9]/20 bg-[#0EA5E9]/10 text-[#0369A1] dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200",
    bgImage: "/services/patches-bg.jpg",
  },
];

const trustItems = [
  "Proof-first workflow",
  "Production-ready files",
  "Clean revisions",
  "Fast turnaround",
];

function useDesktopServiceImages() {
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");

    const update = () => {
      setEnabled(query.matches);
    };

    update();

    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return enabled;
}

function ServiceCard({
  service,
  showImage,
}: {
  service: ServiceDef;
  showImage: boolean;
}) {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const Icon = service.icon;

  React.useEffect(() => {
    if (!showImage) {
      React.startTransition(() => setImageLoaded(false));
    }
  }, [showImage]);

  return (
    <article className="group relative h-full overflow-hidden rounded-[1.5rem] md:overflow-visible md:rounded-[1.75rem]">
      <div
        className={[
          "pointer-events-none absolute -inset-1 hidden rounded-[2rem] bg-gradient-to-br opacity-0 blur-xl transition duration-500 md:block md:group-hover:opacity-100",
          service.accentGlow,
        ].join(" ")}
      />

      <div className="relative flex min-h-[260px] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] dark:border-slate-800 dark:bg-[#0B1120] dark:shadow-black/25 sm:min-h-[280px] md:min-h-[390px] md:rounded-[1.75rem] md:duration-500 md:group-hover:-translate-y-2 md:group-hover:scale-[1.025] md:group-hover:border-slate-300 md:group-hover:shadow-2xl md:group-hover:shadow-slate-950/15 dark:md:group-hover:border-slate-700 dark:md:group-hover:bg-[#0F172A] dark:md:group-hover:shadow-black/45 lg:min-h-[430px]">
        {showImage ? (
          <div
            className={[
              "absolute inset-0 z-0 transition-opacity duration-700",
              imageLoaded
                ? "opacity-0 md:opacity-38 md:group-hover:opacity-100"
                : "opacity-0",
            ].join(" ")}
          >
            <Image
              src={service.bgImage}
              alt=""
              fill
              loading="lazy"
              className="scale-105 object-cover transition-transform duration-700 ease-out md:group-hover:scale-100"
              sizes="(max-width: 767px) 0px, (max-width: 1024px) 50vw, 33vw"
              onLoad={() => setImageLoaded(true)}
            />
          </div>
        ) : null}

        <div
          className={[
            "absolute inset-0 z-0 bg-gradient-to-br from-[#F7F8FF] via-white to-[#EEF3FF] transition-opacity duration-500 dark:from-[#050814] dark:via-[#0B1120] dark:to-[#0F172A] md:duration-700",
            showImage && imageLoaded
              ? "opacity-100 md:opacity-68 md:group-hover:opacity-24"
              : "opacity-100",
          ].join(" ")}
        />

        <div className="absolute inset-0 z-[1] bg-[radial-gradient(rgba(15,23,42,0.055)_1px,transparent_1px)] [background-size:18px_18px] opacity-45 [mask-image:linear-gradient(to_bottom,black,transparent_72%)] dark:bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] md:[background-size:20px_20px]" />

        <div className="absolute inset-0 z-[2] bg-white/35 transition-colors duration-300 md:bg-white/48 md:duration-500 md:group-hover:bg-white/12 dark:bg-[#050814]/66 dark:md:bg-[#050814]/72 dark:md:group-hover:bg-[#050814]/42" />

        <div className="absolute inset-x-0 bottom-0 z-[3] h-[82%] bg-gradient-to-t from-white via-white/94 to-transparent dark:from-[#050814] dark:via-[#050814]/78 dark:to-transparent md:h-[78%]" />

        <div className="absolute inset-x-4 bottom-4 z-[3] hidden h-40 rounded-[1.5rem] bg-gradient-to-t from-black/58 via-black/22 to-transparent opacity-0 blur-sm transition-opacity duration-500 md:block md:group-hover:opacity-100" />

        <div className="relative z-10 flex min-h-[260px] w-full flex-col p-4 sm:min-h-[280px] sm:p-5 md:min-h-[390px] md:p-7 lg:min-h-[430px] lg:p-8">
          <div className="flex items-start justify-between gap-3 md:gap-4">
            <div className={`h-1 w-12 rounded-full md:w-14 ${service.accentColor}`} />

            <div
              className={[
                "flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-[#0F172A] md:h-12 md:w-12 md:rounded-2xl",
                service.iconBg,
              ].join(" ")}
            >
              <Icon className={`h-5 w-5 md:h-6 md:w-6 ${service.iconColor}`} />
            </div>
          </div>

          <div className="mt-auto">
            <div className="transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:duration-500 md:group-hover:translate-y-3">
              <h3 className="max-w-[16rem] origin-left text-xl font-black leading-tight tracking-tight text-[#050816] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] dark:text-slate-100 sm:text-2xl md:max-w-[17rem] md:text-3xl md:duration-500 md:group-hover:scale-[1.08]">
                {service.title}
              </h3>

              <p className="mt-2.5 max-w-sm text-[13px] leading-5 text-[#525866] transition-colors duration-300 dark:text-slate-400 sm:text-sm sm:leading-6 md:mt-3 md:duration-500 dark:md:group-hover:text-slate-200">
                {service.description}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5 transition-transform duration-300 md:mt-5 md:gap-2 md:duration-500 md:group-hover:translate-y-3">
              {service.tags.map((tag) => (
                <span
                  key={tag}
                  className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.07em] backdrop-blur transition-colors duration-300 sm:text-[10px] ${service.tagStyle}`}
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-5 translate-y-0 opacity-100 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:mt-6 md:translate-y-4 md:opacity-0 md:duration-500 md:group-hover:translate-y-3 md:group-hover:opacity-100">
              <Link
                href={service.href}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-transparent bg-gradient-to-r from-[#6D35FF] to-[#2563EB] px-3.5 py-2 text-xs font-black text-white shadow-lg shadow-[#6D35FF]/18 transition-all duration-300 hover:gap-3 hover:opacity-95 dark:from-indigo-500 dark:to-blue-500 dark:shadow-indigo-500/20 sm:text-sm md:min-h-[42px] md:px-4 md:py-2.5"
              >
                View service details
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 z-20 rounded-[1.5rem] border border-transparent transition-colors duration-300 md:rounded-[1.75rem] md:duration-500 md:group-hover:border-white/35 dark:md:group-hover:border-white/[0.12]" />
      </div>
    </article>
  );
}

export function ServicePillars() {
  const prefersReduced = useReducedMotion();
  const showServiceImages = useDesktopServiceImages();

  return (
    // ↓ Only this line changed: pt-28 sm:pt-32 on mobile, md:+ unchanged
    <section className="relative isolate overflow-hidden bg-[#F7F8FF] px-4 pb-10 pt-28 text-[#050816] dark:bg-[#050814] dark:text-slate-100 sm:pb-12 sm:pt-32 md:px-8 md:py-24 lg:py-28">
      <ServiceBackground />

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
            Services
          </div>

          <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-[#050816] dark:text-slate-100 sm:text-4xl md:mt-5 md:text-5xl lg:text-6xl">
            Built for production-ready artwork,
            <span className="block bg-gradient-to-r from-[#6D35FF] via-[#7C3AED] to-[#2563EB] bg-clip-text text-transparent dark:from-indigo-300 dark:via-cyan-300 dark:to-blue-300">
              not just attractive mockups.
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#525866] dark:text-slate-400 md:mt-5 md:text-base md:leading-7">
            Every service is structured to move from quote to production with
            clear specs, consistent quality, proof-first approvals, and a
            revision process that actually works.
          </p>

          <div className="mx-auto mt-5 flex max-w-4xl flex-wrap justify-center gap-1.5 md:mt-7 md:gap-2">
            {trustItems.map((item) => (
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

        <div className="grid gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={prefersReduced ? false : { opacity: 0, y: 16 }}
              whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.35,
                delay: prefersReduced ? 0 : index * 0.04,
                ease,
              }}
            >
              <ServiceCard service={service} showImage={showServiceImages} />
            </motion.div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes service-thread-flow {
          to {
            stroke-dashoffset: -260;
          }
        }

        @keyframes service-thread-float {
          0%,
          100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(20px, -14px, 0) rotate(1deg);
          }
        }

        @keyframes service-node-pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.35;
          }
          50% {
            transform: scale(1.45);
            opacity: 0.9;
          }
        }

        .service-thread-dash {
          stroke-dasharray: 12 14;
          animation: service-thread-flow 15s linear infinite;
        }

        .service-thread-float {
          animation: service-thread-float 8s ease-in-out infinite;
        }

        .service-node-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: service-node-pulse 3.5s ease-in-out infinite;
        }

        @media (max-width: 767px) {
          .service-thread-dash,
          .service-thread-float,
          .service-node-pulse {
            animation: none !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .service-thread-dash,
          .service-thread-float,
          .service-node-pulse {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}

function ServiceBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {/* Base */}
      <div className="absolute inset-0 bg-[#EEF4FF] dark:bg-[#040816]" />

      {/* Dark gradient mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(109,53,255,0.16),transparent_30%),radial-gradient(circle_at_bottom,rgba(14,165,233,0.14),transparent_34%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.22),transparent_28%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.22),transparent_30%),radial-gradient(circle_at_bottom,rgba(6,182,212,0.16),transparent_34%)]" />

      {/* Large ambient glows */}
      <div className="absolute -left-32 top-[-8rem] h-[34rem] w-[34rem] rounded-full bg-[#2563EB]/18 blur-[140px] dark:bg-blue-600/22" />

      <div className="absolute right-[-10rem] top-[4rem] h-[30rem] w-[30rem] rounded-full bg-[#6D35FF]/16 blur-[130px] dark:bg-indigo-500/24" />

      <div className="absolute bottom-[-12rem] left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-[#0EA5E9]/14 blur-[150px] dark:bg-cyan-500/18" />

      {/* Dark soft overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0B1120]/[0.03] to-[#0B1120]/[0.08] dark:via-[#020617]/20 dark:to-black/40" />

      {/* Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:42px_42px] [mask-image:radial-gradient(ellipse_72%_68%_at_50%_45%,black,transparent_78%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)]" />

      {/* Premium thread lines */}
      <svg
        className="absolute left-[-8rem] top-6 hidden h-72 w-[64rem] opacity-40 dark:opacity-28 md:block"
        viewBox="0 0 920 280"
        fill="none"
      >
        <path
          d="M20 160 C120 40 250 250 390 110 C520 -20 650 230 860 80"
          stroke="url(#threadGradient)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        <path
          d="M20 160 C120 40 250 250 390 110 C520 -20 650 230 860 80"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1"
          strokeDasharray="10 12"
        />

        <defs>
          <linearGradient
            id="threadGradient"
            x1="20"
            y1="0"
            x2="860"
            y2="260"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#6D35FF" />
            <stop offset="0.5" stopColor="#2563EB" />
            <stop offset="1" stopColor="#0EA5E9" />
          </linearGradient>
        </defs>
      </svg>

      {/* Bottom glow line */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#2563EB]/30 to-transparent dark:via-cyan-400/30" />

      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC42NSIgbnVtT2N0YXZlcz0iMyIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNuKSIvPjwvc3ZnPg==')" }}
      />
    </div>
  );
}