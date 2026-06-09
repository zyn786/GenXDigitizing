// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { notifyUsers } from "@/lib/notify";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  try {
    const admin = getServiceClient();
    const orderId = params.id;

    // Fetch order with designer info
    const { data: order } = await admin
      .from("orders")
      .select(`
        id, order_number, status,
        clients ( company_name, users ( full_name ) ),
        designers ( users ( id, full_name, email ) )
      `)
      .eq("id", orderId)
      .single();

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    const orderData = order as any;

    if (orderData.status !== "revision") {
      return NextResponse.json({ error: "Order is not in revision status" }, { status: 422 });
    }

    const designerUser = orderData.designers?.users;
    if (!designerUser?.id) {
      return NextResponse.json({ error: "No designer assigned to this order" }, { status: 400 });
    }

    const clientName = orderData.clients?.users?.full_name
      || orderData.clients?.company_name
      || "Client";

    // Notify designer (in-app + push)
    await notifyUsers([designerUser.id], {
      type: "order_update",
      title: `Revision assigned — ${orderData.order_number}`,
      body: `${clientName} requested changes. Check your tasks for details.`,
      action_url: "/designer/tasks",
    });

    // Send message to designer
    await admin.from("messages").insert({
      from_user: user.id,
      to_user: designerUser.id,
      order_id: orderId,
      body: `Revision assigned for order ${orderData.order_number}\n\nClient: ${clientName}\n\nPlease review the revision notes and update the files.`,
      is_read: false,
    });

    // Update order status back to in_progress
    await admin
      .from("orders")
      .update({ status: "in_progress", updated_at: new Date().toISOString() })
      .eq("id", orderId);

    // Audit log
    await admin.from("audit_logs").insert({
      action: "revision_assigned_to_designer",
      entity: "orders",
      entity_id: orderId,
      user_id: user.id,
      new_data: { designer_id: designerUser.id, designer_name: designerUser.full_name },
    });

    return NextResponse.json({ success: true, designerName: designerUser.full_name });
  } catch (err: any) {
    console.error("[assign-revision]", err);
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}
