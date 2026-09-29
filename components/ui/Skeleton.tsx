// @ts-nocheck
/**
 * Skeleton loading primitives.
 * Responsive — mobile-first, adapts to all screen sizes.
 */

import { cn } from "@/lib/utils";

const pulseStyle: React.CSSProperties = {
  animation: "skeleton-pulse 1.6s ease-in-out infinite",
  background: "var(--border)",
};

/* ═════════════════════════════════════════════
   Base
   ═════════════════════════════════════════════ */

export function Skeleton({ className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-lg", className)} style={{ ...pulseStyle, ...style }} {...props} />
  );
}

/* ═════════════════════════════════════════════
   Text
   ═════════════════════════════════════════════ */

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3"
          style={{
            width: i === lines - 1 ? "60%" : "100%",
            opacity: 1 - i * 0.1,
          }}
        />
      ))}
    </div>
  );
}

/* ═════════════════════════════════════════════
   Page Header
   ═════════════════════════════════════════════ */

export function SkeletonPageHeader({ className }: { className?: string }) {
  return (
    <div className={cn("mb-5 sm:mb-6", className)}>
      <Skeleton className="mb-2 h-6 w-40 rounded-lg sm:h-7 sm:w-52" />
      <Skeleton className="h-3.5 w-56 rounded-md sm:h-4 sm:w-72" style={{ opacity: 0.6 }} />
    </div>
  );
}

/* ═════════════════════════════════════════════
   Cards & Grids
   ═════════════════════════════════════════════ */

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn("rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5", className)}
    >
      <Skeleton className="mb-3 h-4 w-3/4" />
      <SkeletonText lines={2} />
      <Skeleton className="mt-4 h-8 w-full" />
    </div>
  );
}

/** Responsive stat cards — 2 cols mobile, 3 tablet, 4 desktop */
export function SkeletonStatRow({ count = 4 }: { count?: number }) {
  return (
    <div className="mb-5 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-[68px] rounded-2xl sm:h-[76px]"
          style={{ opacity: 1 - i * 0.06 }}
        />
      ))}
    </div>
  );
}

/** Responsive card grid — any count, adapts columns */
export function SkeletonGrid({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/* ═════════════════════════════════════════════
   Table
   ═════════════════════════════════════════════ */

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div>
      <Skeleton className="mb-0.5 h-10 rounded-t-2xl" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="mb-0.5 h-12 rounded" style={{ opacity: 1 - i * 0.1 }} />
      ))}
    </div>
  );
}

/* ═════════════════════════════════════════════
   Tabs
   ═════════════════════════════════════════════ */

export function SkeletonTabs({ count = 4 }: { count?: number }) {
  return (
    <div className="mb-5 flex gap-2 overflow-x-auto">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-9 flex-shrink-0 rounded-xl"
          style={{ width: i === 0 ? 80 : 100 + i * 10 }}
        />
      ))}
    </div>
  );
}

/* ═════════════════════════════════════════════
   Profile
   ═════════════════════════════════════════════ */

export function SkeletonProfile() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <Skeleton className="h-9 w-9 flex-shrink-0 rounded-full" />
      <div className="flex-1">
        <Skeleton className="mb-1.5 h-3.5 w-28" />
        <Skeleton className="h-2.5 w-16" />
      </div>
      <Skeleton className="h-5 w-12 rounded-full" />
    </div>
  );
}

/* ═════════════════════════════════════════════
   Vertical Card List
   ═════════════════════════════════════════════ */

export function SkeletonCardList({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-[120px] rounded-2xl" style={{ opacity: 1 - i * 0.08 }} />
      ))}
    </div>
  );
}

/* ═════════════════════════════════════════════
   Content Block (chart / large area)
   ═════════════════════════════════════════════ */

export function SkeletonContentBlock({
  className,
  height = 200,
}: {
  className?: string;
  height?: number;
}) {
  return <Skeleton className={cn("w-full rounded-2xl", className)} style={{ height }} />;
}

/* ═════════════════════════════════════════════
   Topbar
   ═════════════════════════════════════════════ */

export function SkeletonTopbar() {
  return (
    <div
      className="flex flex-shrink-0 items-center justify-between px-4 sm:px-6"
      style={{
        height: 56,
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
      }}
    >
      <div className="min-w-0 flex-1">
        <Skeleton className="mb-1 h-[18px] w-32 rounded-md sm:w-40" />
        <Skeleton className="h-[11px] w-20 rounded-md sm:w-28" style={{ opacity: 0.6 }} />
      </div>
      <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="hidden h-8 w-8 rounded-full sm:block" />
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════
   Sidebar (desktop only)
   ═════════════════════════════════════════════ */

export function SkeletonSidebar({ className }: { className?: string }) {
  return (
    <div
      className={cn("hidden flex-shrink-0 lg:block", className)}
      style={{
        width: 220,
        borderRight: "1px solid var(--border)",
        padding: "20px 14px",
      }}
    >
      {/* Logo */}
      <Skeleton className="mb-7 h-8 w-[120px] rounded-xl" />
      {/* Nav items — 2 sections */}
      <Skeleton className="mb-3 h-3 w-16 rounded-md" style={{ opacity: 0.5 }} />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="mb-1.5 h-9 rounded-xl" style={{ opacity: 1 - i * 0.06 }} />
      ))}
      <div className="mt-4" />
      <Skeleton className="mb-3 h-3 w-20 rounded-md" style={{ opacity: 0.5 }} />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton
          key={`s2-${i}`}
          className="mb-1.5 h-9 rounded-xl"
          style={{ opacity: 0.85 - i * 0.08 }}
        />
      ))}
    </div>
  );
}

/* ═════════════════════════════════════════════
   Mobile Bottom Nav
   ═════════════════════════════════════════════ */

export function SkeletonMobileNav() {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 lg:hidden"
      style={{
        height: 64,
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="mx-auto flex h-full max-w-[500px] items-center justify-around px-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Skeleton className="h-5 w-5 rounded-md" />
            <Skeleton className="h-2 w-8 rounded" style={{ opacity: 0.5 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════
   Inline loader (small spinner + text)
   ═════════════════════════════════════════════ */

export function SkeletonInline({ text = "Loading…" }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-2.5 py-8 sm:py-10">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#2563EB] border-t-transparent" />
      <span className="text-sm text-[var(--txt3)]">{text}</span>
    </div>
  );
}

/* ═════════════════════════════════════════════
   Full Portal Page Skeleton
   ═════════════════════════════════════════════ */

export function PortalSkeleton({
  children,
  statCount = 4,
}: {
  children?: React.ReactNode;
  statCount?: number;
}) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Desktop sidebar */}
      <SkeletonSidebar />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden" style={{ paddingBottom: "64px" }}>
        <SkeletonTopbar />

        {/* Content — responsive width, centered */}
        <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5 md:px-8">
          <div className="mx-auto w-full max-w-[900px] xl:max-w-[1100px]">{children}</div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <SkeletonMobileNav />

      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}

/* ═════════════════════════════════════════════
   Dashboard-specific skeleton
   ═════════════════════════════════════════════ */

export function DashboardSkeleton() {
  return (
    <>
      <SkeletonPageHeader />
      <SkeletonStatRow count={4} />
      <SkeletonContentBlock height={160} />
      <div className="mt-5">
        <SkeletonTable rows={5} />
      </div>
    </>
  );
}
