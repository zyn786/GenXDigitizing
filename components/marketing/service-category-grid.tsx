"use client";

import Link from "next/link";
import { ArrowRight, Award, Cpu, Shapes } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const categories = [
  {
    icon: Cpu,
    title: "Embroidery Digitizing",
    href: "/services/embroidery-digitizing",
    items: [
      "Left Chest Logo",
      "Cap / Hat Logo",
      "3D Puff",
      "Jacket Back",
      "Applique",
      "Small Text Digitizing",
    ],
    text: "Production-ready stitch planning for commercial garments, headwear, detailed logos, and specialty embroidery use cases.",
  },
  {
    icon: Shapes,
    title: "Vector Art Conversion",
    href: "/services/vector-art",
    items: [
      "JPG to Vector",
      "Logo Redraw",
      "Raster to Vector",
      "Print-Ready Artwork",
      "DTF / DTG Artwork Prep",
      "Color Separation",
    ],
    text: "Clean vector rebuilds for print, apparel decoration, production files, and scalable brand asset systems.",
  },
  {
    icon: Award,
    title: "Custom Patches",
    href: "/services/custom-patches",
    items: [
      "Embroidered Patches",
      "Chenille Patches",
      "PVC Patches",
      "Woven Patches",
      "Leather Patches",
      "Iron-On / Velcro / Sew-On",
    ],
    text: "Patch-focused presentation that supports future ordering logic for materials, backing, borders, sizing, and delivery flow.",
  },
];

export function ServiceCategoryGrid() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f8f9ff_35%,#f3f6ff_100%)] px-4 py-12 text-slate-950 dark:bg-[linear-gradient(180deg,#050814_0%,#0B1120_100%)] dark:text-white md:px-8 md:py-16">

      {/* TOP LINE */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-[#6D35FF]/25 to-transparent dark:via-white/15" />

      {/* BOTTOM LINE */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-px bg-gradient-to-r from-transparent via-[#2563EB]/25 to-transparent dark:via-white/15" />

      {/* BACKGROUND */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10rem] top-[-12rem] h-[28rem] w-[28rem] rounded-full bg-[#6D35FF]/12 blur-3xl dark:bg-indigo-500/18" />
        <div className="absolute right-[-8rem] top-[8%] h-[24rem] w-[24rem] rounded-full bg-[#2563EB]/10 blur-3xl dark:bg-blue-500/14" />
        <div className="absolute bottom-[-10rem] left-[35%] h-[24rem] w-[24rem] rounded-full bg-[#0EA5E9]/10 blur-3xl dark:bg-cyan-500/10" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_75%_70%_at_50%_45%,black,transparent_78%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] md:bg-[size:42px_42px]" />
      </div>

      <div className="page-shell relative z-10">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">

          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <Card
                key={category.title}
                className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/80 shadow-xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-[#6D35FF]/20 hover:shadow-2xl hover:shadow-[#6D35FF]/10 dark:border-white/10 dark:bg-white/[0.045] dark:hover:border-white/[0.14]"
              >
                {/* glow */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#6D35FF]/8 via-transparent to-[#2563EB]/8 opacity-80" />

                <CardHeader className="relative z-10 p-6 pb-4">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6D35FF]/10 to-[#2563EB]/10 text-[#5B21B6] dark:text-indigo-300">
                    <Icon className="h-6 w-6" />
                  </div>

                  <CardTitle className="text-xl font-black text-slate-950 dark:text-white">
                    {category.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="relative z-10 px-6 pb-6">
                  <p className="text-sm leading-7 text-slate-600 dark:text-slate-400">
                    {category.text}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {category.items.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] font-bold text-slate-600 dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-300"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  {/* BUTTON → redirects correctly */}
                  <Link
                    href={category.href}
                    className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#6D35FF]/10 to-[#2563EB]/10 px-4 py-2.5 text-sm font-black text-[#5B21B6] transition-all hover:gap-3 hover:from-[#6D35FF]/15 hover:to-[#2563EB]/15 dark:text-indigo-200"
                  >
                    Ask about this service
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}

        </div>
      </div>
    </section>
  );
}