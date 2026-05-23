// @ts-nocheck
import {
  PortalSkeleton,
  SkeletonStatRow,
  SkeletonTable,
} from "@/components/ui/Skeleton";

export default function AdminLoading() {
  return (
    <PortalSkeleton>
      <div style={{ height: 28, marginBottom: 8 }} />
      <div style={{ height: 14, width: "30%", marginBottom: 20 }} />
      <SkeletonStatRow count={4} />
      <div style={{ height: 140, marginBottom: 16 }} />
      <SkeletonTable rows={5} />
    </PortalSkeleton>
  );
}
