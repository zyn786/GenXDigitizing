// @ts-nocheck
import { PortalLayout } from "@/components/portals/PortalLayout";

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayout requiredRole="crm">{children}</PortalLayout>;
}
