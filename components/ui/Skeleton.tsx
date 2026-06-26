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
    <div
      className={cn("rounded-lg", className)}
      style={{ ...pulseStyle, ...style }}
      {...props}
    />
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
      <Skeleton className="h-6 sm:h-7 w-40 sm:w-52 mb-2 rounded-lg" />
      <Skeleton className="h-3.5 sm:h-4 w-56 sm:w-72 rounded-md" style={{ opacity: 0.6 }} />
    </div>
  );
}

/* ═════════════════════════════════════════════
   Cards & Grids
   ═════════════════════════════════════════════ */

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl p-5 border border-[var(--border)] bg-[var(--surface)]", className)}>
      <Skeleton className="h-4 w-3/4 mb-3" />
      <SkeletonText lines={2} />
      <Skeleton className="h-8 w-full mt-4" />
    </div>
  );
}

/** Responsive stat cards — 2 cols mobile, 3 tablet, 4 desktop */
export function SkeletonStatRow({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 mb-5">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-[68px] sm:h-[76px] rounded-2xl" style={{ opacity: 1 - i * 0.06 }} />
      ))}
    </div>
  );
}

/** Responsive card grid — any count, adapts columns */
export function SkeletonGrid({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4", className)}>
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
      <Skeleton className="h-10 rounded-t-2xl mb-0.5" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-12 mb-0.5 rounded"
          style={{ opacity: 1 - i * 0.1 }}
        />
      ))}
    </div>
  );
}

/* ═════════════════════════════════════════════
   Tabs
   ═════════════════════════════════════════════ */

export function SkeletonTabs({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-2 mb-5 overflow-x-auto">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-9 rounded-xl flex-shrink-0"
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
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
      <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
      <div className="flex-1">
        <Skeleton className="h-3.5 w-28 mb-1.5" />
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
        <Skeleton
          key={i}
          className="h-[120px] rounded-2xl"
          style={{ opacity: 1 - i * 0.08 }}
        />
      ))}
    </div>
  );
}

/* ═════════════════════════════════════════════
   Content Block (chart / large area)
   ═════════════════════════════════════════════ */

export function SkeletonContentBlock({ className, height = 200 }: { className?: string; height?: number }) {
  return (
    <Skeleton
      className={cn("w-full rounded-2xl", className)}
      style={{ height }}
    />
  );
}

/* ═════════════════════════════════════════════
   Topbar
   ═════════════════════════════════════════════ */

export function SkeletonTopbar() {
  return (
    <div
      className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6"
      style={{
        height: 56,
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
      }}
    >
      <div className="flex-1 min-w-0">
        <Skeleton className="h-[18px] w-32 sm:w-40 mb-1 rounded-md" />
        <Skeleton className="h-[11px] w-20 sm:w-28 rounded-md" style={{ opacity: 0.6 }} />
      </div>
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="hidden sm:block h-8 w-8 rounded-full" />
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
      className={cn("hidden lg:block flex-shrink-0", className)}
      style={{
        width: 220,
        borderRight: "1px solid var(--border)",
        padding: "20px 14px",
      }}
    >
      {/* Logo */}
      <Skeleton className="h-8 w-[120px] mb-7 rounded-xl" />
      {/* Nav items — 2 sections */}
      <Skeleton className="h-3 w-16 mb-3 rounded-md" style={{ opacity: 0.5 }} />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-9 mb-1.5 rounded-xl"
          style={{ opacity: 1 - i * 0.06 }}
        />
      ))}
      <div className="mt-4" />
      <Skeleton className="h-3 w-20 mb-3 rounded-md" style={{ opacity: 0.5 }} />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton
          key={`s2-${i}`}
          className="h-9 mb-1.5 rounded-xl"
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
      className="lg:hidden fixed bottom-0 inset-x-0 z-50"
      style={{
        height: 64,
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex justify-around items-center h-full px-2 max-w-[500px] mx-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Skeleton className="w-5 h-5 rounded-md" />
            <Skeleton className="w-8 h-2 rounded" style={{ opacity: 0.5 }} />
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
      <div className="w-5 h-5 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
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
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      {/* Desktop sidebar */}
      <SkeletonSidebar />

      {/* Main area */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{ paddingBottom: "64px" }}
      >
        <SkeletonTopbar />

        {/* Content — responsive width, centered */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-5 md:px-8 py-4 sm:py-5">
          <div className="w-full max-w-[900px] xl:max-w-[1100px] mx-auto">
            {children}
          </div>
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
