// @ts-nocheck
export const runtime = "nodejs";

import { NextRequest, NextResponse }         from "next/server";
import { createAdminClient }                 from "@/lib/supabase/server";
import { sendPushToUsers }                   from "@/lib/push-notifications-server";
import { getAdminUser }                      from "@/lib/supabase/get-user";
import {
  emailOrderDelivered,
  emailDesignerTaskAssigned,
  emailRevisionRequested,
  emailReviewRequest,
  emailPaymentRequired,
} from "@/lib/email";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  submitted:   ["assigned", "cancelled"],
  assigned:    ["in_progress", "submitted"],
  in_progress: ["review", "assigned"],
  review:      ["approved", "revision", "in_progress"],
  approved:    ["delivered", "revision"],
  delivered:   ["revision", "delivered"],
  revision:    ["in_progress", "submitted"],
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAdminUser().catch(() => null);
    if (!user || !["admin","crm"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const orderId  = params.id;
    const body     = await req.json();
    const { status: newStatus, designer_id, admin_notes } = body;

    // Fetch current order
    const { data: order, error: fetchErr } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, turnaround, output_format, price, sla_deadline,
        service_tier_id,
        service_tiers ( label ),
        clients (
          id, company_name,
          users ( id, full_name, email )
        ),
        designers (
          id,
          users ( id, full_name, email )
        )
      `)
      .eq("id", orderId)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Validate transition
    const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
    if (newStatus && !allowed.includes(newStatus)) {
      return NextResponse.json({
        error: `Cannot transition from ${order.status} to ${newStatus}`,
      }, { status: 422 });
    }

    // Build update payload
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (newStatus)    { updates.status      = newStatus; }
    if (designer_id)  { updates.designer_id = designer_id; updates.assigned_at = new Date().toISOString(); }
    if (admin_notes)  { updates.admin_notes = admin_notes; }

    // Timestamp fields
    if (newStatus === "assigned")    { updates.assigned_at     = new Date().toISOString(); }
    if (newStatus === "in_progress") { updates.in_progress_at  = new Date().toISOString(); }
    if (newStatus === "delivered")   { updates.delivered_at    = new Date().toISOString(); }

    // Apply update
    const { data: updated, error: updErr } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", orderId)
      .select()
      .single();

    if (updErr || !updated) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    // Audit log
    await supabase.from("audit_logs").insert({
      action:    `order_status:${order.status}→${newStatus ?? order.status}`,
      entity:    "orders",
      entity_id: orderId,
      user_id:   user.id,
      new_data:  updates,
    });

    // ── Auto-generate invoice when order reaches QA Review ──────
    if (newStatus === "review") {
      // Check if invoice already exists for this order
      const { data: existingInvoice } = await supabase
        .from("invoices")
        .select("id")
        .eq("order_id", orderId)
        .maybeSingle();

      if (!existingInvoice) {
        const clientId = (order.clients as any)?.id;
        const clientUserId = (order.clients as any)?.users?.id;

        if (clientId) {
          await supabase.from("invoices").insert({
            order_id: orderId,
            client_id: clientId,
            amount: Number(order.price),
            currency: "USD",
            status: "pending",
            due_at: new Date(Date.now() + 86400000).toISOString(),
          });

          // Notify admins: invoice ready for payment link
          const { data: admins } = await supabase
            .from("users")
            .select("id")
            .eq("role", "admin")
            .eq("is_active", true);

          if (admins?.length) {
            await supabase.from("notifications").insert(
              admins.map((a: any) => ({
                user_id: a.id,
                type: "payment",
                title: `Invoice ready — ${order.order_number}`,
                body: `Order reached QA Review. Paste the Payoneer payment link in the invoice panel.`,
                action_url: `/admin/orders/${orderId}`,
              }))
            );
          }
        }
      }
    }

    const clientUser   = (order.clients as any)?.users;
    const designerUser = (order.designers as any)?.users;
    const serviceName  = (order.service_tiers as any)?.label ?? "Order";

    // ── Notifications + Emails per status ─────────────────────

    // When designer is assigned
    if (designer_id) {
      const { data: newDesigner } = await supabase
        .from("designers")
        .select("users ( id, full_name, email )")
        .eq("id", designer_id)
        .single();

      const designerUserNew = (newDesigner as any)?.users;
      if (designerUserNew) {
        // Notify designer
        await supabase.from("notifications").insert({
          user_id:    designerUserNew.id,
          type:       "order_update",
          title:      `New assignment — ${order.order_number}`,
          body:       `${serviceName} · ${order.turnaround} turnaround`,
          action_url: `/designer/tasks`,
        });

        // Email designer
        emailDesignerTaskAssigned({
          to:            designerUserNew.email,
          designerName:  designerUserNew.full_name ?? "Designer",
          orderNumber:   order.order_number,
          serviceName,
          turnaround:    order.turnaround,
          deadline:      order.sla_deadline ?? "Not set",
        }).catch(console.error);

        // Email client: designer assigned
        if (clientUser?.email) {
          const designerName = designerUserNew.full_name ?? "a digitizing artist";
          const { emailDesignerAssigned } = await import("@/lib/email");
          emailDesignerAssigned({
            to: clientUser.email,
            clientName: (clientUser.full_name as string) ?? "there",
            orderNumber: order.order_number,
            designerName,
          }).catch(console.error);
        }
      }
    }

    // When cancelled
    if (newStatus === "cancelled") {
      // Notify client
      if (clientUser) {
        await supabase.from("notifications").insert({
          user_id:    clientUser.id,
          type:       "order_update",
          title:      `Order cancelled — ${order.order_number}`,
          body:       `Your ${serviceName} order has been cancelled. Contact support if you have questions.`,
          action_url: `/client/my-orders`,
        }).catch(console.error);
        sendPushToUsers([clientUser.id], {
          title: `Order cancelled — ${order.order_number}`,
          body: `Your ${serviceName} order has been cancelled.`,
          url: `/client/my-orders`,
        }).catch(console.error);
      }
      // Notify designer
      if (designerUser) {
        await supabase.from("notifications").insert({
          user_id:    designerUser.id,
          type:       "order_update",
          title:      `Order cancelled — ${order.order_number}`,
          body:       `The ${serviceName} order assigned to you has been cancelled.`,
          action_url: `/designer/tasks`,
        }).catch(console.error);
      }
    }

    // When delivered — ensure invoice exists and notify client to pay
    if (newStatus === "delivered" && clientUser) {
      // Ensure invoice exists (defensive — may already exist from review stage)
      let invoiceForEmail: any = null;
      const { data: existingInvoice } = await supabase
        .from("invoices")
        .select("id, status, payoneer_checkout_url")
        .eq("order_id", orderId)
        .maybeSingle();

      if (!existingInvoice) {
        const clientId = (order.clients as any)?.id;
        if (clientId) {
          const { data: newInv } = await supabase
            .from("invoices")
            .insert({
              order_id: orderId,
              client_id: clientId,
              amount: Number(order.price),
              currency: "USD",
              status: "pending",
              due_at: new Date(Date.now() + 86400000).toISOString(),
            })
            .select("id, status, payoneer_checkout_url")
            .single();

          invoiceForEmail = newInv;

          // Notify admins: payment link needed
          const { data: admins } = await supabase
            .from("users")
            .select("id")
            .eq("role", "admin")
            .eq("is_active", true);

          if (admins?.length) {
            await supabase.from("notifications").insert(
              admins.map((a: any) => ({
                user_id: a.id,
                type: "payment",
                title: `Payment link needed — ${order.order_number}`,
                body: `Order delivered. Paste the Payoneer payment link before client can download files.`,
                action_url: `/admin/orders/${orderId}`,
              }))
            );
          }
        }
      } else {
        invoiceForEmail = existingInvoice;
      }

      // Check if this is a revision re-delivery
      const { data: outputVersions } = await supabase
        .from("order_files")
        .select("version")
        .eq("order_id", orderId)
        .eq("file_type", "output");
      const maxVersion = outputVersions?.reduce((max: number, f: any) => Math.max(max, f.version ?? 1), 1) ?? 1;
      const isRevisionDelivery = maxVersion > 1;

      // Notify client
      await supabase.from("notifications").insert({
        user_id:    clientUser.id,
        type:       "order_update",
        title:      isRevisionDelivery ? `Revision files ready — ${order.order_number}` : `Order ready — ${order.order_number}`,
        body:       isRevisionDelivery
          ? `Your requested changes are complete! Revised files available for download.`
          : `Your ${serviceName} is ready! Payment required before download.`,
        action_url: `/client/my-orders`,
      }).catch(console.error);

      // Push notification to client
      sendPushToUsers([clientUser.id], {
        title: isRevisionDelivery ? `Revision files ready — ${order.order_number}` : `Order ready — ${order.order_number}`,
        body: isRevisionDelivery
          ? `Your requested changes are complete! Tap to download.`
          : `Your ${serviceName} is ready! Tap to review and pay.`,
        url: `/client/my-orders`,
      }).catch(console.error);

      // Send payment-required email if invoice is unpaid
      if (invoiceForEmail && invoiceForEmail.status !== "paid") {
        emailPaymentRequired({
          to:          clientUser.email,
          clientName:  clientUser.full_name ?? "there",
          orderNumber: order.order_number,
          serviceName,
          amount:      Number(order.price),
          portalUrl:   `${process.env.NEXT_PUBLIC_APP_URL}/client/my-orders`,
        }).catch(console.error);
      }

      // Also send delivery email with payment note
      emailOrderDelivered({
        to:          clientUser.email,
        clientName:  clientUser.full_name ?? "there",
        orderNumber: order.order_number,
        serviceName,
        downloadUrl: `${process.env.NEXT_PUBLIC_APP_URL}/client/my-orders`,
      }).catch(console.error);

      // Send review request
      emailReviewRequest({
        to:          clientUser.email,
        clientName:  clientUser.full_name ?? "there",
        orderNumber: order.order_number,
        reviewUrl:   `${process.env.NEXT_PUBLIC_APP_URL}/client/my-orders`,
      }).catch(console.error);
    }

    // When admin approves designer work (internal, NOT visible to client)
    if (newStatus === "approved") {
      if (designerUser) {
        await supabase.from("notifications").insert({
          user_id:    designerUser.id,
          type:       "order_update",
          title:      `Design approved — ${order.order_number}`,
          body:       "Your work has been approved by admin. Pending client release.",
          action_url: `/designer/tasks`,
        }).catch(console.error);
      }
      // Notify admins that order is ready for client release
      const { data: admins } = await supabase
        .from("users")
        .select("id")
        .eq("role", "admin")
        .eq("is_active", true);
      if (admins?.length) {
        await supabase.from("notifications").insert(
          admins.map((a: any) => ({
            user_id:    a.id,
            type:       "order_update",
            title:      `Ready for release — ${order.order_number}`,
            body:       `Design approved. Release to client from the order detail page.`,
            action_url: `/admin/orders/${orderId}`,
          }))
        );
      }
    }

    // When revision requested
    if (newStatus === "revision") {
      // Notify designer
      if (designerUser) {
        const revisionBody = admin_notes
          ? `Revision notes: ${admin_notes}`
          : "Changes requested. Check task details.";

        await supabase.from("notifications").insert({
          user_id:    designerUser.id,
          type:       "order_update",
          title:      `Revision requested — ${order.order_number}`,
          body:       revisionBody,
          action_url: `/designer/tasks`,
        }).catch(console.error);

        emailRevisionRequested({
          to:            designerUser.email,
          clientName:    (order.clients as any)?.company_name ?? "Client",
          orderNumber:   order.order_number,
          revisionNotes: admin_notes ?? "See task details for revision instructions.",
        }).catch(console.error);
      }
    }

    return NextResponse.json({ success: true, order: updated });

  } catch (err: any) {
    console.error("[order-status] Error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
