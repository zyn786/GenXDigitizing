export default function AdminLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Page title + action bar */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-56 rounded-xl bg-muted" />
        <div className="h-9 w-28 rounded-xl bg-muted" />
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
            <div className="h-3.5 w-24 rounded-full bg-muted" />
            <div className="h-7 w-16 rounded-lg bg-muted" />
            <div className="h-3 w-32 rounded-full bg-muted" />
          </div>
        ))}
      </div>

      {/* Table block */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border/60">
          <div className="h-5 w-32 rounded-full bg-muted" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-border/40 last:border-0">
            <div className="h-4 w-32 rounded-full bg-muted" />
            <div className="h-4 flex-1 rounded-full bg-muted" />
            <div className="h-4 w-24 rounded-full bg-muted" />
            <div className="h-6 w-20 rounded-full bg-muted" />
            <div className="h-4 w-16 rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
