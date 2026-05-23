// @ts-nocheck
import { PortalLayout } from "@/components/portals/PortalLayout";

export default function DesignerLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayout requiredRole="designer">{children}</PortalLayout>;
}
