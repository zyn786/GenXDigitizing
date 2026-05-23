// @ts-nocheck
import { PortalLayout } from "@/components/portals/PortalLayout";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayout requiredRole="admin">{children}</PortalLayout>;
}
