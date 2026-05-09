"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

type PricingCategory = "digitizing" | "vector" | "patches";

type PricingPlan = {
  title: string;
  price: string;
  subtitle: string;
  popular?: boolean;
  features: string[];
  href: Route;
};

const categories: { key: PricingCategory; label: string }[] = [
  { key: "digitizing", label: "Digitizing" },
  { key: "vector", label: "Vector" },
  { key: "patches", label: "Patches" },
];

const pricingPlans: Record<PricingCategory, PricingPlan[]> = {
  digitizing: [
    {
      title: "Basic",
      price: "$9",
      subtitle: "Simple left chest logos",
      href: "/order" as Route,
      features: [
        "PDF proof",
        "Required formats",
        "Minor editing free",
        "Machine / file format",
        "Conversion free",
        "Free size adjustment",
        "Change up to 10% to 20%",
      ],
    },
    {
      title: "Standard",
      price: "$12",
      subtitle: "Most common logo work",
      popular: true,
      href: "/order" as Route,
      features: [
        "PDF proof",
        "Required formats",
        "Minor editing free",
        "Machine / file format",
        "Conversion free",
        "Free size adjustment",
        "Change up to 10% to 20%",
      ],
    },
    {
      title: "Professional",
      price: "$21",
      subtitle: "Detailed or bigger designs",
      href: "/order" as Route,
      features: [
        "PDF proof",
        "Required formats",
        "Minor editing free",
        "Machine / file format",
        "Conversion free",
        "Free size adjustment",
        "Change up to 10% to 20%",
      ],
    },
  ],
  vector: [
    {
      title: "Starter",
      price: "$4",
      subtitle: "Small cleanup work",
      href: "/order" as Route,
      features: [
        "PDF proof",
        "Required formats",
        "Minor editing free",
        "Machine / file format",
        "Conversion free",
        "Free size adjustment",
        "Change up to 10% to 20%",
      ],
    },
    {
      title: "Basic",
      price: "$9",
      subtitle: "Logo redraw / vector rebuild",
      popular: true,
      href: "/order" as Route,
      features: [
        "PDF proof",
        "Required formats",
        "Minor editing free",
        "Machine / file format",
        "Conversion free",
        "Free size adjustment",
        "Change up to 10% to 20%",
      ],
    },
    {
      title: "Standard",
      price: "$12",
      subtitle: "Print-ready artwork",
      href: "/order" as Route,
      features: [
        "PDF proof",
        "Required formats",
        "Minor editing free",
        "Machine / file format",
        "Conversion free",
        "Free size adjustment",
        "Change up to 10% to 20%",
      ],
    },
  ],
  patches: [
    {
      title: "Starter",
      price: "$9",
      subtitle: "Simple patch setup",
      href: "/order" as Route,
      features: [
        "PDF proof",
        "Required formats",
        "Minor editing free",
        "Machine / file format",
        "Conversion free",
        "Free size adjustment",
        "Change up to 10% to 20%",
      ],
    },
    {
      title: "Basic",
      price: "$18",
      subtitle: "Most patch artwork",
      popular: true,
      href: "/order" as Route,
      features: [
        "PDF proof",
        "Required formats",
        "Minor editing free",
        "Machine / file format",
        "Conversion free",
        "Free size adjustment",
        "Change up to 10% to 20%",
      ],
    },
    {
      title: "Standard",
      price: "$25",
      subtitle: "Complex patch production",
      href: "/order" as Route,
      features: [
        "PDF proof",
        "Required formats",
        "Minor editing free",
        "Machine / file format",
        "Conversion free",
        "Free size adjustment",
        "Change up to 10% to 20%",
      ],
    },
  ],
};

