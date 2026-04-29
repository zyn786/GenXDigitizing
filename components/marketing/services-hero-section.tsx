import { CheckCircle2, Cpu, Award, Shapes } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const highlights = [
  {
    icon: Cpu,
    title: "Embroidery digitizing",
    text: "Production-ready stitch files for left chest logos, cap fronts, 3D puff, jacket backs, and specialty work — optimized for commercial machines.",
  },
  {
    icon: Shapes,
    title: "Vector art conversion",
    text: "Clean, scalable vector rebuilds from any artwork format — ready for apparel decoration, signage, print, and brand asset systems.",
  },
  {
    icon: Award,
    title: "Custom patches",
    text: "Embroidered, chenille, woven, PVC, and leather patch work with structured specification paths and approval-ready proofs.",
  },
];

export function ServicesHeroSection() {
  return (
    <section className="px-4 pb-10 pt-16 md:px-8 md:pt-20">
      <div className="page-shell grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="section-eyebrow">Services</div>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">
            Production-ready embroidery, vector art &amp; custom patches.
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted-foreground">
            Every service is built around real production workflows — not generic templates.
            Files that run right the first time, with proofs and revisions included.
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {["24-hr turnaround", "Revisions included", "All machine formats", "Rush available"].map((badge) => (
              <div
                key={badge}
                className="flex items-center gap-1.5 rounded-full border border-border/80 bg-secondary/60 px-3 py-1.5 text-xs font-medium text-muted-foreground"
              >
                <CheckCircle2 className="h-3 w-3 text-primary" />
                {badge}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className="glass-panel card-hover premium-shadow rounded-[2rem] border-border/80"
              >
                <CardContent className="flex gap-4 p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">{item.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.text}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
