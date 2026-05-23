// @ts-nocheck
import {
  PortalSkeleton,
  SkeletonProfile,
  SkeletonStatRow,
  SkeletonTabs,
  SkeletonCardList,
} from "@/components/ui/Skeleton";

export default function DesignerLoading() {
  return (
    <PortalSkeleton>
      <SkeletonProfile />
      <div style={{ height: 20 }} />
      <div style={{ height: 28, marginBottom: 8 }} />
      <div style={{ height: 14, width: "60%", marginBottom: 20 }} />
      <SkeletonStatRow count={4} />
      <SkeletonTabs count={5} />
      <SkeletonCardList count={4} />
    </PortalSkeleton>
  );
}
