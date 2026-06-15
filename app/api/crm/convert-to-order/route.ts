// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { notifyUsers } from "@/lib/notify-server";
import { emailOrderSubmitted } from "@/lib/email";

// POST /api/crm/convert-to-order
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      lead_id,
      service_tier_id,
      price,
      turnaround,
      design_name,
      width_inches,
      height_inches,
      color_count,
      output_format,
    } = body;

    if (!lead_id || !service_tier_id || !price || !design_name) {
      return NextResponse.json({ error: "lead_id, service_tier_id, price, and design_name are required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Get the lead
    const { data: lead, error: leadErr } = await admin
      .from("crm_leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (leadErr || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (!lead.email) {
      return NextResponse.json({ error: "Lead has no email — cannot create order" }, { status: 400 });
    }

    // 2. Find or create user by email
    let userId: string;
    const { data: existingUser } = await admin
      .from("users")
      .select("id")
      .eq("email", lead.email)
      .maybeSingle();

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create a user account for the lead
      const tempPassword = crypto.randomUUID().slice(0, 16);
      const { data: newUser, error: createUserErr } = await admin.auth.admin.createUser({
        email: lead.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: lead.contact_name, company: lead.company || "" },
      });

      if (createUserErr || !newUser?.user) {
        return NextResponse.json({ error: "Failed to create user: " + (createUserErr?.message || "unknown") }, { status: 500 });
      }

      userId = newUser.user.id;

      // Create user record in public.users
      await admin.from("users").insert({
        id: userId,
        email: lead.email,
        full_name: lead.contact_name,
        role: "client",
      });
    }

    // 3. Find or create client record
    const { data: existingClient } = await admin
      .from("clients")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    let clientId: string;
    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const { data: newClient, error: clientErr } = await admin
        .from("clients")
        .insert({
          user_id: userId,
          company_name: lead.company || lead.contact_name,
        })
        .select("id")
        .single();

      if (clientErr || !newClient) {
        return NextResponse.json({ error: "Failed to create client record" }, { status: 500 });
      }
      clientId = newClient.id;
    }

    // 4. Calculate SLA deadline
    const slaHours = turnaround === "urgent" ? 3 : turnaround === "rush" ? 6 : 24;
    const slaDeadline = new Date(Date.now() + slaHours * 3600000).toISOString();

    // Parse clean message from lead notes (strip Service/Artwork/Download metadata lines)
    const leadMessage = (lead.notes || "")
      .split("\n")
      .filter((l: string) => !l.startsWith("Service:") && !l.startsWith("Artwork:") && !l.startsWith("Download:") && !l.startsWith("["))
      .join("\n")
      .trim();

    // 5. Create the order — let DB generate order_number via trigger/default
    const { data: order, error: orderErr } = await admin
      .from("orders")
      .insert({
        client_id: clientId,
        service_tier_id,
        output_format: output_format || "DST",
        turnaround: turnaround || "standard",
        price: Number(price),
        currency: "USD",
        width_inches: width_inches ? Number(width_inches) : null,
        height_inches: height_inches ? Number(height_inches) : null,
        color_count: color_count ? Number(color_count) : null,
        design_name: design_name.trim(),
        placement_notes: leadMessage || null,
        sla_deadline: slaDeadline,
        status: "submitted",
      })
      .select()
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Failed to create order: " + (orderErr?.message || "unknown") }, { status: 500 });
    }

    const orderNumber = order.order_number || `OD-GX${String(Date.now() % 100000).padStart(5, '0')}`;

    // 6. Copy artwork from lead's S3 upload to order_files table
    const artworkMatch = (lead.notes || "").match(/Artwork:\s*(.+?)\s*\(([^)]+)\)/);
    const artworkKeyMatch = (lead.notes || "").match(/Download:\s*\/api\/chat\/upload\?key=([^\s]+)/);
    if (artworkKeyMatch) {
      const artworkKey = decodeURIComponent(artworkKeyMatch[1]);
      const artworkFileName = artworkMatch ? artworkMatch[1] : "artwork-from-lead";
      const artworkSizeMatch = artworkMatch ? artworkMatch[2] : null;
      const fileSizeBytes = artworkSizeMatch
        ? (artworkSizeMatch.toLowerCase().includes("mb") ? parseFloat(artworkSizeMatch) * 1024 * 1024 : parseFloat(artworkSizeMatch) * 1024)
        : 0;

      await admin.from("order_files").insert({
        order_id: order.id,
        file_url: artworkKey,
        file_name: artworkFileName,
        file_type: "artwork",
        file_size: Math.round(fileSizeBytes),
        uploaded_by: userId,
      });
    }

    // 7. Update lead stage to "won" and link order
    const wonNote = `\n[${new Date().toISOString()}] Stage changed to Won — Order ${orderNumber} created`;
    await admin
      .from("crm_leads")
      .update({
        stage: "won",
        notes: (lead.notes || "") + wonNote,
      })
      .eq("id", lead_id);

    // 8. Notify admins
    const { data: admins } = await admin.from("users").select("id").eq("role", "admin");
    if (admins?.length) {
      await admin.from("notifications").insert(
        admins.map((a: any) => ({
          user_id: a.id,
          type: "system",
          title: `Lead converted — ${orderNumber}`,
          body: `${lead.contact_name} · ${design_name} · $${price} · ${turnaround || "standard"}`,
          action_url: `/admin/orders/${order.id}`,
        }))
      );
    }

    // 9. Send password reset email for newly created users (so they can log in)
    if (!existingUser) {
      admin.auth.resetPasswordForEmail(lead.email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "https://genxdigitizing.com"}/reset-password`,
      }).catch((err) => console.error("[convert-to-order] Password reset email failed:", err));
    }

    // 10. Send order confirmation email to client
    const turnaroundLabels: Record<string, string> = { standard: "12–24h", rush: "6h", urgent: "3h" };
    const slaHoursMap: Record<string, number> = { standard: 24, rush: 6, urgent: 3 };
    const estDelivery = new Date(Date.now() + (slaHoursMap[turnaround || "standard"] || 24) * 3600000).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

    emailOrderSubmitted({
      to: lead.email,
      clientName: lead.contact_name,
      orderNumber,
      serviceName: design_name.trim(),
      price: Number(price),
      turnaround: turnaroundLabels[turnaround || "standard"] || "12–24h",
      estimatedDelivery: estDelivery,
    }).catch((err) => console.error("[convert-to-order] Email failed:", err));

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        order_number: orderNumber,
        price,
        status: order.status || "submitted",
      },
    });
  } catch (err: any) {
    console.error("[convert-to-order]", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
