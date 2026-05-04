import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ContactCtaStrip() {
  return (
    <section className="px-4 pb-20 pt-8 md:px-8 md:pb-28">
      <div className="page-shell">
        <Card className="glass-panel premium-shadow relative overflow-hidden rounded-[2.5rem] border-border/80">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <CardContent className="relative p-8 md:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="section-eyebrow">Explore more</div>
                <h2 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight md:text-4xl">
                  See the full range of embroidery and vector services we offer.
                </h2>
                <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
                  Browse services, view portfolio work, or log in to your client portal to
                  track an existing order.
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-3">
                <Button asChild variant="premium" shape="pill" size="lg">
                  <Link href="/services">
                    Explore services
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" shape="pill" size="lg">
                  <Link href="/login">Open portal</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
