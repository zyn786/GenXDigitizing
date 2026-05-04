export default function PublicLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="sticky top-0 z-40 border-b border-border/60 bg-background/90 px-4 py-4 md:px-8">
        <div className="page-shell flex items-center justify-between">
          <div className="h-8 w-28 animate-pulse rounded-2xl bg-muted" />
          <div className="flex items-center gap-3">
            <div className="hidden h-8 w-16 animate-pulse rounded-2xl bg-muted sm:block" />
            <div className="hidden h-8 w-16 animate-pulse rounded-2xl bg-muted sm:block" />
            <div className="hidden h-8 w-16 animate-pulse rounded-2xl bg-muted sm:block" />
            <div className="h-9 w-24 animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="page-shell space-y-8 px-4 py-10 md:px-8">
        <div className="space-y-3">
          <div className="h-4 w-32 animate-pulse rounded-full bg-muted" />
          <div className="h-10 w-96 animate-pulse rounded-2xl bg-muted" />
          <div className="h-5 w-64 animate-pulse rounded-2xl bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-48 animate-pulse rounded-[2rem] bg-muted" />
          <div className="h-48 animate-pulse rounded-[2rem] bg-muted" />
        </div>
      </div>
    </div>
  );
}
