import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { portfolioItems } from "@/lib/marketing-data";

const whyPoints = [
  {
    title: "Niche-aware service presentation",
    desc: "Each service group is framed for the way real decorators and print shops actually buy.",
  },
  {
    title: "Secure workflow narrative",
    desc: "Public messaging prepares prospects for private uploads, proofs, and delivery.",
  },
  {
    title: "Premium trust language",
    desc: "The site feels polished and deliberate instead of generic or low-trust.",
  },
  {
    title: "Future-ready information architecture",
    desc: "Content structure built to extend into the quote engine, dashboards, and CMS.",
  },
];

export function BeforeAfterShowcase() {
  return (
    <section className="px-4 py-12 md:px-8 md:py-16">
      <div className="page-shell grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        {/* Before / After column */}
        <Card className="glass-panel premium-shadow rounded-[2rem] border-border/80">
          <CardHeader>
            <div className="section-eyebrow">Before / After</div>
            <CardTitle className="mt-1 text-2xl">
              Transformation visuals that sell craftsmanship.
            </CardTitle>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Pair source artwork with polished outcomes to show depth, cleanup quality, stitch
              intelligence, and production readiness.
            </p>
          </CardHeader>

          <CardContent className="grid gap-3">
            {portfolioItems.map((item) => (
              <div
                key={item.slug}
                className="rounded-[1.75rem] border border-border/80 bg-secondary/50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{item.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{item.tag}</div>
                  </div>
                  <Badge className="rounded-full border-border/80 bg-secondary text-muted-foreground">
                    Case study
                  </Badge>
                </div>

                <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/80 bg-background/70 p-3.5">
                    <div className="section-eyebrow text-[10px]">Before</div>
                    <div className="mt-1.5 text-sm text-muted-foreground">{item.before}</div>
                  </div>
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5">
                    <div className="section-eyebrow text-[10px] text-primary">After</div>
                    <div className="mt-1.5 text-sm">{item.after}</div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="grid gap-4">
          <Card className="glass-panel premium-shadow rounded-[2rem] border-border/80">
            <CardHeader>
              <div className="section-eyebrow">Why choose us</div>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {whyPoints.map(({ title, desc }) => (
                <div key={title} className="rounded-[1.75rem] border border-border/80 bg-secondary/50 p-4">
                  <div className="text-sm font-semibold">{title}</div>
                  <div className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-panel premium-shadow rounded-[2rem] border-border/80">
            <CardContent className="p-6">
              <div className="section-eyebrow">Portfolio</div>
              <div className="mt-2 text-xl font-semibold">Want the full showcase?</div>

              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Browse more filters, case study stories, and the visual proof clients expect
                before trusting a premium service provider.
              </p>

              <Link
                href="/portfolio"
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                View Portfolio
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
