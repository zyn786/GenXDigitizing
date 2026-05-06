"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FinalCtaBanner() {
  return (
    <section className="px-4 pb-12 pt-10 md:px-8 md:pb-24 md:pt-16 lg:pb-28 lg:pt-20">
      <div className="page-shell">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        >
          <div className="relative overflow-hidden rounded-[2.5rem] border border-primary/20 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent p-px shadow-[0_30px_80px_rgba(99,102,241,0.15)] premium-shadow">
            <div className="relative rounded-[2.4rem] bg-card/90 px-5 py-8 backdrop-blur-xl md:px-10 md:py-12 lg:px-12">

              {/* Animated glow orbs */}
              <motion.div
                className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-accent/12 blur-3xl"
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              />

              {/* 3D floating decoration — stitch nodes */}
              <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2.4rem]">
                {[
                  { top: "18%", left: "72%", size: 6, delay: 0 },
                  { top: "65%", left: "82%", size: 4, delay: 0.8 },
                  { top: "40%", left: "90%", size: 5, delay: 1.6 },
                ].map((dot, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full bg-primary/50"
                    style={{ top: dot.top, left: dot.left, width: dot.size, height: dot.size }}
                    animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 3.5, repeat: Infinity, delay: dot.delay, ease: "easeInOut" }}
                  />
                ))}
                {/* Connecting dashed lines SVG */}
                <svg className="absolute right-0 top-0 h-full w-1/3 opacity-[0.06]" viewBox="0 0 200 300" fill="none">
                  <path d="M100 20 Q140 80 100 140 Q60 200 100 280" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 8" className="text-primary" />
                </svg>
              </div>

              <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    <Sparkles className="h-3 w-3" />
                    Get started today
                  </div>
                  <h2 className="max-w-2xl text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">
                    Ready for embroidery files that run without rework?
                  </h2>
                  <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                    Send us your artwork and get a production-ready proof back within 24 hours.
                    No setup fees, no guesswork — just files that work.
                  </p>
                </div>

                <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col xl:flex-row">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button asChild variant="premium" shape="pill" size="lg">
                      <Link href="/contact">
                        Get a free quote
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button asChild variant="outline" shape="pill" size="lg">
                      <Link href="/login">Client portal</Link>
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
