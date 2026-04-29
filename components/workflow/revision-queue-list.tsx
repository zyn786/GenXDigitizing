type RevisionQueueItem = {
  id: string;
  orderId: string;
  reference: string;
  title: string;
  body: string;
  status: string;
  createdAt: string;
};

export function RevisionQueueList({ items }: { items: RevisionQueueItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 text-sm text-white/60 backdrop-blur-xl">
        No open revisions right now.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article
          key={item.id}
          className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl"
        >
          <div className="text-xs uppercase tracking-[0.18em] text-white/40">
            {item.reference}
          </div>
          <h2 className="mt-2 text-xl font-semibold text-white">{item.title}</h2>
          <p className="mt-2 text-sm leading-7 text-white/65">{item.body}</p>
          <div className="mt-3 text-xs uppercase tracking-[0.16em] text-white/40">
            {item.status} · {new Date(item.createdAt).toLocaleString()}
          </div>
        </article>
      ))}
    </div>
  );
}
