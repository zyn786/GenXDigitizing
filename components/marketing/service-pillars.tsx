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
    iconColor: "text-indigo-300",
    iconBg: "bg-indigo-500/15",
    accentColor: "bg-indigo-500",
    tagStyle: "border-indigo-500/25 bg-indigo-500/10 text-indigo-200",
    bgImage: "/services/embroidery-bg.jpg",
  },
  {
    icon: Shapes,
    title: "Vector Art Conversion",
    href: "/services/vector-art" as Route,
    description:
      "Clean, scalable logo rebuilds for apparel decoration, print workflows, signage, and brand asset systems.",
    tags: ["JPG to Vector", "Logo Redraw", "Print-Ready", "DTF / DTG"],
    iconColor: "text-violet-300",
    iconBg: "bg-violet-500/15",
    accentColor: "bg-violet-500",
    tagStyle: "border-violet-500/25 bg-violet-500/10 text-violet-200",
    bgImage: "/services/vector-art-bg.jpg",
  },
  {
    icon: Award,
    title: "Custom Patches",
    href: "/services/custom-patches" as Route,
    description:
      "Structured patch planning for embroidered, woven, PVC, leather, and specialty patch production with approval-ready flow.",
    tags: ["Embroidered", "Chenille", "PVC / Woven", "Leather"],
    iconColor: "text-amber-300",
    iconBg: "bg-amber-500/15",
    accentColor: "bg-amber-500",
    tagStyle: "border-amber-500/25 bg-amber-500/10 text-amber-200",
    bgImage: "/services/patches-bg.jpg",
  },
];

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariant = {
  hidden: {
    opacity: 0,
    y: 28,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease,
    },
  },
};

function ServiceCard({ service }: { service: ServiceDef }) {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const Icon = service.icon;

  return (
    <motion.article
      variants={cardVariant}
      className="group relative min-h-[430px] overflow-hidden rounded-[1.8rem] border border-white/[0.08] bg-[#0d1425] shadow-[0_10px_36px_rgba(0,0,0,0.42)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_26px_70px_rgba(0,0,0,0.62)]"
    >
      <div
        className={[
          "absolute inset-0 z-0 transition-opacity duration-500",
          !imageLoaded
            ? "opacity-0 group-hover:opacity-100"
            : "pointer-events-none opacity-0",
        ].join(" ")}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800/90 to-slate-950/90" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="shimmer-sweep absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
        </div>
      </div>

      <div
        className={[
          "absolute inset-0 z-0 transition-opacity duration-700",
          imageLoaded ? "opacity-35 group-hover:opacity-100" : "opacity-0",
        ].join(" ")}
      >
        <Image
          src={service.bgImage}
          alt={service.title}
          fill
          className="scale-110 object-cover transition-transform duration-700 ease-out group-hover:scale-100"
          sizes="(max-width: 1024px) 100vw, 33vw"
          onLoad={() => setImageLoaded(true)}
        />
      </div>

      {/* Main readability overlay */}
      <div className="absolute inset-0 z-[1] bg-[#07111f]/70 transition-opacity duration-500 group-hover:bg-[#07111f]/35" />

      {/* Black gradient behind text */}
      <div className="absolute inset-x-0 bottom-0 z-[2] h-[72%] bg-gradient-to-t from-black/90 via-black/55 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-100" />

      {/* Subtle top glow */}
      <div className="absolute inset-x-0 top-0 z-[2] h-32 bg-gradient-to-b from-white/[0.08] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative z-10 flex min-h-[430px] flex-col p-7 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className={`h-0.5 w-12 rounded-full ${service.accentColor}`} />

          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] ${service.iconBg} backdrop-blur`}
          >
            <Icon className={`h-6 w-6 ${service.iconColor}`} />
          </div>
        </div>

        <div className="mt-auto">
          <div className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-3">
            <h3 className="max-w-[15rem] origin-left text-xl font-bold leading-tight tracking-tight text-white transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.12]">
              {service.title}
            </h3>

            <p className="mt-3 max-w-sm text-sm leading-6 text-white/58 transition-colors duration-500 group-hover:text-white/82">
              {service.description}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 transition-transform duration-500 group-hover:translate-y-3">
            {service.tags.map((tag) => (
              <span
                key={tag}
                className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] backdrop-blur transition-colors duration-300 ${service.tagStyle}`}
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-6 translate-y-4 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-3 group-hover:opacity-100">
            <Link
              href={service.href}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-4 py-2.5 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:gap-3 hover:bg-black/65"
            >
              View service details
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-20 rounded-[1.8rem] border border-white/0 transition-colors duration-500 group-hover:border-white/[0.16]" />
    </motion.article>
  );
}

export function ServicePillars() {
  return (
    <section className="px-4 py-16 md:px-8 md:py-24">
      <style>{`
        @keyframes shimmer-sweep {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(220%); }
        }

        .shimmer-sweep {
          animation: shimmer-sweep 1.6s ease-in-out infinite;
        }
      `}</style>

      <div className="page-shell">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease }}
          className="mb-12 max-w-2xl"
        >
          <div className="section-eyebrow">Services</div>

          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Built for production-ready artwork, not just attractive mockups.
          </h2>

          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Every service is structured to move from quote to production with
            clear specs, consistent quality, and a revision process that
            actually works.
          </p>
        </motion.div>

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