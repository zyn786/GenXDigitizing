import type { Metadata } from "next";

import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: buildTitle("Notification Rules"),
};

export default async function AdminNotificationRulesPage() {
  const rules = await prisma.notificationRule.findMany({
    orderBy: [{ eventType: "asc" }, { audience: "asc" }],
  });

  return (
    <div className="grid gap-6">
      <section>
        <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Notification rules
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Notification rules
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          Per-event delivery rules covering timing, channel, and audience.
          Templates are fixed; adjust timing and routing per event type as
          needed.
        </p>
      </section>

      {rules.length === 0 ? (
        <div className="rounded-[2rem] border border-border/80 bg-card/70 px-5 py-10 text-center text-sm text-muted-foreground">
          No notification rules configured yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/70">
          <div className="grid grid-cols-[1.1fr_0.8fr_0.8fr_0.8fr_0.8fr_0.6fr] gap-4 border-b border-border/80 px-5 py-4 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            <div>Event</div>
            <div>Audience</div>
            <div>Channel</div>
            <div>Timing</div>
            <div>Mode</div>
            <div>Enabled</div>
          </div>

          <div className="divide-y divide-border/80">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="grid grid-cols-[1.1fr_0.8fr_0.8fr_0.8fr_0.8fr_0.6fr] gap-4 px-5 py-4 text-sm"
              >
                <div className="font-medium">{rule.eventType}</div>
                <div className="text-muted-foreground">{rule.audience}</div>
                <div className="text-muted-foreground">{rule.channel}</div>
                <div className="text-muted-foreground">
                  {rule.delayMinutes === 0
                    ? "Immediate"
                    : `${rule.delayMinutes} min`}
                </div>
                <div className="text-muted-foreground">
                  {rule.isTransactional ? "Transactional" : "Reminder"}
                </div>
                <div>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${
                      rule.isEnabled
                        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-400"
                        : "border-border/80 bg-secondary/80 text-muted-foreground"
                    }`}
                  >
                    {rule.isEnabled ? "On" : "Off"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
