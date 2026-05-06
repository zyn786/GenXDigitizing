"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

import { Card3D } from "@/components/ui/card-3d";
import { Card, CardContent } from "@/components/ui/card";

const reasons = [
  {
    title: "Machine-optimized stitch files",
    text: "Files are built for production, not just preview. Density, underlay, and path direction are set for real machines and real garments.",
    color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  {
    title: "Turnaround you can plan around",
    text: "Standard jobs deliver in 24 hours. Rush options available. Every order has a clear timeline so you can commit to your clients.",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "Revisions are part of the process",
    text: "If the proof needs a change, we handle it. No hidden fees, no friction — just clean communication and a fixed file.",
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    title: "Premium client portal access",
    text: "Track orders, download files, request revisions, and manage invoices from one place. No email chains, no guesswork.",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const card = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

export function WhyScaffoldMatters() {
  return (
    <section className="relative px-4 py-12 md:px-8 md:py-16">
      {/* Thin gradient line separates from the dark portfolio section above */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/25 to-transparent" />
      <div className="page-shell">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="mb-10 max-w-2xl"
        >
          <div className="section-eyebrow">Why GenX</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">
            Built for decorators who need files that run right the first time.
          </h2>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid gap-4 sm:grid-cols-2"
        >
          {reasons.map((item) => (
            <motion.div key={item.title} variants={card}>
              <Card3D className="h-full rounded-[2rem]" intensity={7}>
                <Card className="glass-panel premium-shadow rounded-[2rem] border-border/80">
                  <CardContent className="p-6">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${item.color}`}>
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                  </CardContent>
                </Card>
              </Card3D>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
