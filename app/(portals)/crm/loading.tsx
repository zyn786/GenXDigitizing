// @ts-nocheck
import {
  PortalSkeleton,
  SkeletonStatRow,
  SkeletonTable,
} from "@/components/ui/Skeleton";

export default function CRMLoading() {
  return (
    <PortalSkeleton>
      <div style={{ height: 28, marginBottom: 8 }} />
      <div style={{ height: 14, width: "40%", marginBottom: 20 }} />
      <SkeletonStatRow count={3} />
      <SkeletonTable rows={5} />
    </PortalSkeleton>
  );
}
