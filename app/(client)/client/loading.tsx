export default function ClientLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Page title bar */}
      <div className="h-8 w-48 rounded-xl bg-muted" />

      {/* Stat cards row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
            <div className="h-3.5 w-20 rounded-full bg-muted" />
            <div className="h-7 w-14 rounded-lg bg-muted" />
          </div>
        ))}
      </div>

      {/* Main content block */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
        <div className="h-5 w-36 rounded-full bg-muted" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-border/40 last:border-0">
            <div className="h-4 w-4 rounded-full bg-muted shrink-0" />
            <div className="h-4 flex-1 rounded-full bg-muted" />
            <div className="h-4 w-20 rounded-full bg-muted" />
            <div className="h-6 w-16 rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
