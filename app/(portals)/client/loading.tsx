// @ts-nocheck
import {
  PortalSkeleton,
  SkeletonStatRow,
  SkeletonCard,
} from "@/components/ui/Skeleton";

export default function ClientLoading() {
  return (
    <PortalSkeleton>
      <div style={{ height: 28, marginBottom: 8 }} />
      <div style={{ height: 14, width: "50%", marginBottom: 20 }} />
      <SkeletonStatRow count={4} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonCard />
      <div style={{ height: 16 }} />
      <SkeletonCard />
    </PortalSkeleton>
  );
}
