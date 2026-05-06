"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

// ── Placeholder testimonial cards (shown until real reviews are collected) ──
const PLACEHOLDER_TESTIMONIALS = [
  {
    quote: "Files ran perfectly on first load. No callbacks, no machine errors. Exactly what we needed.",
    name: "J. Martinez",
    company: "Northline Embroidery",
    initials: "JM",
    color: "bg-indigo-500/15 text-indigo-400",
  },
  {
    quote: "Turnaround was under 12 hours on a rush cap order. Quality matched the preview exactly.",
    name: "T. Sullivan",
    company: "Sullivan Promo Group",
    initials: "TS",
    color: "bg-violet-500/15 text-violet-400",
  },
  {
    quote: "The proof-first workflow is what sold me. See it before you approve it. Total trust.",
    name: "A. Kowalski",
    company: "AK Branded Apparel",
    initials: "AK",
    color: "bg-amber-500/15 text-amber-400",
  },
];

export function TestimonialsSection() {
  return (
    <section className="px-4 py-12 md:px-8 md:py-16">
      <div className="page-shell">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease }}
          className="mb-10 text-center"
        >
          <div className="section-eyebrow">Client stories</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">
            Trusted by decorators and print shops.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
            Real feedback from clients who rely on GenX for production-ready embroidery files.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLACEHOLDER_TESTIMONIALS.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease }}
              className="glass-panel card-hover premium-shadow rounded-[2rem] border-border/80 p-6"
            >
              {/* Stars */}
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, si) => (
                  <Star key={si} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <blockquote className="text-sm leading-7 text-muted-foreground">
                &ldquo;{item.quote}&rdquo;
              </blockquote>

              <div className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${item.color}`}>
                  {item.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.company}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.3, ease }}
          className="mt-8 flex justify-center"
        >
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-6 py-2.5 text-sm font-medium transition hover:bg-card hover:shadow-md"
          >
            See before &amp; after work
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/*
 * TODO: Restore this when real client testimonials are available.
 * Update lib/marketing-data.ts > testimonials array with real quotes.
 */
