"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Card3D } from "@/components/ui/card-3d";
import { Card, CardContent } from "@/components/ui/card";
import { HeroMockup } from "@/components/marketing/hero-mockup";

const steps = [
  {
    number: "01",
    title: "Share your artwork",
    text: "Upload your logo or artwork file — JPG, PNG, PDF, AI, or vector. Tell us the garment, placement, and size.",
    color: "from-indigo-500/20 to-indigo-500/5",
  },
  {
    number: "02",
    title: "We digitize & proof",
    text: "Our team programs your file for production and sends a stitch-ready proof within 24 hours for your review.",
    color: "from-violet-500/20 to-violet-500/5",
  },
  {
    number: "03",
    title: "Review & request changes",
    text: "If anything needs adjustment, request a revision directly. We refine until the file matches your production goals.",
    color: "from-amber-500/20 to-amber-500/5",
  },
  {
    number: "04",
    title: "Download & run",
    text: "Approve the proof and download production-ready files in your required format — DST, PES, EMB, EXP, and more.",
    color: "from-emerald-500/20 to-emerald-500/5",
  },
];

export function DeliverySequence() {
  return (
    <section className="px-4 py-12 md:px-8 md:py-16">
      <div className="page-shell">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="mb-8 flex flex-col gap-3 md:mb-10 md:flex-row md:items-end md:justify-between"
        >
          <div className="max-w-xl">
            <div className="section-eyebrow">How it works</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">
              From artwork to production-ready file in four steps.
            </h2>
          </div>
          <Link href="/contact" className="btn-outline shrink-0">
            Start your first order
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        <div className="grid items-start gap-6 lg:gap-12 lg:grid-cols-[1fr_auto]">
          {/* Steps grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.55,
                  delay: index * 0.1,
                  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                }}
              >
                <Card3D className="h-full rounded-[2rem]" intensity={9}>
                  <Card className="glass-panel premium-shadow relative h-full overflow-hidden rounded-[2rem] border-border/80">
                    <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${step.color}`} />
                    <CardContent className="p-6">
                      <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} text-sm font-bold`}>
                        {step.number}
                      </div>
                      <h3 className="text-base font-semibold">{step.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p>
                    </CardContent>
                  </Card>
                </Card3D>
              </motion.div>
            ))}
          </div>

          {/* Order card — visible only on large screens */}
          <motion.div
            initial={{ opacity: 0, x: 24, scale: 0.97 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.65, delay: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="hidden lg:block"
          >
            <HeroMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
