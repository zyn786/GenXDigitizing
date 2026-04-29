import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { faqItems } from "@/lib/marketing-data";

const steps = [
  "Choose service + niche",
  "Share artwork + production goals",
  "Review proof + revision path",
  "Pay, download, reorder",
];

export function ProcessSection() {
  return (
    <section className="px-4 py-12 md:px-8 md:py-16">
      <div className="page-shell grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Card className="glass-panel premium-shadow rounded-[2rem] border-border/80">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="section-eyebrow">Process</div>
                <CardTitle className="mt-1 text-2xl">From upload to delivery</CardTitle>
              </div>
              <Badge className="rounded-full border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:border-emerald-400/20 dark:bg-emerald-500/15 dark:text-emerald-300">
                Operational clarity
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className="rounded-[1.75rem] border border-border/80 bg-secondary/60 p-4"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
                    0{index + 1}
                  </div>
                  <div className="text-sm font-medium leading-6">{step}</div>
                </div>
              ))}
            </div>

            <Link
              href="/contact"
              className="mt-5 inline-flex rounded-2xl border border-border/80 bg-secondary/60 px-5 py-2.5 text-sm font-medium transition hover:bg-secondary"
            >
              Start with a quote conversation
            </Link>
          </CardContent>
        </Card>

        <Card className="glass-panel premium-shadow rounded-[2rem] border-border/80">
          <CardHeader>
            <div className="section-eyebrow">FAQ</div>
            <CardTitle className="mt-1 text-2xl">Clear answers that reduce hesitation.</CardTitle>
          </CardHeader>

          <CardContent>
            <Accordion type="single" collapsible className="space-y-3">
              {faqItems.map((item) => (
                <AccordionItem
                  key={item.question}
                  value={item.question}
                  className="rounded-[1.5rem] border border-border/80 bg-secondary/50 px-4"
                >
                  <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-7 text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
