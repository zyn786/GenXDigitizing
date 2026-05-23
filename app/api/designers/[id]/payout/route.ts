// @ts-nocheck
export const runtime = "nodejs";

/**
 * POST /api/designers/[id]/payout
 * Sends a Payoneer mass payout to a designer.
 * Admin-only. Requires PAYONEER_CLIENT_ID, etc. in env.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient }         from "@/lib/supabase/server";
import { getAdminUser }              from "@/lib/supabase/get-user";

/**
 * POST /api/designers/[id]/payout
 * Logs a manual Payoneer payout in the audit trail and notifies the designer.
 *
 * Actual payouts are sent via Payoneer dashboard (Payments → Make a Payment).
 * This endpoint records the payout details for bookkeeping.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAdminUser().catch(() => null);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase    = createAdminClient();
    const designerId  = params.id;
    const body        = await req.json();
    const { amount, currency = "USD", description, reference_id } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Amount must be > 0" }, { status: 400 });
    }

    // Get designer details
    const { data: designer, error: dErr } = await supabase
      .from("designers")
      .select("id, users ( id, full_name, email )")
      .eq("id", designerId)
      .single();

    if (dErr || !designer) {
      return NextResponse.json({ error: "Designer not found" }, { status: 404 });
    }

    const designerUser = (designer as any).users;
    const refId = reference_id ?? `payout-${designerId}-${Date.now()}`;

    // Log in audit (payout executed manually via Payoneer dashboard)
    await supabase.from("audit_logs").insert({
      action:    "designer_payout",
      entity:    "designers",
      entity_id: designerId,
      user_id:   user.id,
      new_data:  { amount, currency, reference_id: refId, method: "manual_payoneer" },
    });

    // Notify designer
    if (designerUser?.id) {
      await supabase.from("notifications").insert({
        user_id:    designerUser.id,
        type:       "payment",
        title:      `Payout recorded — $${Number(amount).toFixed(2)} ${currency}`,
        body:       `${description ?? "Payout"} · Ref: ${refId}`,
        action_url: "/designer/settings",
      });
    }

    return NextResponse.json({ success: true, reference_id: refId });

  } catch (err: any) {
    console.error("[designer-payout]", err);
    return NextResponse.json({ error: err.message ?? "Payout failed" }, { status: 500 });
  }
}
