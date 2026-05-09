import { Clock3, FileCheck, Lock, RefreshCw, Shield, Zap } from "lucide-react";

const trustBadges = [
  { icon: Clock3, label: "24-hr turnaround" },
  { icon: Lock, label: "Private delivery" },
  { icon: FileCheck, label: "Proof workflow" },
  { icon: Shield, label: "Secure portal" },
  { icon: Zap, label: "Rush available" },
  { icon: RefreshCw, label: "Revisions included" },
];

export function TrustStrip() {
  return (
    <section className="px-4 py-4 sm:py-5 md:px-8 md:py-6">
      <div className="page-shell">
        <div className="rounded-[1.35rem] border border-slate-200 bg-white/70 px-3 py-3 shadow-sm shadow-slate-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045] dark:shadow-black/20 sm:rounded-[1.75rem] sm:px-5 sm:py-4">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible lg:grid-cols-6">
            {trustBadges.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex min-w-[148px] shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-[11px] font-bold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/[0.055] dark:text-white/58 dark:hover:bg-white/[0.08] sm:min-w-0 sm:text-xs"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
                  <Icon className="h-3.5 w-3.5" />
                </span>

                <span className="leading-snug">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}