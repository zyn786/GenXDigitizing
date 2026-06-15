// @ts-nocheck
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getAdminUser } from "@/lib/supabase/get-user";
import { Topbar } from "@/components/portals/Topbar";
import { SubscribePlans } from "./SubscribePlans";

export const metadata: Metadata = {
  title: "Subscription Plans | genxdigitizing",
  description: "Choose a monthly digitizing plan. Fixed pricing, priority turnaround, dedicated support.",
};

export default async function ClientSubscribePage() {
  const user = await getAdminUser();

  return (
    <>
      <Topbar title="Plans & Billing" subtitle="Manage your subscription, credits, and billing" user={user} />
      <SubscribePlans />
    </>
  );
}
