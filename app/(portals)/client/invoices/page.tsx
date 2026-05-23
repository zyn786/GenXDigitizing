// @ts-nocheck
export const dynamic = "force-dynamic";

import { getAdminUser }      from "@/lib/supabase/get-user";
import { getClientInvoices } from "@/lib/supabase/client-queries";
import { Topbar }            from "@/components/portals/Topbar";
import { ClientInvoicesUI }  from "./InvoicesUI";
import { redirect }          from "next/navigation";

export default async function InvoicesPage({ searchParams }) {
  const user = await getAdminUser();
  if (!user.client_id) { redirect("/client"); }

  const invoices = await getClientInvoices(user.client_id);

  // Payoneer redirect params
  const paymentStatus  = searchParams?.payment;   // "success" | "cancelled"
  const checkoutDemo   = searchParams?.checkout;  // "demo" (dev mode)
  const invoiceIdParam = searchParams?.invoice;

  return (
    <>
      <Topbar title="Invoices" subtitle="All payments — via Payoneer" user={user} />
      <ClientInvoicesUI
        invoices={invoices}
        paymentStatus={paymentStatus ?? null}
        demoInvoiceId={checkoutDemo === "demo" ? invoiceIdParam : null}
      />
    </>
  );
}
