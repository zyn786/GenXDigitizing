import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { portfolioItems } from "@/lib/marketing-data";

const whyPoints = [
  {
    title: "Every service type covered",
    desc: "Embroidery digitizing, vector art, and custom patches — all handled in one place.",
  },
  {
    title: "Proof-first, revision-inclusive",
    desc: "Every job gets a production proof before delivery. Revisions run until you approve.",
  },
  {
    title: "Trusted by decorators and print shops",
    desc: "Fast turnarounds, clear specs, and files your machine operators can run without callbacks.",
  },
  {
    title: "Built for teams of any size",
    desc: "From single one-off orders to high-volume runs — pricing and workflow scale with you.",
  },
];

export function BeforeAfterShowcase() {
  return (
    <section className="relative overflow-hidden bg-[#f7f7fb] px-4 py-10 text-slate-950 dark:bg-[#050814] dark:text-white md:px-8 md:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.12),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.1),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.08),transparent_38%)] dark:bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.14),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.12),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.1),transparent_38%)]" />

      <div className="page-shell relative z-10 grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <Card className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white/80 shadow-sm shadow-slate-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045] dark:shadow-black/20 sm:rounded-[1.75rem] lg:rounded-[2rem]">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10 opacity-70" />

          <CardHeader className="relative z-10 p-5 pb-3 sm:p-6 sm:pb-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200">
              <Sparkles className="h-3.5 w-3.5" />
              Before / After
            </div>

            <CardTitle className="mt-4 max-w-xl text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white sm:text-3xl">
              Transformation visuals that sell craftsmanship.
            </CardTitle>

            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-white/55">
              Pair source artwork with polished outcomes to show cleanup
              quality, stitch intelligence, and production readiness.
            </p>
          </CardHeader>

          <CardContent className="relative z-10 grid gap-3 px-5 pb-5 sm:px-6 sm:pb-6">
            {portfolioItems.map((item) => (
              <div
                key={item.slug}
                className="rounded-[1.35rem] border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.055] sm:rounded-[1.5rem]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black tracking-tight text-slate-950 dark:text-white">
                      {item.title}
                    </div>
                    <div className="mt-0.5 text-xs font-medium text-slate-500 dark:text-white/70">
                      {item.tag}
                    </div>
                  </div>

                  <Badge className="shrink-0 rounded-full border-slate-200 bg-white/70 text-[10px] text-slate-500 dark:border-white/10 dark:bg-white/[0.055] dark:text-white/70">
                    Case study
                  </Badge>
                </div>

                <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-white/60">
                      Before
                    </div>
                    <div className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-white/50">
                      {item.before}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-3.5 dark:border-indigo-400/20 dark:bg-indigo-400/10">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
                      After
                    </div>
                    <div className="mt-1.5 text-sm leading-6 font-medium text-slate-800 dark:text-white/80">
                      {item.after}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white/80 shadow-sm shadow-slate-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045] dark:shadow-black/20 sm:rounded-[1.75rem] lg:rounded-[2rem]">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-blue-500/10 opacity-70" />

            <CardHeader className="relative z-10 p-5 pb-3 sm:p-6 sm:pb-4">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Why choose us
              </div>
            </CardHeader>

            <CardContent className="relative z-10 grid gap-3 px-5 pb-5 sm:px-6 sm:pb-6 md:grid-cols-2">
              {whyPoints.map(({ title, desc }) => (
                <div
                  key={title}
                  className="rounded-[1.35rem] border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.055]"
                >
                  <div className="text-sm font-black tracking-tight text-slate-950 dark:text-white">
                    {title}
                  </div>

                  <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-white/55">
                    {desc}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white/80 shadow-sm shadow-slate-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045] dark:shadow-black/20 sm:rounded-[1.75rem] lg:rounded-[2rem]">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10 opacity-70" />

            <CardContent className="relative z-10 p-5 sm:p-6">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-700 dark:text-indigo-300">
                Portfolio
              </div>

              <div className="mt-2 text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                Want the full showcase?
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-white/55">
                Browse more filters, case study stories, and visual proof
                clients expect before trusting a premium service provider.
              </p>

              <Link
                href="/portfolio"
                className="mt-5 inline-flex min-h-[40px] items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400 dark:text-slate-950 dark:hover:bg-indigo-300 sm:text-sm"
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