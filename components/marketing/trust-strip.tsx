import {
  Clock3,
  FileCheck,
  Lock,
  RefreshCw,
  Shield,
  Zap,
} from "lucide-react";

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
    <section className="relative overflow-hidden px-4 py-5 md:px-8 md:py-7">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#ffffff_0%,#f8f9ff_50%,#f3f6ff_100%)] dark:bg-[linear-gradient(180deg,#050814_0%,#0B1120_100%)]" />

      {/* Ambient glows */}
      <div className="absolute left-[-6rem] top-[-5rem] -z-10 h-56 w-56 rounded-full bg-[#6D35FF]/10 blur-3xl dark:bg-indigo-500/14" />

      <div className="absolute right-[-5rem] bottom-[-5rem] -z-10 h-52 w-52 rounded-full bg-[#2563EB]/10 blur-3xl dark:bg-blue-500/12" />

      {/* Grid texture */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:34px_34px] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)]" />

      <div className="page-shell">
        <div className="relative overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white/80 p-3 shadow-xl shadow-slate-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045] dark:shadow-black/25 sm:rounded-[1.9rem] sm:p-4">
          {/* Inner glow */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#6D35FF]/6 via-transparent to-[#2563EB]/6 dark:from-indigo-400/8 dark:to-cyan-400/6" />

          <div className="relative flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible lg:grid-cols-6">
            {trustBadges.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="group flex min-w-[152px] shrink-0 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/75 px-3 py-3 shadow-sm shadow-slate-950/[0.03] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#6D35FF]/20 hover:bg-white hover:shadow-lg hover:shadow-[#6D35FF]/10 dark:border-white/10 dark:bg-white/[0.055] dark:hover:bg-white/[0.08] sm:min-w-0"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-[#6D35FF]/10 bg-gradient-to-br from-[#6D35FF]/10 to-[#2563EB]/10 text-[#5B21B6] transition-all duration-300 group-hover:scale-105 dark:border-indigo-400/10 dark:from-indigo-400/10 dark:to-blue-400/10 dark:text-indigo-300">
                  <Icon className="h-4 w-4" />
                </span>

                <span className="text-[11px] font-black tracking-[0.01em] text-slate-700 dark:text-slate-200 sm:text-xs">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}