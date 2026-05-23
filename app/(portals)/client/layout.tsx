// @ts-nocheck
import { PortalLayout } from "@/components/portals/PortalLayout";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayout requiredRole="client">{children}</PortalLayout>;
}
