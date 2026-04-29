"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

import { testimonials } from "@/lib/marketing-data";
import { Card3D } from "@/components/ui/card-3d";
import { Card, CardContent } from "@/components/ui/card";

export function TestimonialsSection() {
  return (
    <section className="px-4 py-12 md:px-8 md:py-16">
      <div className="page-shell">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="mb-10 text-center"
        >
          <div className="section-eyebrow">Client testimonials</div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Trusted by decorators and print shops.
          </h2>
        </motion.div>

        <div className="grid gap-5 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            >
              <Card3D className="h-full rounded-[2rem]" intensity={8}>
                <Card className="glass-panel premium-shadow rounded-[2rem] border-border/80">
                  <CardContent className="p-6">
                    <div className="mb-4 flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm leading-7 text-muted-foreground">
                      &ldquo;{item.text}&rdquo;
                    </p>
                    <div className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {item.name.split(" ").map((p) => p[0]).join("")}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.company}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Card3D>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
