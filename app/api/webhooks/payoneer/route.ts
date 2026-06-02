// @ts-nocheck
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyPayoneerWebhookSignature } from "@/lib/payoneer/client";
import { generateInvoicePDF } from "@/lib/pdf/invoice";
import {
  emailPaymentConfirmed,
  emailNewOrderAlert,
} from "@/lib/email";
import type { PayoneerWebhookPayload } from "@/types";

export async function POST(req: NextRequest) {
  let rawBody: string;

  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: "Cannot read request body" }, { status: 400 });
  }

  // ── Verify signature ────────────────────────────────────────
  const signature = req.headers.get("x-payoneer-signature");
  const isValid   = verifyPayoneerWebhookSignature(rawBody, signature);

  if (!isValid && process.env.NODE_ENV === "production") {
    console.error("[payoneer-webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: PayoneerWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { event_type, payment_id, order_id, amount, currency } = payload;

  // ── Log webhook ─────────────────────────────────────────────
  await supabase.from("audit_logs").insert({
    action:    `payoneer_webhook:${event_type}`,
    entity:    "invoices",
    entity_id: order_id,
    new_data:  payload as Record<string, unknown>,
  });

  // ── Handle events ────────────────────────────────────────────

  if (event_type === "PAYMENT_COMPLETED" && payload.status === "SUCCESS") {
    // Update invoice
    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .update({
        status:       "paid",
        payoneer_ref: payment_id,
        paid_at:      new Date().toISOString(),
        updated_at:   new Date().toISOString(),
      })
      .eq("order_id", order_id)
      .select(`
        *,
        orders ( order_number, service_tier_id, turnaround,
          clients ( company_name, users ( email, full_name ) )
        )
      `)
      .single();

    if (invErr || !invoice) {
      console.error("[payoneer-webhook] Invoice update failed:", invErr);
      return NextResponse.json({ error: "Invoice update failed" }, { status: 500 });
    }

    // Update order status — only for pre-delivery payment flows.
    // Delivered/cancelled/refunded orders must not regress.
    const { data: currentOrder } = await supabase
      .from("orders")
      .select("status")
      .eq("id", order_id)
      .single();

    if (currentOrder && !["delivered", "cancelled", "refunded"].includes(currentOrder.status)) {
      await supabase
        .from("orders")
        .update({ status: "submitted", updated_at: new Date().toISOString() })
        .eq("id", order_id);
    }

    // Update client LTV
    const clientId = invoice.client_id;
    if (clientId) {
      const { data: client } = await supabase
        .from("clients")
        .select("ltv")
        .eq("id", clientId)
        .single();

      if (client) {
        const newLtv = (client.ltv ?? 0) + amount;
        await supabase
          .from("clients")
          .update({
            ltv:  newLtv,
            tier: newLtv >= 500 ? "vip" : newLtv >= 50 ? "active" : "new",
          })
          .eq("id", clientId);
      }
    }

    // Notify client
    const order       = invoice.orders as any;
    const clientUser  = order?.clients?.users;
    const clientEmail = clientUser?.email;
    const clientName  = clientUser?.full_name ?? "there";

    if (clientEmail) {
      // In-app notification
      const { data: clientRow } = await supabase
        .from("clients")
        .select("user_id")
        .eq("id", clientId)
        .single();

      if (clientRow) {
        await supabase.from("notifications").insert({
          user_id:    clientRow.user_id,
          type:       "payment",
          title:      "Payment confirmed",
          body:       `Payment of $${amount} ${currency} received for order ${order?.order_number}.`,
          action_url: "/client/invoices",
        });
      }

      // Generate invoice PDF and upload to storage
      let pdfBuffer: Buffer | null = null;
      let pdfUrl = invoice.pdf_url;

      try {
        const pdfData = {
          invoiceNumber: invoice.invoice_number,
          orderNumber:   order?.order_number ?? order_id,
          issuedAt:      invoice.created_at ?? new Date().toISOString(),
          dueAt:         invoice.due_at ?? new Date().toISOString(),
          paidAt:        new Date().toISOString(),
          status:        "paid",
          clientName:    clientName,
          clientEmail:   clientEmail ?? "",
          clientCompany: order?.clients?.company_name ?? "Client",
          clientCountry: "",
          serviceName:   order?.service_tiers?.label ?? "Order",
          serviceSize:   order?.service_tiers?.size_desc ?? "",
          turnaround:    order?.turnaround ?? "standard",
          outputFormat:  order?.output_format ?? "",
          amount:        amount,
          currency:      currency,
          companyName:   "GenXdigitizing",
          companyEmail:  "support@genxdigitizing.com",
          companyWebsite: "genxdigitizing.com",
        };

        pdfBuffer = await generateInvoicePDF(pdfData);

        // Upload PDF to Supabase Storage
        const { error: uploadErr } = await supabase.storage
          .from("invoices")
          .upload(`${invoice.id}.pdf`, pdfBuffer, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from("invoices")
            .getPublicUrl(`${invoice.id}.pdf`);
          pdfUrl = urlData?.publicUrl ?? null;

          if (pdfUrl) {
            await supabase
              .from("invoices")
              .update({ pdf_url: pdfUrl, updated_at: new Date().toISOString() })
              .eq("id", invoice.id);
          }
        }
      } catch (pdfErr) {
        console.error("[payoneer-webhook] PDF generation failed:", pdfErr);
        // Non-fatal: continue to send email without attachment
      }

      // Email with PDF attachment
      emailPaymentConfirmed({
        to:            clientEmail,
        clientName,
        orderNumber:   order?.order_number ?? order_id,
        invoiceNumber: invoice.invoice_number,
        amount,
        currency,
        payoneerRef:   payment_id,
        pdfUrl:        pdfUrl ?? undefined,
        pdfAttachment: pdfBuffer ? {
          filename: `invoice-${invoice.invoice_number}.pdf`,
          content: pdfBuffer,
        } : undefined,
      }).catch(console.error);
    }

    // Notify admins
    const { data: admins } = await supabase
      .from("users")
      .select("id, email")
      .eq("role", "admin")
      .eq("is_active", true);

    if (admins && admins.length > 0) {
      await supabase.from("notifications").insert(
        admins.map((a) => ({
          user_id:    a.id,
          type:       "payment",
          title:      `Payment received — ${order?.order_number}`,
          body:       `$${amount} ${currency} via Payoneer. Order ready to assign.`,
          action_url: `/admin/orders`,
        }))
      );

      emailNewOrderAlert({
        to:          admins.map((a) => a.email),
        orderNumber: order?.order_number ?? order_id,
        clientName:  order?.clients?.company_name ?? "Client",
        serviceName: order?.service_tier_id ?? "Order",
        price:       amount,
        turnaround:  order?.turnaround ?? "standard",
      }).catch(console.error);
    }

    return NextResponse.json({ received: true, event: event_type, order_id });
  }

  if (event_type === "PAYMENT_REFUNDED") {
    await supabase
      .from("invoices")
      .update({ status: "refunded", updated_at: new Date().toISOString() })
      .eq("order_id", order_id);

    await supabase
      .from("orders")
      .update({ status: "refunded", updated_at: new Date().toISOString() })
      .eq("id", order_id);

    // Notify client about refund
    const { data: refundInvoice } = await supabase
      .from("invoices")
      .select("client_id, invoice_number, orders ( order_number, clients ( users ( id, full_name ) ) )")
      .eq("order_id", order_id)
      .single();

    if (refundInvoice) {
      const clientUser = (refundInvoice.orders as any)?.clients?.users;
      if (clientUser?.id) {
        await supabase.from("notifications").insert({
          user_id:    clientUser.id,
          type:       "payment",
          title:      "Payment refunded",
          body:       `Your payment of $${amount} ${currency} for order ${(refundInvoice.orders as any)?.order_number ?? order_id} has been refunded.`,
          action_url: "/client/invoices",
        }).catch(console.error);
      }
    }

    return NextResponse.json({ received: true, event: event_type });
  }

  // Unknown event — still 200 so Payoneer doesn't retry
  return NextResponse.json({ received: true, event: event_type, handled: false });
}

// Payoneer pings this to verify the endpoint is live
export async function GET() {
  return NextResponse.json({
    status:  "ok",
    service: "genxdigitizing-payoneer-webhook",
    env:     process.env.PAYONEER_ENVIRONMENT ?? "sandbox",
  }).catch(console.error);
}
