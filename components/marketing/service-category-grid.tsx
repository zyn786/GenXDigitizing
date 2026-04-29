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
    <section className="px-4 py-8 md:px-8 md:py-10">
      <div className="page-shell">
        <div className="grid gap-5 lg:grid-cols-3">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card
                key={category.title}
                className="glass-panel card-hover premium-shadow rounded-[2rem] border-border/80"
              >
                <CardHeader className="pb-3">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{category.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">{category.text}</p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {category.items.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-border/80 bg-secondary/80 px-3 py-1 text-xs text-muted-foreground"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <Link
                    href="/contact"
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition hover:gap-2.5"
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
