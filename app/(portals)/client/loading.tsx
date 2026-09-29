// @ts-nocheck
import { PortalSkeleton, SkeletonStatRow, SkeletonCard } from "@/components/ui/Skeleton";

export default function ClientLoading() {
  return (
    <PortalSkeleton>
      <div style={{ height: 28, marginBottom: 8 }} />
      <div style={{ height: 14, width: "50%", marginBottom: 20 }} />
      <SkeletonStatRow count={4} />
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonCard />
      <div style={{ height: 16 }} />
      <SkeletonCard />
    </PortalSkeleton>
  );
}
