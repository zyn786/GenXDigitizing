import Link from "next/link";
import { ArrowRight, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ServicesPageCta() {
  return (
    <section className="px-4 pb-20 pt-8 md:px-8 md:pb-28">
      <div className="page-shell">
        <Card className="glass-panel premium-shadow relative overflow-hidden rounded-2xl border-border/80">
          <CardContent className="relative p-8 md:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  <MessageSquare className="h-3 w-3" />
                  Ready to move forward
                </div>
                <h2 className="max-w-xl text-3xl font-semibold tracking-tight md:text-4xl">
                  Start with the right service and move into a managed order experience.
                </h2>
                <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
                  Send us your artwork, get a proof within 24 hours, and manage every order
                  from your client portal.
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-3">
                <Button asChild variant="premium" shape="pill" size="lg">
                  <Link href="/contact">
                    Contact us
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
