import type { OrderEvent } from "@/lib/workflow/types";

export function OrderTimeline({ events }: { events: OrderEvent[] }) {
  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div
          key={event.id}
          className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4"
        >
          <div className="text-xs uppercase tracking-[0.18em] text-white/40">
            {new Date(event.at).toLocaleString()}
          </div>
          <div className="mt-2 text-sm font-semibold text-white">
            {event.title}
          </div>
          <div className="mt-1 text-sm leading-7 text-white/65">{event.body}</div>
        </div>
      ))}
    </div>
  );
}
