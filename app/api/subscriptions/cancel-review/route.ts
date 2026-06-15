// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/subscriptions/cancel-review
 * Admin-only: approve or deny a client's cancellation request.
 * Body: { subId: string, action: "approve" | "deny" }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify admin
    const { data: callerProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!callerProfile || callerProfile.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const { subId, action } = await req.json();
    if (!subId || !["approve", "deny"].includes(action)) {
      return NextResponse.json({ error: "Missing subId or invalid action (approve|deny)" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Fetch the subscription with client info
    const { data: sub, error: fetchErr } = await admin
      .from("client_subscriptions")
      .select("*, clients:client_id(user_id, user:user_id(email))")
      .eq("id", subId)
      .eq("status", "cancellation_requested")
      .single();

    if (fetchErr || !sub) {
      console.error("[cancel-review] Fetch error:", fetchErr);
      return NextResponse.json({ error: "Cancellation request not found" }, { status: 404 });
    }

    const clientEmail = (sub.clients as any)?.user?.email || "";
    const clientUserId = (sub.clients as any)?.user_id;
    const planLabel = sub.plan.toUpperCase();
    const reason = sub.cancellation_reason || "Not specified";
    const notes = sub.cancellation_notes || null;

    if (action === "approve") {
      await admin.from("client_subscriptions")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", subId);

      // Reset extra credits on cancellation
      if (sub.client_id) {
        await admin.from("clients").update({ credit_balance: 0 }).eq("id", sub.client_id);
      }

      // Notify client with web push
      if (clientUserId) {
        const { notifyUser } = await import("@/lib/notify-helpers");
        notifyUser(clientUserId, {
          type: "system",
          title: "Subscription cancelled",
          body: `Your ${planLabel} plan cancellation has been processed. Any extra credits have been cleared.`,
          action_url: "/client/subscribe",
        }).catch(e => console.error("[cancel-review] Client notify error:", e));
      }

      // Send cancellation email
      const { emailSubscriptionCancelled } = await import("@/lib/email/subscription");
      emailSubscriptionCancelled(clientEmail, planLabel, reason, notes).catch(e => console.error("[cancel-review] Email failed:", e));

      return NextResponse.json({ ok: true, status: "cancelled" });
    }

    // action === "deny"
    await admin.from("client_subscriptions")
      .update({
        status: "active",
        cancellation_reason: "request_denied",
        cancellation_notes: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subId);

    // Notify client with web push
    if (clientUserId) {
      const { notifyUser } = await import("@/lib/notify-helpers");
      notifyUser(clientUserId, {
        type: "system",
        title: "Cancellation request denied",
        body: "Your cancellation request was denied. Your plan remains active. Contact support if you have questions.",
        action_url: "/client/subscribe",
      }).catch(e => console.error("[cancel-review] Client notify error:", e));
    }

    return NextResponse.json({ ok: true, status: "active" });
  } catch (err) {
    console.error("[subscriptions/cancel-review]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
