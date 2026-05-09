import Link from "next/link";
import { ArrowRight, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ServicesPageCta() {
  return (
    <section className="px-4 pb-14 pt-6 sm:pb-16 md:px-8 md:pb-24 md:pt-8">
      <div className="page-shell">
        <Card className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white/75 shadow-sm shadow-slate-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045] dark:shadow-black/20 sm:rounded-[2rem]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.14),transparent_34%),radial-gradient(circle_at_85%_80%,rgba(168,85,247,0.1),transparent_34%)]" />

          <CardContent className="relative z-10 p-5 sm:p-6 md:p-10 lg:p-12">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200 sm:px-4 sm:text-xs sm:tracking-[0.2em]">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Ready to move forward
                </div>

                <h2 className="max-w-2xl text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white sm:text-3xl md:text-4xl">
                  Start with the right service and move into a managed order
                  experience.
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-white/58 sm:text-base sm:leading-7 md:mt-4">
                  Send us your artwork, get a proof within 24 hours, and manage
                  every order from your client portal.
                </p>
              </div>

              <div className="flex w-full flex-col gap-2.5 sm:flex-row lg:w-auto lg:shrink-0 lg:flex-wrap lg:justify-end lg:gap-3">
                <Button
                  asChild
                  variant="premium"
                  shape="pill"
                  size="lg"
                  className="w-full min-h-[42px] text-sm sm:w-auto"
                >
                  <Link href="/contact">
                    Contact us
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  shape="pill"
                  size="lg"
                  className="w-full min-h-[42px] text-sm sm:w-auto"
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