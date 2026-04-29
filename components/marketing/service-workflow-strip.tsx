import { ArrowRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    step: "01",
    title: "Request a quote or place order",
    text: "Select your service, share your artwork, and tell us about placement, size, and production needs.",
  },
  {
    step: "02",
    title: "Upload artwork and references",
    text: "Share your logo file in any format — JPG, PNG, PDF, AI. We handle the rest.",
  },
  {
    step: "03",
    title: "Review proofs and revisions",
    text: "We send a stitch-ready proof within 24 hours. Request changes until it's right.",
  },
  {
    step: "04",
    title: "Download and run",
    text: "Approve and download your production-ready file in your machine format. Reorder any time.",
  },
];

export function ServiceWorkflowStrip() {
  return (
    <section className="px-4 py-8 md:px-8 md:py-10">
      <div className="page-shell">
        <div className="mb-8 max-w-2xl">
          <div className="section-eyebrow">Order workflow</div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            From artwork to production-ready file in four clear steps.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <Card
              key={step.step}
              className="glass-panel card-hover premium-shadow relative rounded-[2rem] border-border/80"
            >
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-3xl font-bold tracking-tight gradient-text opacity-50">
                    {step.step}
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="hidden h-4 w-4 text-muted-foreground/30 xl:block" />
                  )}
                </div>
                <div className="text-sm font-semibold">{step.title}</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
