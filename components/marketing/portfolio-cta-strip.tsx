import Link from "next/link";
import { ArrowRight, FolderOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function PortfolioCtaStrip() {
  return (
    <section className="relative overflow-hidden bg-[#f7f7fb] px-4 pb-16 pt-8 text-slate-950 dark:bg-[#050814] dark:text-white md:px-8 md:pb-24 md:pt-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.12),transparent_32%),radial-gradient(circle_at_85%_80%,rgba(168,85,247,0.1),transparent_34%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.14),transparent_32%),radial-gradient(circle_at_85%_80%,rgba(168,85,247,0.12),transparent_34%)]" />

      <div className="page-shell relative z-10">
        <Card className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white/85 shadow-sm shadow-slate-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055] dark:shadow-black/20 sm:rounded-[1.75rem] lg:rounded-[2rem]">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10" />
          <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-gradient-to-br from-slate-100 to-transparent opacity-80 dark:from-white/[0.06]" />

          <CardContent className="relative z-10 p-5 sm:p-6 md:p-10 lg:p-12">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200">
                  <FolderOpen className="h-3.5 w-3.5" />
                  Next step
                </div>

                <h2 className="mt-4 max-w-2xl text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white sm:text-3xl md:text-4xl">
                  Ready to move from visual proof to a real order?
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-white/58 sm:text-base sm:leading-7 md:mt-4">
                  Share your artwork and get a production-ready proof within 24
                  hours. No setup fees, revisions included.
                </p>
              </div>

              <div className="flex w-full flex-col gap-2.5 sm:flex-row lg:w-auto lg:shrink-0 lg:justify-end lg:gap-3">
                <Button
                  asChild
                  variant="premium"
                  shape="pill"
                  size="lg"
                  className="min-h-[42px] w-full text-sm sm:w-auto"
                >
                  <Link href="/contact">
                    Start a project
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  shape="pill"
                  size="lg"
                  className="min-h-[42px] w-full border-slate-300 bg-white/70 text-sm text-slate-800 hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1] sm:w-auto"
                >
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