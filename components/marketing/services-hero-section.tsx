"use client";

import { motion } from "framer-motion";
import { Award, CheckCircle2, Cpu, Shapes } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const highlights = [
  { icon: Cpu,    title: "Embroidery digitizing",  text: "Production-ready stitch files for left chest logos, cap fronts, 3D puff, jacket backs, and specialty work — optimized for commercial machines." },
  { icon: Shapes, title: "Vector art conversion",  text: "Clean, scalable vector rebuilds from any artwork format — ready for apparel decoration, signage, print, and brand asset systems." },
  { icon: Award,  title: "Custom patches",          text: "Embroidered, chenille, woven, PVC, and leather patch work with structured specification paths and approval-ready proofs." },
];

const badges = [
  "24-hr turnaround",
  "Revisions included",
  "All machine formats",
  "Rush available",
];

export function ServicesHeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-10 pt-16 md:px-8 md:pt-20">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-5rem] top-[-3rem] h-80 w-80 rounded-full bg-indigo-500/[0.07] blur-3xl" />
        <div className="absolute right-[-4rem] top-[20%] h-64 w-64 rounded-full bg-violet-500/[0.06] blur-3xl" />
      </div>

      <div className="page-shell relative z-10">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Left: text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease }}
            className="space-y-6"
          >
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
                <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.8)]" />
                Our Services
              </div>
              <div className="section-eyebrow">Services</div>
              <h1 className="mt-2 max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
                Production-ready embroidery, vector art &amp;{" "}
                <span className="gradient-text">custom patches.</span>
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                Every service is built around real production workflows — not generic templates.
                Files that run right the first time, with proofs and revisions included.
              </p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              {badges.map((badge) => (
                <div
                  key={badge}
                  className="flex items-center gap-1.5 rounded-full border border-border/80 bg-secondary/60 px-3 py-1.5 text-xs font-medium text-muted-foreground"
                >
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  {badge}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: highlight cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease }}
            className="grid gap-4"
          >
            {highlights.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, delay: 0.15 + i * 0.1, ease }}
                >
                  <Card className="glass-panel card-hover premium-shadow rounded-[2rem] border-border/80">
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
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