export function PricingPlansGrid() {
  const prefersReduced = useReducedMotion();
  const [activeCategory, setActiveCategory] =
    React.useState<PricingCategory>("digitizing");

  const activePlans = pricingPlans[activeCategory];

  return (
    <section className="relative overflow-hidden bg-[#f7f7fb] px-4 py-10 text-slate-950 dark:bg-[#050814] dark:text-white md:px-8 md:py-14">
      <PricingBackground />

      <div className="page-shell relative z-10">
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 14 }}
          whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.35, ease }}
          className="mx-auto mb-7 max-w-3xl text-center md:mb-9"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-white/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06] dark:text-indigo-200 sm:tracking-[0.28em]">
            <Sparkles className="h-3.5 w-3.5" />
            Pricing
          </div>

          <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-slate-950 dark:text-white sm:text-4xl md:text-5xl">
            Simple pricing for every production need.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 dark:text-white/58 md:text-base md:leading-7">
            Choose digitizing, vector art, or patches. Each package includes
            proofing, required formats, and a clean revision path.
          </p>
        </motion.div>

        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 12 }}
          whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.32, delay: 0.04, ease }}
          className="mb-8 flex justify-center"
        >
          <div className="flex max-w-full gap-2 overflow-x-auto rounded-[1.35rem] border border-slate-200 bg-white/75 p-1.5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((category) => {
              const isActive = activeCategory === category.key;

              return (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => setActiveCategory(category.key)}
                  className={[
                    "min-h-[42px] min-w-[112px] rounded-2xl px-4 text-xs font-black uppercase tracking-[0.12em] transition-all sm:min-w-[132px] sm:text-sm",
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 dark:bg-indigo-300 dark:text-slate-950"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-950 dark:bg-white/[0.055] dark:text-white/45 dark:hover:bg-white/[0.09] dark:hover:text-white",
                  ].join(" ")}
                >
                  {category.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 md:pb-0">
          {activePlans.map((plan, index) => (
            <PricingCard
              key={`${activeCategory}-${plan.title}`}
              plan={plan}
              index={index}
              prefersReduced={Boolean(prefersReduced)}
            />
          ))}
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-6 text-slate-500 dark:text-white/35">
          Prices may change based on design complexity, stitch count, size,
          rush delivery, fabric type, and special production requirements.
        </p>
      </div>
    </section>
  );
}

function PricingCard({
  plan,
  index,
  prefersReduced,
}: {
  plan: PricingPlan;
  index: number;
  prefersReduced: boolean;
}) {
  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 18 }}
      whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.32,
        delay: prefersReduced ? 0 : index * 0.05,
        ease,
      }}
      className="w-[82vw] shrink-0 snap-center md:w-auto md:shrink"
    >
      <Card
        className={[
          "group relative h-full overflow-hidden rounded-[1.5rem] border bg-white/82 shadow-sm backdrop-blur-xl transition-all duration-300 dark:bg-white/[0.045] dark:shadow-black/20 sm:rounded-[1.75rem] md:rounded-[2rem]",
          plan.popular
            ? "border-indigo-500/35 shadow-xl shadow-indigo-500/10 dark:border-indigo-400/30"
            : "border-slate-200 shadow-slate-950/5 hover:-translate-y-1 hover:border-slate-300 hover:bg-white hover:shadow-xl hover:shadow-slate-950/10 dark:border-white/10 dark:hover:border-white/[0.16] dark:hover:bg-white/[0.065]",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10 opacity-70" />

        {plan.popular && (
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-blue-500" />
        )}

        {plan.popular && (
          <div className="absolute right-4 top-4 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200">
            Popular
          </div>
        )}

        <CardContent className="relative z-10 flex h-full flex-col p-5 sm:p-6">
          <div className="text-center">
            <div className="mx-auto mb-3 h-px w-20 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

            <h3 className="text-2xl font-black uppercase tracking-[0.08em] text-indigo-700 dark:text-indigo-300">
              {plan.title}
            </h3>

            <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-white/40">
              {plan.subtitle}
            </p>

            <div className="mt-4 text-6xl font-black tracking-[-0.08em] text-indigo-700 dark:text-indigo-300">
              {plan.price}
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-black uppercase tracking-[0.08em] text-indigo-700 dark:text-indigo-300">
              Features:
            </div>

            <ul className="mt-3 space-y-2.5">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-white/58"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-300" />
                  <span className="leading-5">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-7 flex justify-center">
            <Link
              href={plan.href}
              className={[
                "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black uppercase tracking-[0.08em] transition-all",
                plan.popular
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 dark:bg-indigo-300 dark:text-slate-950 dark:hover:bg-indigo-200"
                  : "border border-indigo-500/20 bg-indigo-600 text-white shadow-lg shadow-indigo-500/15 hover:-translate-y-0.5 hover:bg-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400 dark:text-slate-950 dark:hover:bg-indigo-300",
              ].join(" ")}
            >
              Order now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PricingBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-0 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.12),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.1),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.08),transparent_38%)] dark:bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.14),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.12),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.1),transparent_38%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:radial-gradient(ellipse_75%_70%_at_50%_45%,black,transparent_78%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] md:bg-[size:42px_42px]" />
    </div>
  );
}