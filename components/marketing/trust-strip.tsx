import { Clock3, FileCheck, Lock, RefreshCw, Shield, Zap } from "lucide-react";

const trustBadges = [
  { icon: Clock3, label: "24-hr standard turnaround" },
  { icon: Lock, label: "Private file delivery" },
  { icon: FileCheck, label: "Proof & revision workflow" },
  { icon: Shield, label: "Secure client portal" },
  { icon: Zap, label: "Rush jobs available" },
  { icon: RefreshCw, label: "Revisions included" },
];

export function TrustStrip() {
  return (
    <section className="px-4 py-6 md:px-8">
      <div className="page-shell">
        <div className="glass-panel premium-shadow rounded-[1.75rem] border-border/80 px-5 py-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {trustBadges.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-2xl border border-border/60 bg-secondary/50 px-3 py-2.5 text-xs font-medium text-muted-foreground"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
