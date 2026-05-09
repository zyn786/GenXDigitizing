import Link from "next/link";
import { ArrowRight, CheckCircle2, HelpCircle } from "lucide-react";

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
    <section className="relative overflow-hidden bg-[#f7f7fb] px-4 py-10 text-slate-950 dark:bg-[#050814] dark:text-white md:px-8 md:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.12),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.1),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.08),transparent_38%)] dark:bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.14),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.12),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.1),transparent_38%)]" />

      <div className="page-shell relative z-10 grid gap-5 lg:grid-cols-[1fr_1fr] lg:items-start">
        <Card className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white/80 shadow-sm shadow-slate-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045] dark:shadow-black/20 sm:rounded-[1.75rem] lg:rounded-[2rem]">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10 opacity-70" />

          <CardHeader className="relative z-10 p-5 pb-3 sm:p-6 sm:pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Process
                </div>

                <CardTitle className="mt-4 text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white sm:text-3xl">
                  From upload to delivery
                </CardTitle>
              </div>

              <Badge className="w-fit rounded-full border-emerald-500/20 bg-emerald-500/10 text-[10px] font-bold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/15 dark:text-emerald-300">
                Operational clarity
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="relative z-10 px-5 pb-5 sm:px-6 sm:pb-6">
            {/* Mobile timeline */}
            <div className="relative grid gap-4 md:hidden">
              <div className="absolute bottom-6 left-[21px] top-4 w-px bg-gradient-to-b from-indigo-500/35 via-slate-300/50 to-transparent dark:from-violet-400/45 dark:via-white/10" />

              {steps.map((step, index) => (
                <div
                  key={step}
                  className="relative grid grid-cols-[44px_1fr] items-start gap-3"
                >
                  <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-500/20 bg-white text-sm font-black text-indigo-700 shadow-sm dark:border-violet-400/20 dark:bg-[#0b1120] dark:text-violet-300">
                    0{index + 1}
                  </div>

                  <div className="rounded-[1.25rem] border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.055]">
                    <div className="text-sm font-black leading-6 text-slate-950 dark:text-white">
                      {step}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop/tablet grid */}
            <div className="hidden gap-3 md:grid md:grid-cols-2">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className="rounded-[1.5rem] border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/[0.055] dark:hover:border-white/[0.16] dark:hover:bg-white/[0.075]"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-indigo-500/10 bg-indigo-500/10 text-sm font-black text-indigo-700 dark:border-indigo-400/10 dark:bg-indigo-400/10 dark:text-indigo-300">
                    0{index + 1}
                  </div>

                  <div className="text-sm font-black leading-6 text-slate-950 dark:text-white">
                    {step}
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/contact"
              className="mt-5 inline-flex min-h-[40px] items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2.5 text-xs font-bold text-indigo-700 transition hover:-translate-y-0.5 hover:bg-indigo-500/15 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200 dark:hover:bg-indigo-400/15 sm:text-sm"
            >
              Start with a quote conversation
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white/80 shadow-sm shadow-slate-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045] dark:shadow-black/20 sm:rounded-[1.75rem] lg:rounded-[2rem]">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-blue-500/10 opacity-70" />

          <CardHeader className="relative z-10 p-5 pb-3 sm:p-6 sm:pb-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200">
              <HelpCircle className="h-3.5 w-3.5" />
              FAQ
            </div>

            <CardTitle className="mt-4 text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white sm:text-3xl">
              Clear answers that reduce hesitation.
            </CardTitle>
          </CardHeader>

          <CardContent className="relative z-10 px-5 pb-5 sm:px-6 sm:pb-6">
            <Accordion type="single" collapsible className="space-y-3">
              {faqItems.map((item) => (
                <AccordionItem
                  key={item.question}
                  value={item.question}
                  className="rounded-[1.25rem] border border-slate-200 bg-white/70 px-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.055] sm:rounded-[1.5rem]"
                >
                  <AccordionTrigger className="text-left text-sm font-black text-slate-950 hover:no-underline dark:text-white">
                    {item.question}
                  </AccordionTrigger>

                  <AccordionContent className="text-sm leading-7 text-slate-600 dark:text-white/55">
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