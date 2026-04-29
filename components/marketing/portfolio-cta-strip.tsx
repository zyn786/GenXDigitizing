import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function PortfolioCtaStrip() {
  return (
    <section className="px-4 pb-20 pt-8 md:px-8 md:pb-28">
      <div className="page-shell">
        <Card className="glass-panel premium-shadow relative overflow-hidden rounded-[2.5rem] border-border/80">
          <div className="pointer-events-none absolute -left-16 -top-16 h-52 w-52 rounded-full bg-accent/10 blur-3xl" />
          <CardContent className="relative p-8 md:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="section-eyebrow">Next step</div>
                <h2 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight md:text-4xl">
                  Ready to move from visual proof to a real order?
                </h2>
                <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
                  Share your artwork and get a production-ready proof within 24 hours.
                  No setup fees, revisions included.
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-3">
                <Link href="/contact" className="btn-primary">
                  Start a project
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/login" className="btn-outline">
                  Open portal
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
