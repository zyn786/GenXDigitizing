import type { OrderEvent } from "@/lib/workflow/types";

export function OrderTimeline({ events }: { events: OrderEvent[] }) {
  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={event.id} className="rounded-2xl border border-border/60 bg-muted/30 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{new Date(event.at).toLocaleString()}</p>
          <p className="mt-2 text-sm font-semibold">{event.title}</p>
          <p className="mt-1 text-sm leading-7 text-muted-foreground">{event.body}</p>
        </div>
      ))}
    </div>
  );
}
