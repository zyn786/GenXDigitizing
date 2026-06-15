// @ts-nocheck
export const dynamic = "force-dynamic";

import { getAdminUser }  from "@/lib/supabase/get-user";
import { createClient }  from "@/lib/supabase/server";
import { Topbar }        from "@/components/portals/Topbar";
import { AdminInvoicesUI } from "./InvoicesUI";

export default async function AdminInvoicesPage() {
  const user     = await getAdminUser();
  const supabase = createClient();

  const { data: invoices } = await supabase
    .from("invoices")
    .select(`
      id, invoice_number, amount, currency, status, notes,
      payoneer_ref, payoneer_checkout_url, pdf_url,
      paid_at, created_at, due_at,
      order_id,
      orders ( id, order_number, turnaround, output_format, service_tiers(label) ),
      clients ( id, company_name, tier, users(full_name, email) )
    `)
    .order("created_at", { ascending: false });

  const totalRevenue = (invoices ?? [])
    .filter(i => i.status === "paid")
    .reduce((s, i) => s + Number(i.amount), 0);

  const totalPending = (invoices ?? [])
    .filter(i => i.status === "pending")
    .reduce((s, i) => s + Number(i.amount), 0);

  return (
    <>
      <Topbar
        title="Invoices"
        subtitle={`$${totalRevenue.toFixed(0)} collected · $${totalPending.toFixed(0)} pending`}
        user={user}
      />
      <AdminInvoicesUI invoices={invoices ?? []} />
    </>
  );
}
