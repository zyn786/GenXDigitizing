// @ts-nocheck
/**
 * Skeleton loading primitives.
 * Use these to build loading states that match your layout.
 */

import { cn } from "@/lib/utils";

const pulseStyle: React.CSSProperties = {
  animation: "skeleton-pulse 1.6s ease-in-out infinite",
  background: "var(--border)",
};

export function Skeleton({ className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg", className)}
      style={{ ...pulseStyle, ...style }}
      {...props}
    />
  );
}

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

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl p-5 border border-[var(--border)] bg-[var(--surface)]", className)}>
      <Skeleton className="h-4 w-3/4 mb-3" />
      <SkeletonText lines={2} />
      <Skeleton className="h-8 w-full mt-4" />
    </div>
  );
}

export function SkeletonStatRow({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-[72px] rounded-2xl" />
      ))}
    </div>
  );
}

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

export function SkeletonTabs({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-2 mb-5">
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

// Full portal page skeletons

export function PortalSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      {/* Sidebar skeleton — desktop only */}
      <div
        className="hidden lg:block flex-shrink-0"
        style={{
          width: 220,
          borderRight: "1px solid var(--border)",
          padding: "20px 14px",
        }}
      >
        <Skeleton className="h-8 mb-7 rounded-xl" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-9 mb-1.5 rounded-xl"
            style={{ opacity: 1 - i * 0.08 }}
          />
        ))}
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ paddingBottom: "64px" }}>
        {/* Topbar */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6"
          style={{
            height: 56,
            borderBottom: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <div>
            <Skeleton className="h-[18px] w-36 mb-1 rounded-md" />
            <Skeleton className="h-[11px] w-24 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-lg" />
            <Skeleton className="h-7 w-7 rounded-lg" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-4 sm:py-5" style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}>
          {children}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div
        className="lg:hidden fixed bottom-0 inset-x-0 z-50"
        style={{
          height: 64,
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="flex justify-around items-center h-full px-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Skeleton className="w-5 h-5 rounded-md" />
              <Skeleton className="w-8 h-2 rounded" />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}
