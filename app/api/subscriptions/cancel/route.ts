// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Parse body
    let reason: string | null = null;
    let notes: string | null = null;
    let adminClientId: string | null = null;
    let adminClientEmail: string | null = null;
    try {
      const body = await req.json();
      reason = body.reason || null;
      notes = body.notes || null;
      adminClientId = body.clientId || null;
      adminClientEmail = body.clientEmail || null;
    } catch {
      // body is optional
    }

    const isAdminAction = !!(adminClientId && adminClientEmail);

    let clientId: string;
    let clientEmail: string;

    if (isAdminAction) {
      // Verify caller is admin
      const { data: callerProfile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!callerProfile || callerProfile.role !== "admin") {
        return NextResponse.json({ error: "Only admins can cancel subscriptions for other clients" }, { status: 403 });
      }

      clientId = adminClientId;
      clientEmail = adminClientEmail;
      if (!reason) reason = "cancelled_by_admin";
    } else {
      // Client-initiated: look up client from session
      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!client) return NextResponse.json({ error: "Client profile not found" }, { status: 404 });
      clientId = client.id;
      clientEmail = user.email!;
    }

    const admin = createAdminClient();

    // ── Client-initiated: request cancellation (admin must approve) ──
    if (!isAdminAction) {
      const updatePayload: Record<string, unknown> = {
        status: "cancellation_requested",
        updated_at: new Date().toISOString(),
      };
      if (reason) updatePayload.cancellation_reason = reason;
      if (notes) updatePayload.cancellation_notes = notes;

      const { data: subs, error: updateErr } = await admin
        .from("client_subscriptions")
        .update(updatePayload)
        .eq("client_id", clientId)
        .in("status", ["active", "pending"])
        .select("plan");

      if (updateErr) {
        console.error("[subscriptions/cancel] Update error:", updateErr);
        return NextResponse.json({ error: "Failed to request cancellation" }, { status: 500 });
      }

      if (subs?.length) {
        const planNames = subs.map(s => s.plan).join(", ");
        const { notifyRole } = await import("@/lib/notify-helpers");
        // Notify admins: review needed
        notifyRole("admin", {
          type: "system",
          title: "Cancellation review needed",
          body: `${clientEmail} wants to cancel their ${planNames} subscription.${reason ? ` Reason: ${reason}` : ""}`,
          action_url: "/admin/subscriptions",
        }).catch(e => console.error("[cancel] Admin notify error:", e));

        // Send "request received" email to client
        const planLabel = subs[0].plan.toUpperCase();
        const { emailCancelRequested } = await import("@/lib/email/subscription");
        emailCancelRequested(clientEmail, planLabel, reason || undefined, notes).catch(e => console.error("[cancel] Email failed:", e));
      }

      return NextResponse.json({ ok: true, status: "cancellation_requested" });
    }

    // ── Admin-initiated: direct cancel (no review needed) ──
    const updatePayload: Record<string, unknown> = {
      status: "cancelled",
      updated_at: new Date().toISOString(),
    };
    if (reason) updatePayload.cancellation_reason = reason;
    if (notes) updatePayload.cancellation_notes = notes;

    const { data: subs, error: updateErr } = await admin
      .from("client_subscriptions")
      .update(updatePayload)
      .eq("client_id", clientId)
      .in("status", ["active", "pending", "cancellation_requested"])
      .select("plan");

    if (updateErr) {
      console.error("[subscriptions/cancel] Update error:", updateErr);
      return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
    }

    // Reset extra credits on cancellation
    if (subs?.length) {
      await admin.from("clients").update({ credit_balance: 0 }).eq("id", clientId);
    }

    // Send cancellation email
    if (subs?.length) {
      const planLabel = subs[0].plan.toUpperCase();
      const reasonLabel = reason || "Not specified";
      const { emailSubscriptionCancelled } = await import("@/lib/email/subscription");
      emailSubscriptionCancelled(clientEmail, planLabel, reasonLabel, notes).catch(e => console.error("[cancel] Email failed:", e));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[subscriptions/cancel]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
