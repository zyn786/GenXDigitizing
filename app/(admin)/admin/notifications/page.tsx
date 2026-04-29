import type { Metadata } from "next";

import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: buildTitle("Notifications"),
};

export default async function AdminNotificationsPage() {
  const logs = await prisma.notificationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      eventType: true,
      audience: true,
      channel: true,
      status: true,
      recipientAddress: true,
      recipientUser: { select: { email: true } },
      sentAt: true,
      createdAt: true,
    },
  });

  return (
    <div className="grid gap-6">
      <section>
        <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Notification log
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Notifications
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          Delivery log for all outbound events — email, in-app, and browser
          notifications. Use this to confirm what was sent, when, and whether
          it was delivered or seen.
        </p>
      </section>

      {logs.length === 0 ? (
        <div className="rounded-[2rem] border border-border/80 bg-card/70 px-5 py-10 text-center text-sm text-muted-foreground">
          No notification logs yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/70">
          <div className="grid grid-cols-[1.2fr_0.9fr_0.8fr_0.8fr_1fr_0.8fr] gap-4 border-b border-border/80 px-5 py-4 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            <div>Event</div>
            <div>Audience</div>
            <div>Channel</div>
            <div>Status</div>
            <div>Target</div>
            <div>Sent</div>
          </div>

          <div className="divide-y divide-border/80">
            {logs.map((item) => {
              const target =
                item.recipientAddress ??
                item.recipientUser?.email ??
                "—";
              const sent = item.sentAt
                ? new Date(item.sentAt).toLocaleDateString()
                : item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString()
                  : "—";
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[1.2fr_0.9fr_0.8fr_0.8fr_1fr_0.8fr] gap-4 px-5 py-4 text-sm"
                >
                  <div className="font-medium">{item.eventType}</div>
                  <div className="text-muted-foreground">{item.audience}</div>
                  <div className="text-muted-foreground">{item.channel}</div>
                  <div>
                    <span className="rounded-full border border-border/80 bg-secondary/80 px-3 py-1 text-xs">
                      {item.status}
                    </span>
                  </div>
                  <div className="truncate text-muted-foreground">{target}</div>
                  <div className="text-xs text-muted-foreground">{sent}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
