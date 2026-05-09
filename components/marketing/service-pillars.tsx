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
    <section className="relative isolate overflow-hidden bg-[#F7F8FF] px-4 py-10 text-[#050816] dark:bg-[#050814] dark:text-slate-100 sm:py-12 md:px-8 md:py-24 lg:py-28">
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(109,53,255,0.13),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(37,99,235,0.1),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(14,165,233,0.08),transparent_38%)] dark:bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.12),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(56,189,248,0.08),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.08),transparent_38%)]" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:radial-gradient(ellipse_75%_70%_at_50%_45%,black,transparent_78%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] md:bg-[size:42px_42px]" />

      <svg
        className="service-thread-float absolute -left-32 top-6 hidden h-64 w-[52rem] opacity-42 dark:opacity-28 md:block"
        viewBox="0 0 840 260"
        fill="none"
      >
        <path
          d="M24 140 C118 42 212 226 326 108 C442 -12 548 214 662 92 C728 22 778 56 820 84"
          stroke="url(#serviceThreadTop)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          className="service-thread-dash"
          d="M24 140 C118 42 212 226 326 108 C442 -12 548 214 662 92 C728 22 778 56 820 84"
          stroke="rgba(109,53,255,0.42)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient
            id="serviceThreadTop"
            x1="24"
            y1="0"
            x2="820"
            y2="260"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#6D35FF" />
            <stop offset="0.5" stopColor="#7C3AED" />
            <stop offset="1" stopColor="#0EA5E9" />
          </linearGradient>
        </defs>
      </svg>

      <svg
        className="service-thread-float absolute -right-32 bottom-4 hidden h-64 w-[52rem] rotate-180 opacity-36 dark:opacity-24 md:block"
        viewBox="0 0 840 260"
        fill="none"
      >
        <path
          d="M24 140 C118 42 212 226 326 108 C442 -12 548 214 662 92 C728 22 778 56 820 84"
          stroke="url(#serviceThreadBottom)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          className="service-thread-dash"
          d="M24 140 C118 42 212 226 326 108 C442 -12 548 214 662 92 C728 22 778 56 820 84"
          stroke="rgba(37,99,235,0.4)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient
            id="serviceThreadBottom"
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

      <svg
        className="absolute right-8 top-24 hidden h-72 w-72 opacity-32 dark:opacity-22 md:block"
        viewBox="0 0 280 280"
        fill="none"
      >
        <path
          d="M48 188 C72 76 170 56 218 108 C254 146 202 218 120 204"
          stroke="rgba(109,53,255,0.32)"
          strokeWidth="1.5"
        />
        <circle
          className="service-node-pulse"
          cx="48"
          cy="188"
          r="5"
          fill="#6D35FF"
        />
        <circle
          className="service-node-pulse"
          cx="120"
          cy="204"
          r="5"
          fill="#0EA5E9"
          style={{ animationDelay: "0.45s" }}
        />
        <circle
          className="service-node-pulse"
          cx="218"
          cy="108"
          r="5"
          fill="#2563EB"
          style={{ animationDelay: "0.9s" }}
        />
        <path
          d="M48 188 L28 204 M48 188 L68 172 M120 204 L98 224 M120 204 L143 184 M218 108 L240 92 M218 108 L196 124"
          stroke="rgba(15,23,42,0.18)"
          strokeWidth="1"
          className="dark:stroke-white/15"
        />
      </svg>

      <svg
        className="absolute bottom-16 left-8 hidden h-56 w-56 rotate-[-10deg] opacity-24 dark:opacity-16 lg:block"
        viewBox="0 0 240 240"
        fill="none"
      >
        <path
          d="M120 22 L185 48 L214 114 L191 183 L120 218 L49 183 L26 114 L55 48 Z"
          stroke="rgba(14,165,233,0.34)"
          strokeWidth="2"
        />
        <path
          className="service-thread-dash"
          d="M120 39 L173 60 L197 115 L178 171 L120 200 L62 171 L43 115 L67 60 Z"
          stroke="rgba(37,99,235,0.36)"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}