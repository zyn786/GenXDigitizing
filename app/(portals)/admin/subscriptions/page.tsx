// @ts-nocheck
import { getAdminUser } from "@/lib/supabase/get-user";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/portals/Topbar";
import { SubscriptionsAdmin } from "./SubscriptionsAdmin";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
  const user = await getAdminUser();
  if (!user || user.role !== "admin") redirect("/login");

  // Use standard client (reads user session from cookies, respects RLS)
  // admin user satisfies sub_admin_all RLS policy
  const supabase = createClient();

  const { data: subs, error: subsErr } = await supabase
    .from("client_subscriptions")
    .select("*, clients:client_id(company_name, user:user_id(email))")
    .order("created_at", { ascending: false });

  if (subsErr) console.error("[admin/subscriptions] subs fetch error:", subsErr);

  const { data: invoices, error: invErr } = await supabase
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (invErr) console.error("[admin/subscriptions] invoices fetch error:", invErr);

  const { data: paymentLinkSetting } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "subscription_payment_link")
    .maybeSingle();

  console.log("[admin/subscriptions] subs count:", subs?.length, "invoices count:", invoices?.length);

  return (
    <>
      <Topbar title="Subscriptions" subtitle="Approve plans, manage payment link" user={user} />
      <SubscriptionsAdmin
        subscriptions={subs || []}
        invoices={invoices || []}
        universalPaymentLink={paymentLinkSetting?.value || ""}
      />
    </>
  );
}
