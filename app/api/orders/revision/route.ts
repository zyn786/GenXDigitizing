// @ts-nocheck
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { emailRevisionRequested } from "@/lib/email";

const REVISION_ALLOWED_STATUSES = ["delivered", "approved"];

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = body.orderId;
    const orderNumber = body.orderNumber;
    const revisionNotes = (body.revisionNotes ?? "").trim();

    // 1. Input validation
    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }
    if (!orderNumber) {
      return NextResponse.json({ error: "orderNumber is required" }, { status: 400 });
    }
    if (!revisionNotes) {
      return NextResponse.json({ error: "revisionNotes is required" }, { status: 400 });
    }
    if (revisionNotes.length > 2000) {
      return NextResponse.json({ error: "revisionNotes must be under 2000 characters" }, { status: 400 });
    }

    // 2. Auth — use the standard server client (anon key, reads session cookie)
    let user: any = null;
    try {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from("users")
          .select("id, email, full_name, role, avatar_url")
          .eq("id", authUser.id)
          .single();
        user = profile;
      }
    } catch {
      // createClient may throw if cookies() fails — fall through
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getServiceClient();

    // 3. Fetch order with client and designer info
    const { data: order, error: fetchErr } = await admin
      .from("orders")
      .select(`
        id, status, client_id, designer_id,
        clients ( user_id, company_name, users ( full_name ) ),
        designers ( users ( id, full_name, email ) )
      `)
      .eq("id", orderId)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderData = order as any;

    // 4. Authorization — client must own the order; admin/crm bypass
    const dbClientUserId = orderData.clients?.user_id;
    if (!["admin", "crm"].includes(user.role)) {
      if (user.id !== dbClientUserId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // 5. Validate state transition
    if (!REVISION_ALLOWED_STATUSES.includes(orderData.status)) {
      return NextResponse.json({
        error: `Cannot request revision on an order with status "${orderData.status}"`,
      }, { status: 422 });
    }

    // 6. Update order status to revision
    await admin
      .from("orders")
      .update({ status: "revision", updated_at: new Date().toISOString() })
      .eq("id", orderId);

    // 7. Build display info
    const clientFullName = orderData.clients?.users?.full_name
      || orderData.clients?.company_name
      || user.full_name
      || "Client";
    const designerUser = orderData.designers?.users;

    // 8. Messages to all active admins
    const { data: allAdmins } = await admin
      .from("users")
      .select("id")
      .eq("role", "admin")
      .eq("is_active", true);

    if (allAdmins?.length) {
      const msgBody = `Revision Requested\n\nOrder: ${orderNumber}\nClient: ${clientFullName}\n\nDetails: ${revisionNotes}`;
      await admin.from("messages").insert(
        allAdmins.map((a: any) => ({
          from_user: user.id,
          to_user: a.id,
          order_id: orderId,
          body: msgBody,
          is_read: false,
        }))
      );
    }

    // 9. Notify admins
    if (allAdmins?.length) {
      await admin.from("notifications").insert(
        allAdmins.map((a: any) => ({
          user_id: a.id,
          type: "order_update",
          title: `Revision requested — ${orderNumber}`,
          body: `${clientFullName}: ${revisionNotes.slice(0, 100)}`,
          action_url: `/admin/orders/${orderId}`,
        }))
      );
    }

    // 10. Notify designer
    if (designerUser?.id) {
      await admin.from("notifications").insert({
        user_id: designerUser.id,
        type: "order_update",
        title: `Revision requested — ${orderNumber}`,
        body: `${clientFullName} requested changes. Check task for details.`,
        action_url: `/designer/tasks`,
      });
    }

    // 11. Email
    const recipients: string[] = [];
    if (designerUser?.email) recipients.push(designerUser.email);
    if (allAdmins?.length) {
      for (const a of allAdmins as any[]) {
        const { data: u } = await admin.from("users").select("email").eq("id", a.id).single();
        if (u?.email && !recipients.includes(u.email)) recipients.push(u.email);
      }
    }
    if (recipients.length > 0) {
      await emailRevisionRequested({
        to: recipients,
        clientName: clientFullName,
        orderNumber,
        revisionNotes,
      }).catch(console.error);
    }

    // 12. Audit log
    await admin.from("audit_logs").insert({
      action: "revision_requested",
      entity: "orders",
      entity_id: orderId,
      user_id: user.id,
      new_data: { orderNumber, revisionNotes: revisionNotes.slice(0, 500), previousStatus: orderData.status },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[revision] Error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
