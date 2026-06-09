// @ts-nocheck
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient }         from "@/lib/supabase/server";
import { getAdminUser }              from "@/lib/supabase/get-user";
import { generateInvoicePDF }        from "@/lib/pdf/invoice";
import {
  emailPaymentConfirmed,
  emailNewOrderAlert,
} from "@/lib/email";

export async function PATCH(
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
    const { status, paid_at } = body;

    if (!status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    // Fetch invoice
    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .select(`
        id, invoice_number, amount, status,
        order_id, client_id,
        orders ( id, order_number, status ),
        clients ( id, users ( id, full_name ) )
      `)
      .eq("id", invoiceId)
      .single();

    if (invErr || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Update invoice
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (paid_at) {
      updates.paid_at = paid_at;
    } else if (status === "paid") {
      updates.paid_at = new Date().toISOString();
    }

    const { error: updErr } = await supabase
      .from("invoices")
      .update(updates)
      .eq("id", invoiceId);

    if (updErr) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    // When marked as paid: update order to submitted, notify client
    if (status === "paid") {
      const order      = invoice.orders as any;
      const client     = invoice.clients as any;
      const clientUser = client?.users;

      // Update order status — only if not in a terminal/post-delivery state
      if (order?.status && !["submitted", "delivered", "cancelled", "refunded"].includes(order.status)) {
        await supabase
          .from("orders")
          .update({ status: "submitted", updated_at: new Date().toISOString() })
          .eq("id", invoice.order_id);
      }

      // Update client LTV
      if (invoice.client_id) {
        const { data: clientRow } = await supabase
          .from("clients")
          .select("ltv")
          .eq("id", invoice.client_id)
          .single();

        if (clientRow) {
          const newLtv = (clientRow.ltv ?? 0) + Number(invoice.amount);
          await supabase
            .from("clients")
            .update({
              ltv:  newLtv,
              tier: newLtv >= 500 ? "vip" : newLtv >= 50 ? "active" : "new",
            })
            .eq("id", invoice.client_id);
        }
      }

      // Notify client
      if (clientUser?.id) {
        await supabase.from("notifications").insert({
          user_id:    clientUser.id,
          type:       "payment",
          title:      "Payment confirmed",
          body:       `Your payment for ${order?.order_number ?? invoice.order_id} has been received. Work will begin shortly.`,
          action_url: "/client/invoices",
        });
      }

      // Notify admins
      const { data: admins } = await supabase
        .from("users")
        .select("id, email")
        .eq("role", "admin")
        .eq("is_active", true);

      if (admins?.length) {
        await supabase.from("notifications").insert(
          admins.map((a: any) => ({
            user_id:    a.id,
            type:       "payment",
            title:      `Payment received — ${order?.order_number ?? invoice.order_id}`,
            body:       `$${Number(invoice.amount).toFixed(0)} — order ready for assignment.`,
            action_url: `/admin/orders`,
          }))
        );
      }

      // Generate PDF and send email
      if (clientUser?.id || client?.user_id) {
        try {
          const clientEmail = clientUser?.email;
          if (clientEmail) {
            // Fetch full invoice data for PDF
            const { data: fullInvoice } = await supabase
              .from("invoices")
              .select(`
                *, orders (
                  order_number, turnaround, output_format, created_at,
                  service_tiers ( label, size_desc ),
                  clients ( company_name, country, users ( email, full_name ) )
                )
              `)
              .eq("id", invoiceId)
              .single();

            const o = fullInvoice?.orders as any;
            const pdfData = {
              invoiceNumber: invoice.invoice_number,
              orderNumber:   o?.order_number ?? invoice.order_id,
              issuedAt:      invoice.created_at ?? new Date().toISOString(),
              dueAt:         (invoice as any).due_at ?? new Date().toISOString(),
              paidAt:        new Date().toISOString(),
              status:        "paid",
              clientName:    clientUser?.full_name ?? client?.users?.full_name ?? "Client",
              clientEmail:   clientEmail,
              clientCompany: o?.clients?.company_name ?? "Client",
              clientCountry: o?.clients?.country ?? "",
              serviceName:   o?.service_tiers?.label ?? "Order",
              serviceSize:   o?.service_tiers?.size_desc ?? "",
              turnaround:    o?.turnaround ?? "standard",
              outputFormat:  o?.output_format ?? "",
              amount:        Number(invoice.amount),
              currency:      "USD",
              companyName:   "genxdigitizing",
              companyEmail:  "support@genxdigitizing.com",
              companyWebsite: "genxdigitizing.com",
            };

            const pdfBuffer = await generateInvoicePDF(pdfData);

            // Upload to storage
            let pdfUrl: string | null = null;
            try {
              const { error: uploadErr } = await supabase.storage
                .from("invoices")
                .upload(`${invoiceId}.pdf`, pdfBuffer, {
                  contentType: "application/pdf",
                  upsert: true,
                });
              if (!uploadErr) {
                const { data: urlData } = supabase.storage
                  .from("invoices")
                  .getPublicUrl(`${invoiceId}.pdf`);
                pdfUrl = urlData?.publicUrl ?? null;
                if (pdfUrl) {
                  await supabase
                    .from("invoices")
                    .update({ pdf_url: pdfUrl })
                    .eq("id", invoiceId);
                }
              }
            } catch { /* non-fatal */ }

            // Send payment confirmation with PDF attached
            emailPaymentConfirmed({
              to: clientEmail,
              clientName: clientUser?.full_name ?? "Client",
              orderNumber: o?.order_number ?? invoice.order_id,
              invoiceNumber: invoice.invoice_number,
              amount: Number(invoice.amount),
              currency: "USD",
              payoneerRef: "manual-payment",
              pdfUrl: pdfUrl ?? undefined,
              pdfAttachment: {
                filename: `invoice-${invoice.invoice_number}.pdf`,
                content: pdfBuffer,
              },
            }).catch(console.error);

            // Notify admins via email
            const adminEmails = admins?.map((a: any) => a.email).filter(Boolean) ?? [];
            if (adminEmails.length > 0) {
              emailNewOrderAlert({
                to: adminEmails,
                orderNumber: o?.order_number ?? invoice.order_id,
                clientName: o?.clients?.company_name ?? clientUser?.full_name ?? "Client",
                serviceName: o?.service_tiers?.label ?? "Order",
                price: Number(invoice.amount),
                turnaround: o?.turnaround ?? "standard",
              }).catch(console.error);
            }
          }
        } catch (emailErr) {
          console.error("[invoice-status] Email/PDF failed:", emailErr);
          // Non-fatal
        }
      }
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("[invoice-status] Error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
