// @ts-nocheck
import type { Metadata } from "next";
import { PortalLayout } from "@/components/portals/PortalLayout";

export const metadata: Metadata = {
  title: { default: "Admin Dashboard", template: "%s | Admin — genxdigitizing" },
  description: "Admin portal for genxdigitizing — manage orders, clients, subscriptions, and reports.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayout requiredRole="admin">{children}</PortalLayout>;
}
