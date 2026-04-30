import Link from "next/link";
import { ArrowRight, Images } from "lucide-react";

// Client stories coming soon — see TODO in lib/marketing-data.ts to add real testimonials.
// When ready: restore the original component below and re-enable the testimonials array.
export function TestimonialsSection() {
  return (
    <section className="px-4 py-12 md:px-8 md:py-16">
      <div className="page-shell">
        <div className="flex flex-col items-center gap-6 rounded-[2rem] border border-border/80 bg-card/60 py-16 text-center backdrop-blur-xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Images className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="section-eyebrow">Client stories</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Reviews coming soon.
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-7 text-muted-foreground">
              In the meantime, see our work in the portfolio — before and after examples from real production jobs.
            </p>
          </div>
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            View the Portfolio
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/*
 * TODO: Restore this when real client testimonials are available.
 * Update lib/marketing-data.ts > testimonials array with real quotes.
 *
 * "use client";
 * import { motion } from "framer-motion";
 * import { Star } from "lucide-react";
 * import { testimonials } from "@/lib/marketing-data";
 * import { Card3D } from "@/components/ui/card-3d";
 * import { Card, CardContent } from "@/components/ui/card";
 *
 * export function TestimonialsSection() {
 *   return (
 *     <section className="px-4 py-12 md:px-8 md:py-16">
 *       <div className="page-shell">
 *         <div className="mb-10 text-center">
 *           <div className="section-eyebrow">Client testimonials</div>
 *           <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
 *             Trusted by decorators and print shops.
 *           </h2>
 *         </div>
 *         <div className="grid gap-5 lg:grid-cols-3">
 *           {testimonials.map((item, index) => (
 *             <Card3D key={item.name} className="h-full rounded-[2rem]" intensity={8}>
 *               <Card className="glass-panel premium-shadow rounded-[2rem] border-border/80">
 *                 <CardContent className="p-6">
 *                   <div className="mb-4 flex gap-0.5">
 *                     {Array.from({ length: 5 }).map((_, i) => (
 *                       <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
 *                     ))}
 *                   </div>
 *                   <p className="text-sm leading-7 text-muted-foreground">&ldquo;{item.text}&rdquo;</p>
 *                   <div className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
 *                     <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
 *                       {item.name.split(" ").map((p) => p[0]).join("")}
 *                     </div>
 *                     <div>
 *                       <div className="text-sm font-medium">{item.name}</div>
 *                       <div className="text-xs text-muted-foreground">{item.company}</div>
 *                     </div>
 *                   </div>
 *                 </CardContent>
 *               </Card>
 *             </Card3D>
 *           ))}
 *         </div>
 *       </div>
 *     </section>
 *   );
 * }
 */
