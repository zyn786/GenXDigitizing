import type { Metadata } from "next";
import type { Route } from "next";

import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const metadata: Metadata = { title: buildTitle("Notifications") };

const STATUS_TONES: Record<string, string> = {
  SENT: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  DELIVERED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  SEEN: "border-teal-500/20 bg-teal-500/10 text-teal-600 dark:text-teal-400",
  FAILED: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",
  PENDING: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export default async function AdminNotificationsPage() {
  const logs = await prisma.notificationLog.findMany({
    orderBy: { createdAt: "desc" }, take: 100,
    select: { id: true, eventType: true, audience: true, channel: true, status: true, recipientAddress: true, recipientUser: { select: { email: true } }, sentAt: true, createdAt: true },
  });

  return (
    <div className="grid gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href={"/admin/dashboard" as Route}>Admin</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Notifications</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section>
        <p className="section-eyebrow">Notification log</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">Notifications</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Delivery log for all outbound events — email, in-app, and browser notifications.
        </p>
      </section>

      {logs.length === 0 ? (
        <div className="rounded-[2rem] border border-border/60 bg-card/70 px-5 py-10 text-center text-sm text-muted-foreground">No notification logs yet.</div>
      ) : (
        <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/70">
          <div className="hidden grid-cols-[1.2fr_0.9fr_0.8fr_0.8fr_1fr_0.8fr] gap-4 border-b border-border/60 px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:grid">
            <div>Event</div><div>Audience</div><div>Channel</div><div>Status</div><div>Target</div><div>Sent</div>
          </div>
          <div className="divide-y divide-border/60">
            {logs.map((item) => {
              const target = item.recipientAddress ?? item.recipientUser?.email ?? "—";
              const sent = item.sentAt ? new Date(item.sentAt).toLocaleDateString() : item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—";
              return (
                <div key={item.id} className="grid grid-cols-[1.2fr_0.9fr_0.8fr_0.8fr_1fr_0.8fr] gap-4 px-5 py-4 text-sm">
                  <p className="font-medium">{item.eventType}</p>
                  <p className="text-muted-foreground">{item.audience}</p>
                  <p className="text-muted-foreground">{item.channel}</p>
                  <div>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_TONES[item.status] ?? "border-border/60 bg-muted/60 text-muted-foreground"}`}>{item.status}</span>
                  </div>
                  <p className="truncate text-muted-foreground">{target}</p>
                  <p className="text-xs text-muted-foreground">{sent}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
