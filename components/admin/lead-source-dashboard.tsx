"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const LEAD_SOURCE_LABELS: Record<string, string> = {
  WEBSITE: "Website",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  GOOGLE: "Google",
  REFERRAL: "Referral",
  WHATSAPP: "WhatsApp",
  DIRECT_VISIT: "Direct Visit",
  CAMPAIGN: "Campaign",
  MANUAL: "Manual Entry",
  UNKNOWN: "Unknown",
};

const LEAD_SOURCE_COLORS: Record<string, string> = {
  WEBSITE: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  FACEBOOK: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  INSTAGRAM: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  GOOGLE: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  REFERRAL: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  WHATSAPP: "bg-teal-500/15 text-teal-400 border-teal-500/20",
  DIRECT_VISIT: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  CAMPAIGN: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  MANUAL: "bg-slate-500/15 text-slate-400 border-slate-500/20",
  UNKNOWN: "bg-secondary text-muted-foreground border-border",
};

type SourceGroup = { leadSource: string | null; _count: { leadSource: number } };
type Client = {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: string;
  clientProfile: { leadSource: string | null; companyName: string | null; totalOrderCount: number } | null;
};

export function LeadSourceDashboard() {
  const [data, setData] = React.useState<{
    profileSources: SourceGroup[];
    orderSources: SourceGroup[];
    recentClients: Client[];
  } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/admin/leads")
      .then((r) => r.json())
      .then((d) => { if (d.ok) setData(d); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading lead source data…
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-muted-foreground">Failed to load data.</div>;
  }

  const total = data.profileSources.reduce((s, g) => s + g._count.leadSource, 0);

  return (
    <div className="space-y-6">
      {/* Source breakdown */}
      <section className="rounded-[1.75rem] border border-border/80 bg-card p-6">
        <h3 className="font-semibold">Lead Source Breakdown</h3>
        <p className="mt-1 text-sm text-muted-foreground">{total} total client profiles tracked</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.profileSources.map((group) => {
            const key = group.leadSource ?? "UNKNOWN";
            const pct = total > 0 ? Math.round((group._count.leadSource / total) * 100) : 0;
            return (
              <div key={key} className="rounded-2xl border border-border/60 bg-background/50 p-4">
                <div className="flex items-center justify-between">
                  <Badge className={`rounded-full border text-xs ${LEAD_SOURCE_COLORS[key] ?? LEAD_SOURCE_COLORS.UNKNOWN}`}>
                    {LEAD_SOURCE_LABELS[key] ?? key}
                  </Badge>
                  <span className="text-lg font-bold">{group._count.leadSource}</span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{pct}% of total</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent clients */}
      <section className="rounded-[1.75rem] border border-border/80 bg-card p-6">
        <h3 className="font-semibold">Recent Client Registrations</h3>
        <p className="mt-1 text-sm text-muted-foreground">Last 50 clients with lead source info</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="pb-3 text-left">Client</th>
                <th className="pb-3 text-left">Company</th>
                <th className="pb-3 text-left">Source</th>
                <th className="pb-3 text-right">Orders</th>
                <th className="pb-3 text-right">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {data.recentClients.map((client) => {
                const src = client.clientProfile?.leadSource ?? "UNKNOWN";
                return (
                  <tr key={client.id} className="hover:bg-muted/30 transition">
                    <td className="py-3">
                      <div className="font-medium">{client.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{client.email}</div>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {client.clientProfile?.companyName ?? "—"}
                    </td>
                    <td className="py-3">
                      <Badge className={`rounded-full border text-xs ${LEAD_SOURCE_COLORS[src] ?? LEAD_SOURCE_COLORS.UNKNOWN}`}>
                        {LEAD_SOURCE_LABELS[src] ?? src}
                      </Badge>
                    </td>
                    <td className="py-3 text-right font-medium">
                      {client.clientProfile?.totalOrderCount ?? 0}
                    </td>
                    <td className="py-3 text-right text-muted-foreground">
                      {new Date(client.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
