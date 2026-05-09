import { Clock3, Mail, MessageSquare, RefreshCw } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const details = [
  {
    icon: Mail,
    title: "Email us",
    text: "Send your artwork and project details to get a quote within one business day.",
    value: "info@genxdigitizing.com",
  },
  {
    icon: Clock3,
    title: "Response time",
    text: "Standard inquiries are answered within 24 hours. Rush requests are prioritized.",
    value: "Within 24 hours",
  },
  {
    icon: RefreshCw,
    title: "Revisions included",
    text: "Production orders include unlimited revisions until you approve the final file.",
    value: "Revision-inclusive",
  },
  {
    icon: MessageSquare,
    title: "Client portal support",
    text: "Existing clients can open support tickets directly from their order dashboard.",
    value: "Portal-based support",
  },
];

export function ContactDetailsPanel() {
  return (
    <Card className="relative h-fit overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white/90 shadow-sm shadow-slate-950/5 backdrop-blur-xl dark:border-slate-800 dark:bg-[#0B1120] dark:shadow-black/30 sm:rounded-[1.75rem] lg:rounded-[2rem]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/8 via-transparent to-cyan-500/8 dark:from-indigo-400/8 dark:to-cyan-400/6" />
      <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-gradient-to-br from-slate-100 to-transparent opacity-80 dark:from-indigo-400/10" />

      <CardHeader className="relative z-10 p-5 pb-3 sm:p-6 sm:pb-4">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300">
          <MessageSquare className="h-3.5 w-3.5" />
          Contact details
        </div>

        <CardTitle className="mt-4 text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-slate-100 sm:text-3xl">
          How we work together
        </CardTitle>

        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
          Fast replies, clear proofs, and revisions until you&rsquo;re
          satisfied.
        </p>
      </CardHeader>

      <CardContent className="relative z-10 grid gap-3 px-5 pb-5 sm:px-6 sm:pb-6">
        {details.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="group relative overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-lg hover:shadow-slate-950/5 dark:border-slate-700 dark:bg-[#0F172A] dark:hover:border-slate-600 dark:hover:bg-[#111C31] dark:hover:shadow-black/20 sm:rounded-[1.5rem]"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/6 via-transparent to-cyan-500/6 dark:from-indigo-400/6 dark:to-cyan-400/5" />

              <div className="relative z-10 flex items-start gap-3 sm:gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/10 bg-indigo-500/10 text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300">
                  <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <div className="text-sm font-black tracking-tight text-slate-950 dark:text-slate-100">
                    {item.title}
                  </div>

                  <div className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {item.text}
                  </div>

                  <div className="mt-2 inline-flex rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-bold text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300">
                    {item.value}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}