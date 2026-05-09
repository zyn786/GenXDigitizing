import Link from "next/link";
import { ArrowRight, Award, Cpu, Shapes } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const categories = [
  {
    icon: Cpu,
    title: "Embroidery Digitizing",
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
    <section className="relative overflow-hidden bg-[#f7f7fb] px-4 py-10 text-slate-950 dark:bg-[#050814] dark:text-white md:px-8 md:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.12),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.1),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.08),transparent_38%)] dark:bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.14),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.12),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.1),transparent_38%)]" />

      <div className="page-shell relative z-10">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <Card
                key={category.title}
                className="group relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white/80 shadow-sm shadow-slate-950/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:bg-white hover:shadow-xl hover:shadow-slate-950/10 dark:border-white/10 dark:bg-white/[0.045] dark:shadow-black/20 dark:hover:border-white/[0.16] dark:hover:bg-white/[0.065] sm:rounded-[1.75rem] lg:rounded-[2rem]"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10 opacity-70" />
                <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-gradient-to-br from-slate-100 to-transparent opacity-70 dark:from-white/[0.06]" />

                <CardHeader className="relative z-10 pb-3 p-5 sm:p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-500/10 bg-indigo-500/10 text-indigo-700 dark:border-indigo-400/10 dark:bg-indigo-400/10 dark:text-indigo-300 sm:h-12 sm:w-12">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>

                  <CardTitle className="text-lg font-black tracking-tight text-slate-950 dark:text-white sm:text-xl">
                    {category.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="relative z-10 px-5 pb-5 sm:px-6 sm:pb-6">
                  <p className="text-sm leading-6 text-slate-600 dark:text-white/55">
                    {category.text}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-1.5 sm:gap-2">
                    {category.items.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[10px] font-bold text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.055] dark:text-white/50 sm:px-3 sm:text-xs"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <Link
                    href="/contact"
                    className="mt-5 inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3.5 py-2 text-xs font-bold text-indigo-700 transition-all hover:gap-2.5 hover:bg-indigo-500/15 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200 dark:hover:bg-indigo-400/15 sm:text-sm"
                  >
                    Ask about this service
                    <ArrowRight className="h-3.5 w-3.5" />
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