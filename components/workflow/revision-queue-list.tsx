type RevisionQueueItem = {
  id: string; orderId: string; reference: string; title: string; body: string; status: string; createdAt: string;
};

export function RevisionQueueList({ items }: { items: RevisionQueueItem[] }) {
  if (items.length === 0) {
    return <div className="rounded-2xl border border-border/60 bg-muted/30 p-6 text-sm text-muted-foreground">No open revisions right now.</div>;
  }
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article key={item.id} className="rounded-2xl border border-border/60 bg-muted/30 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.reference}</p>
          <h2 className="mt-2 text-xl font-semibold">{item.title}</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.body}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">{item.status} · {new Date(item.createdAt).toLocaleString()}</p>
        </article>
      ))}
    </div>
  );
}
