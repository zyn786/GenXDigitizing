// @ts-nocheck
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient }         from "@/lib/supabase/server";
import { getAdminUser }              from "@/lib/supabase/get-user";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAdminUser().catch(() => null);
    if (!user || !["admin", "crm"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase  = createAdminClient();
    const invoiceId = params.id;
    const body      = await req.json();
    const { checkout_url } = body;

    // Validate checkout_url
    if (!checkout_url || typeof checkout_url !== "string" || !checkout_url.startsWith("http")) {
      return NextResponse.json({ error: "A valid URL starting with http is required" }, { status: 400 });
    }

    // Fetch invoice + related data
    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .select(`
        id, invoice_number, amount, status,
        client_id, order_id,
        orders ( id, order_number, service_tiers ( label ) ),
        clients ( id, company_name, users ( id, full_name ) )
      `)
      .eq("id", invoiceId)
      .single();

    if (invErr || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "paid") {
      return NextResponse.json({ error: "Invoice already paid" }, { status: 409 });
    }

    // Save checkout URL on the invoice
    await supabase
      .from("invoices")
      .update({
        payoneer_checkout_url: checkout_url,
        updated_at:            new Date().toISOString(),
      })
      .eq("id", invoiceId);

    // Notify client
    const order       = invoice.orders as any;
    const client      = invoice.clients as any;
    const clientUser  = client?.users;
    const orderNumber = order?.order_number ?? invoice.order_id;

    if (clientUser?.id) {
      await supabase.from("notifications").insert({
        user_id:    clientUser.id,
        type:       "payment",
        title:      "Invoice ready — payment link available",
        body:       `Your invoice for order ${orderNumber} is ready. Click to pay via Payoneer.`,
        action_url: "/client/invoices",
      });
    }

    return NextResponse.json({ success: true, checkout_url });

  } catch (err: any) {
    console.error("[checkout] Error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
