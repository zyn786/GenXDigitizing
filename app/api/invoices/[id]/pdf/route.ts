// @ts-nocheck
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient }         from "@/lib/supabase/server";
import { getAdminUser }              from "@/lib/supabase/get-user";
import { generateInvoicePDF }        from "@/lib/pdf/invoice";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAdminUser().catch(() => null);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase  = createAdminClient();
    const invoiceId = params.id;

    const { data: inv, error } = await supabase
      .from("invoices")
      .select(`
        id, invoice_number, amount, currency, status, created_at, due_at, paid_at,
        order_id,
        orders (
          id, order_number, turnaround, output_format,
          service_tiers ( label, size_desc )
        ),
        clients (
          id, company_name, country,
          users ( full_name, email )
        )
      `)
      .eq("id", invoiceId)
      .single();

    if (error || !inv) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Role check: admin, crm, or the client who owns this invoice
    const clientUserId = (inv.clients as any)?.users?.id;
    if (!["admin", "crm"].includes(user.role) && user.id !== clientUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Access guard: clients can only see their own invoices, admins/crm see all
    if (user.role === "client") {
      if (inv.clients?.id !== user.client_id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const order      = inv.orders as any;
    const client     = inv.clients as any;
    const clientUser = client?.users;

    const pdfBuffer = await generateInvoicePDF({
      invoiceNumber:  inv.invoice_number,
      orderNumber:    order?.order_number ?? inv.order_id,
      issuedAt:       inv.created_at,
      dueAt:          inv.due_at ?? inv.created_at,
      paidAt:         inv.paid_at ?? undefined,
      status:         inv.status,

      clientName:     clientUser?.full_name    ?? "—",
      clientEmail:    clientUser?.email        ?? "—",
      clientCompany:  client?.company_name     ?? "—",
      clientCountry:  client?.country          ?? "—",

      serviceName:    order?.service_tiers?.label    ?? "Digitizing Service",
      serviceSize:    order?.service_tiers?.size_desc ?? "",
      turnaround:     order?.turnaround               ?? "standard",
      outputFormat:   order?.output_format             ?? "DST",

      amount:         Number(inv.amount),
      currency:       inv.currency ?? "USD",

      companyName:    process.env.COMPANY_NAME    ?? "genxdigitizing",
      companyEmail:   process.env.COMPANY_EMAIL   ?? "support@genxdigitizing.com",
      companyWebsite: process.env.COMPANY_WEBSITE ?? "genxdigitizing.com",
    });

    // Optionally upload to storage and save URL (only if bucket available)
    try {
      const uploadPath = `invoices/${invoiceId}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("invoices")
        .upload(uploadPath, pdfBuffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage
          .from("invoices")
          .getPublicUrl(uploadPath);

        await supabase
          .from("invoices")
          .update({ pdf_url: publicUrl })
          .eq("id", invoiceId);
      }
    } catch {
      // Non-fatal — PDF still served directly
    }

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${inv.invoice_number}.pdf"`,
        "Content-Length":      pdfBuffer.length.toString(),
        "Cache-Control":       "private, max-age=0",
      },
    });

  } catch (err: any) {
    console.error("[invoice-pdf] Error:", err);
    return NextResponse.json(
      { error: err.message ?? "PDF generation failed" },
      { status: 500 }
    );
  }
}
