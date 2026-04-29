"use client";

import Link from "next/link";
import type { Route } from "next";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { Card3D } from "@/components/ui/card-3d";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const plans = [
  {
    title: "Starter",
    price: "From $15",
    tagline: "Simple logos & single-color work",
    popular: false,
    features: [
      "Left chest & small logo digitizing",
      "Basic vector rebuild / cleanup",
      "Standard 24-hour turnaround",
      "1 revision included",
      "DST, PES, or EMB format delivery",
    ],
    cta: "Get started",
    href: "/contact" as Route,
  },
  {
    title: "Production",
    price: "From $35",
    tagline: "Mid-complexity & multi-color work",
    popular: true,
    features: [
      "Cap fronts, jacket backs, multi-color",
      "Full logo redraw or raster-to-vector",
      "Priority 24-hour turnaround",
      "Unlimited revisions until approved",
      "All major machine formats included",
      "Proof-first workflow with notes",
    ],
    cta: "Get a quote",
    href: "/contact" as Route,
  },
  {
    title: "Rush & Specialty",
    price: "Custom quote",
    tagline: "Rush, complex & specialty jobs",
    popular: false,
    features: [
      "3D puff, appliqué, chenille patches",
      "Same-day rush turnaround available",
      "High-stitch-count & fine-detail work",
      "Specialty file formats on request",
      "Dedicated review & revision support",
    ],
    cta: "Request a quote",
    href: "/contact" as Route,
  },
];

export function PricingPlansGrid() {
  return (
    <section className="px-4 py-8 md:px-8 md:py-10">
      <div className="page-shell grid gap-5 lg:grid-cols-3">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.title}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          >
            <Card3D
              className="relative h-full rounded-[2rem]"
              intensity={plan.popular ? 10 : 7}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-0 right-0 z-10 flex justify-center">
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                    className="rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/30"
                  >
                    Most popular
                  </motion.span>
                </div>
              )}

              <Card
                className={`relative h-full rounded-[2rem] border ${
                  plan.popular
                    ? "border-primary/30 bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.2),0_20px_60px_rgba(99,102,241,0.18)]"
                    : "glass-panel premium-shadow border-border/80"
                }`}
              >
                {/* Top accent line */}
                {plan.popular && (
                  <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-[2rem] bg-gradient-to-r from-transparent via-primary to-transparent" />
                )}

                <CardHeader className="pb-2 pt-8">
                  <div className="section-eyebrow">{plan.tagline}</div>
                  <CardTitle className="mt-1 text-xl">{plan.title}</CardTitle>
                  <div className="mt-3 text-3xl font-bold tracking-tight gradient-text">
                    {plan.price}
                  </div>
                </CardHeader>

                <CardContent className="pb-7">
                  <ul className="mb-6 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="leading-5 text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href={plan.href}
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition-all ${
                        plan.popular
                          ? "bg-primary text-primary-foreground hover:opacity-90 shadow-[0_8px_24px_rgba(99,102,241,0.3)]"
                          : "border border-border/80 bg-card/70 hover:bg-card"
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </motion.div>
                </CardContent>
              </Card>
            </Card3D>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
