import { HelpCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const notes = [
  {
    q: "What formats do you deliver?",
    a: "We deliver in DST, PES, EMB, EXP, JEF, and most major machine formats. Just tell us your machine when ordering.",
  },
  {
    q: "Is rush turnaround available?",
    a: "Yes. Same-day and 4-hour rush options are available for most jobs. Rush pricing is quoted individually based on complexity and timing.",
  },
  {
    q: "What if the proof needs changes?",
    a: "Starter orders include one revision. Production orders include unlimited revisions until you approve. Rush jobs follow the same revision process.",
  },
  {
    q: "Do you digitize patches and specialty work?",
    a: "Yes — embroidered patches, chenille, 3D puff, appliqué, and specialty work are all quoted individually under the Rush & Specialty tier.",
  },
];

export function PricingNotesPanel() {
  return (
    <section className="relative overflow-hidden bg-[#f7f7fb] px-4 py-10 text-slate-950 dark:bg-[#050814] dark:text-white md:px-8 md:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.12),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.1),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.08),transparent_38%)] dark:bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.14),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.12),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.1),transparent_38%)]" />

      <div className="page-shell relative z-10">
        <Card className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white/80 shadow-sm shadow-slate-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045] dark:shadow-black/20 sm:rounded-[1.75rem] lg:rounded-[2rem]">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10 opacity-70" />

          <CardHeader className="relative z-10 p-5 pb-3 sm:p-6 sm:pb-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200">
              <HelpCircle className="h-3.5 w-3.5" />
              Pricing FAQ
            </div>

            <CardTitle className="mt-4 text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white sm:text-3xl">
              Common pricing questions
            </CardTitle>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-white/55">
              Clear answers about formats, rush jobs, revisions, and specialty
              embroidery work.
            </p>
          </CardHeader>

          <CardContent className="relative z-10 grid gap-3 px-5 pb-5 sm:px-6 sm:pb-6 md:grid-cols-2 md:gap-4">
            {notes.map((item, index) => (
              <div
                key={item.q}
                className="group relative overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-lg hover:shadow-slate-950/5 dark:border-white/10 dark:bg-white/[0.055] dark:hover:border-white/[0.16] dark:hover:bg-white/[0.075] sm:rounded-[1.5rem] sm:p-5"
              >
                <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-gradient-to-br from-slate-100 to-transparent opacity-70 dark:from-white/[0.06]" />

                <div className="relative z-10">
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl border border-indigo-500/10 bg-indigo-500/10 text-xs font-black text-indigo-700 dark:border-indigo-400/10 dark:bg-indigo-400/10 dark:text-indigo-300">
                    {index + 1}
                  </div>

                  <h3 className="text-sm font-black tracking-tight text-slate-950 dark:text-white">
                    {item.q}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-white/55">
                    {item.a}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}