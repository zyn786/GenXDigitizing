import { Phone, Mail } from "lucide-react";

export function ContactStrip() {
  return (
    <div
      className="relative flex h-9 items-center justify-center gap-4 overflow-hidden rounded-[1.25rem] border border-slate-200/70 bg-white/55 px-4 shadow-sm shadow-slate-950/5 backdrop-blur-xl transition-colors duration-300 dark:border-white/[0.08] dark:bg-[#07111f]/45 dark:shadow-black/20 sm:justify-start sm:gap-6 sm:px-5"
      aria-label="Contact information"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(99,102,241,0.08),transparent_34%),radial-gradient(circle_at_85%_70%,rgba(168,85,247,0.05),transparent_36%)]" />

      <a
        href="tel:+1234567890"
        className="relative z-10 inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-slate-500 transition-colors hover:text-[#6D35FF] dark:text-slate-400 dark:hover:text-indigo-300 sm:text-xs"
      >
        <Phone className="h-3 w-3 shrink-0 text-[#6D35FF]/60 dark:text-indigo-400/60" />
        <span>+1 (234) 567-890</span>
      </a>

      <span className="relative z-10 h-3 w-px bg-slate-200/70 dark:bg-white/[0.08]" aria-hidden="true" />

      <a
        href="mailto:hello@genxdigitizing.com"
        className="relative z-10 inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-slate-500 transition-colors hover:text-[#6D35FF] dark:text-slate-400 dark:hover:text-indigo-300 sm:text-xs"
      >
        <Mail className="h-3 w-3 shrink-0 text-[#6D35FF]/60 dark:text-indigo-400/60" />
        <span>hello@genxdigitizing.com</span>
      </a>
    </div>
  );
}
