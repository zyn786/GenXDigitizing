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
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent">
            <div className="relative bg-card px-5 py-8 md:px-10 md:py-12 lg:px-12">

              <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
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
