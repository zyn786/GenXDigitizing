// @ts-nocheck
import type { Metadata } from "next";
import { PortalLayout } from "@/components/portals/PortalLayout";

export const metadata: Metadata = {
  title: { default: "Client Portal", template: "%s | Client — genxdigitizing" },
  description: "Client portal — manage orders, subscriptions, invoices, and track your embroidery digitizing projects.",
  robots: { index: false, follow: false },
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayout requiredRole="client">{children}</PortalLayout>;
}
