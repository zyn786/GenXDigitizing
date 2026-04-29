"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Route } from "next";
import { motion } from "framer-motion";
import { ArrowRight, Award, Cpu, Shapes } from "lucide-react";

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
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-500/15",
    accentColor: "bg-indigo-500",
    tagStyle: "border-indigo-500/20 bg-indigo-500/10 text-indigo-300",
    bgImage: "/services/embroidery-bg.jpg",
  },
  {
    icon: Shapes,
    title: "Vector Art Conversion",
    href: "/services/vector-art" as Route,
    description:
      "Clean, scalable logo rebuilds for apparel decoration, print workflows, signage, and brand asset systems.",
    tags: ["JPG to Vector", "Logo Redraw", "Print-Ready", "DTF / DTG"],
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/15",
    accentColor: "bg-violet-500",
    tagStyle: "border-violet-500/20 bg-violet-500/10 text-violet-300",
    bgImage: "/services/vector-art-bg.jpg",
  },
  {
    icon: Award,
    title: "Custom Patches",
    href: "/services/custom-patches" as Route,
    description:
      "Structured patch planning for embroidered, woven, PVC, leather, and specialty patch production with approval-ready flow.",
    tags: ["Embroidered", "Chenille", "PVC / Woven", "Leather"],
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/15",
    accentColor: "bg-amber-500",
    tagStyle: "border-amber-500/20 bg-amber-500/10 text-amber-300",
    bgImage: "/services/patches-bg.jpg",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};
const cardVariant = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
};

// ── Individual card — needs its own state for image-load tracking ──────────────
function ServiceCard({ service }: { service: ServiceDef }) {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const Icon = service.icon;

  return (
    <motion.div
      variants={cardVariant}
      className="group relative overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-[#0d1425] shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-all duration-[350ms] hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
    >

      {/* ── Shimmer skeleton — shows on hover while image is still loading ── */}
      <div
        className={[
          "absolute inset-0 z-0 transition-opacity duration-300",
          !imageLoaded
            ? "opacity-0 group-hover:opacity-100"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
      >
        {/* Base dark fill */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800/80 to-slate-900/80" />
        {/* Sweeping shimmer highlight */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="shimmer-sweep absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        </div>
      </div>

      {/* ── Background image — fades in on hover once loaded ── */}
      <div
        className={[
          "absolute inset-0 z-0 transition-opacity duration-[400ms]",
          imageLoaded ? "opacity-0 group-hover:opacity-100" : "opacity-0",
        ].join(" ")}
      >
        <Image
          src={service.bgImage}
          alt={service.title}
          fill
          className="object-cover scale-[1.04] transition-transform duration-[500ms] group-hover:scale-100"
          sizes="(max-width: 1024px) 100vw, 33vw"
          onLoad={() => setImageLoaded(true)}
        />
      </div>

      {/* Dark overlay — fades in with the image to keep text readable */}
      <div
        className={[
          "absolute inset-0 z-[1] bg-[#07111f]/72 transition-opacity duration-[400ms]",
          imageLoaded ? "opacity-0 group-hover:opacity-100" : "opacity-0",
        ].join(" ")}
      />

      {/* ── Card content ── */}
      <div className="relative z-10 flex h-full flex-col p-8">

        {/* Accent bar */}
        <div className={`mb-7 h-0.5 w-10 rounded-full ${service.accentColor}`} />

        {/* Icon chip */}
        <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${service.iconBg}`}>
          <Icon className={`h-6 w-6 ${service.iconColor}`} />
        </div>

        {/* Title — scales up on hover */}
        <h3 className="origin-left text-xl font-bold text-white transition-transform duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.07]">
          {service.title}
        </h3>

        {/* Description */}
        <p className="mt-3 flex-1 text-sm leading-6 text-white/50 transition-colors duration-[350ms] group-hover:text-white/65">
          {service.description}
        </p>

        {/* Tags */}
        <div className="mt-5 flex flex-wrap gap-2">
          {service.tags.map((tag) => (
            <span
              key={tag}
              className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors duration-300 ${service.tagStyle}`}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* CTA link */}
        <Link
          href={service.href}
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-white/50 transition-all duration-300 hover:gap-3 group-hover:text-white/90"
        >
          View service details
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Inner border glow on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-[1.75rem] border border-white/0 transition-colors duration-[350ms] group-hover:border-white/[0.12]" />
    </motion.div>
  );
}

// ── Section ────────────────────────────────────────────────────────────────────
export function ServicePillars() {
  return (
    <section className="px-4 py-12 md:px-8 md:py-16">
      {/* Shimmer keyframe — scoped here so it doesn't pollute globals */}
      <style>{`
        @keyframes shimmer-sweep {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(220%); }
        }
        .shimmer-sweep {
          animation: shimmer-sweep 1.6s ease-in-out infinite;
        }
      `}</style>

      <div className="page-shell">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease }}
          className="mb-10 max-w-2xl"
        >
          <div className="section-eyebrow">Services</div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Built for production-ready artwork, not just attractive mockups.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Every service is structured to move from quote to production with clear specs,
            consistent quality, and a revision process that actually works.
          </p>
        </motion.div>

        {/* Cards grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid gap-5 lg:grid-cols-3"
        >
          {services.map((service) => (
            <ServiceCard key={service.title} service={service} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
