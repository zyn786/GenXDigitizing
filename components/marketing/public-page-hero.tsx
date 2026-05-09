import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

type PublicPageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function PublicPageHero({
  eyebrow,
  title,
  description,
  children,
}: PublicPageHeroProps) {
  return (
    <section className="relative isolate overflow-hidden bg-[#f7f7fb] px-4 pb-10 pt-24 text-slate-950 dark:bg-[#050814] dark:text-white sm:pt-28 md:px-8 md:pb-14 md:pt-32 lg:pt-36">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-72 w-[24rem] -translate-x-1/2 rounded-full bg-indigo-500/[0.08] blur-3xl dark:bg-indigo-400/[0.08] sm:w-[40rem]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.12),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.1),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.08),transparent_38%)] dark:bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.14),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.12),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(59,130,246,0.1),transparent_38%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:radial-gradient(ellipse_75%_70%_at_50%_45%,black,transparent_78%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] md:bg-[size:42px_42px]" />
      </div>

      <div className="page-shell relative z-10">
        <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white/80 p-5 shadow-sm shadow-slate-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045] dark:shadow-black/20 sm:rounded-[1.75rem] sm:p-6 md:rounded-[2rem] md:p-10">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10 opacity-70" />
          <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-gradient-to-br from-slate-100 to-transparent opacity-70 dark:from-white/[0.06]" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200 sm:tracking-[0.22em]">
              <Sparkles className="h-3.5 w-3.5" />
              {eyebrow}
            </div>

            <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-[-0.05em] text-slate-950 dark:text-white sm:text-4xl md:text-5xl lg:text-6xl">
              {title}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 dark:text-white/58 sm:text-base sm:leading-7 lg:text-lg lg:leading-8">
              {description}
            </p>

            {children && (
              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
                {children}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}