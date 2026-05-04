export default function ClientOrderDetailLoading() {
  return (
    <div className="grid gap-6 animate-pulse">
      {/* Breadcrumb */}
      <div className="h-3.5 w-24 rounded-full bg-muted" />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3 w-20 rounded-full bg-muted" />
          <div className="h-8 w-64 rounded-2xl bg-muted" />
          <div className="h-4 w-48 rounded-full bg-muted" />
        </div>
        <div className="h-7 w-28 rounded-full bg-muted" />
      </div>

      {/* Next action */}
      <div className="h-16 rounded-2xl bg-muted" />

      {/* Progress */}
      <div className="rounded-[1.5rem] border border-border/60 bg-card p-5 space-y-3">
        <div className="flex justify-between">
          <div className="h-3 w-16 rounded-full bg-muted" />
          <div className="h-4 w-10 rounded-full bg-muted" />
        </div>
        <div className="h-2 rounded-full bg-muted" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-12 rounded-full bg-muted" />
              <div className="h-5 w-16 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* Two columns */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-[1.5rem] border border-border/60 bg-card p-5 space-y-3">
              <div className="h-5 w-32 rounded-full bg-muted" />
              <div className="h-4 w-full rounded-full bg-muted" />
              <div className="h-4 w-3/4 rounded-full bg-muted" />
            </div>
          ))}
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[1.5rem] border border-border/60 bg-card p-5 space-y-3">
              <div className="h-5 w-24 rounded-full bg-muted" />
              <div className="h-4 w-full rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
