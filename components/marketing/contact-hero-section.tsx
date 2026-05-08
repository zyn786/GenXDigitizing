"use client";

import { motion } from "framer-motion";
import { Clock3, Mail, MessageCircle, Shield } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const promises = [
  { icon: Clock3,         text: "Reply within 24 hours" },
  { icon: Mail,           text: "Direct response — no AI bots" },
  { icon: Shield,         text: "Your artwork stays private" },
  { icon: MessageCircle,  text: "Ongoing chat support" },
];

export function ContactHeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-10 pt-16 md:px-8 md:pt-20">
      {/* Subtle top glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-primary/[0.04] blur-3xl" />
      </div>

      <div className="page-shell relative z-10 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease }}
          className="glass-panel premium-shadow rounded-[2rem] border-border/80 p-5 md:p-10"
        >
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            {/* Left content */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.05, ease }}
                className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-primary"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.8)]" />
                Contact Us
              </motion.div>

              <div className="section-eyebrow">Contact</div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
                Tell us about your project — we&rsquo;ll reply within{" "}
                <span className="gradient-text">24 hours.</span>
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                Share your artwork, garment type, placement, and turnaround needs. We&rsquo;ll come
                back with a clear quote and a plan to get your files production-ready.
              </p>
            </div>

            {/* Right: promises panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: 0.12, ease }}
              className="space-y-3"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                What to expect
              </p>
              {promises.map(({ icon: Icon, text }, i) => (
                <motion.div
                  key={text}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.07, ease }}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium text-foreground">{text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
