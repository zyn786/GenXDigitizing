import { ArrowRight, CheckCircle2 } from "lucide-react";

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
    <section className="relative overflow-hidden bg-[#f7f7fb] px-4 py-10 text-slate-950 dark:bg-[#050814] dark:text-white md:px-8 md:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.12),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.1),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.08),transparent_38%)] dark:bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.14),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.12),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.1),transparent_38%)]" />

      <div className="page-shell relative z-10">
        <div className="mb-7 max-w-2xl md:mb-9">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-white/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06] dark:text-indigo-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Order workflow
          </div>

          <h2 className="mt-4 max-w-2xl text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white sm:text-3xl md:text-4xl">
            From artwork to production-ready file in four clear steps.
          </h2>
        </div>

        {/* Mobile timeline */}
        <div className="relative grid gap-5 md:hidden">
          <div className="absolute bottom-6 left-[25px] top-4 w-px bg-gradient-to-b from-indigo-500/35 via-slate-300/50 to-transparent dark:from-violet-400/45 dark:via-white/10" />

          {steps.map((step) => (
            <div
              key={step.step}
              className="relative grid grid-cols-[52px_1fr] items-start gap-3"
            >
              <div className="relative z-10 pt-1">
                <div className="text-3xl font-black leading-none tracking-[-0.08em] text-indigo-600 drop-shadow-[0_0_16px_rgba(99,102,241,0.35)] dark:text-violet-400 dark:drop-shadow-[0_0_16px_rgba(168,85,247,0.55)]">
                  {step.step}
                </div>
              </div>

              <Card className="relative overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white/80 shadow-sm shadow-slate-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055] dark:shadow-black/20">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10" />

                <CardContent className="relative z-10 p-4">
                  <div className="mb-2 inline-flex rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-indigo-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300">
                    Step {step.step}
                  </div>

                  <h3 className="text-base font-black tracking-tight text-slate-950 dark:text-white">
                    {step.title}
                  </h3>

                  <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-white/55">
                    {step.text}
                  </p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Desktop/tablet grid */}
        <div className="hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <Card
              key={step.step}
              className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white/80 shadow-sm shadow-slate-950/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:bg-white hover:shadow-xl hover:shadow-slate-950/10 dark:border-white/10 dark:bg-white/[0.045] dark:shadow-black/20 dark:hover:border-white/[0.16] dark:hover:bg-white/[0.065]"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10 opacity-70" />

              <CardContent className="relative z-10 p-5 lg:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 bg-clip-text text-3xl font-black tracking-tight text-transparent opacity-70 dark:from-indigo-300 dark:via-violet-300 dark:to-blue-300">
                    {step.step}
                  </div>

                  {index < steps.length - 1 && (
                    <ArrowRight className="hidden h-4 w-4 text-slate-400/50 transition group-hover:translate-x-1 group-hover:text-indigo-500 xl:block" />
                  )}
                </div>

                <h3 className="text-sm font-black tracking-tight text-slate-950 dark:text-white">
                  {step.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-white/55">
                  {step.text}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}