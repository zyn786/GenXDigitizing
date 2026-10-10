// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { notifyUsers } from "@/lib/notify-server";
import { isMissingColumn } from "@/lib/db-errors";
import { computeDeadline } from "@/lib/sla";
import { emailOrderSubmitted } from "@/lib/email";
import { parseLeadArtwork } from "@/lib/lead-artwork";
import { buildStageChangeEvent, recordLeadEvent } from "@/lib/lead-events";

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
      return NextResponse.json(
        { error: "lead_id, service_tier_id, price, and design_name are required" },
        { status: 400 }
      );
    }

    // The staff-typed price is used as-is (a negotiated discount is legitimate),
    // but it must be a real positive amount. It was only checked for truthiness,
    // and the string "0" is truthy — so a typo produced a $0 order that flowed
    // into the invoice, the customer email and the revenue reports.
    const priceNumber = Number(price);
    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      return NextResponse.json({ error: "Price must be a number greater than 0" }, { status: 400 });
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
      return NextResponse.json(
        { error: "Lead has no email — cannot create order" },
        { status: 400 }
      );
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
        return NextResponse.json(
          { error: "Failed to create user: " + (createUserErr?.message || "unknown") },
          { status: 500 }
        );
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

    // 4. Calculate SLA deadline via the shared rule. This path used to ignore
    // big designs, giving a Jumbo standard order 24h where the client wizards
    // gave 12h for the same order.
    const { data: slaTier } = await admin
      .from("service_tiers")
      .select("is_big_design")
      .eq("id", service_tier_id)
      .maybeSingle();
    const slaDeadline = computeDeadline(turnaround, (slaTier as any)?.is_big_design);

    // Parse clean message from lead notes (strip Service/Artwork/Download metadata lines)
    const leadMessage = (lead.notes || "")
      .split("\n")
      .filter(
        (l: string) =>
          !l.startsWith("Service:") &&
          !l.startsWith("Artwork:") &&
          !l.startsWith("Download:") &&
          !l.startsWith("[")
      )
      .join("\n")
      .trim();

    // 5. Create the order — let DB generate order_number via trigger/default
    // `orders.lead_id` (migration 026) is what makes lead → revenue attribution
    // possible, and nothing ever wrote it. Retry without it when that migration
    // has not been applied, so order creation can never break on the column.
    const orderPayload: Record<string, unknown> = {
      client_id: clientId,
      service_tier_id,
      output_format: output_format || "DST",
      turnaround: turnaround || "standard",
      price: priceNumber,
      currency: "USD",
      width_inches: width_inches ? Number(width_inches) : null,
      height_inches: height_inches ? Number(height_inches) : null,
      color_count: color_count ? Number(color_count) : null,
      design_name: design_name.trim(),
      placement_notes: leadMessage || null,
      sla_deadline: slaDeadline,
      status: "submitted",
      lead_id,
    };

    let { data: order, error: orderErr } = await admin
      .from("orders")
      .insert(orderPayload)
      .select()
      .single();

    if (orderErr && isMissingColumn(orderErr)) {
      console.error(
        "[convert-to-order] orders.lead_id missing (migration 026 unapplied?) — retrying without it"
      );
      delete orderPayload.lead_id;
      ({ data: order, error: orderErr } = await admin
        .from("orders")
        .insert(orderPayload)
        .select()
        .single());
    }

    if (orderErr || !order) {
      return NextResponse.json(
        { error: "Failed to create order: " + (orderErr?.message || "unknown") },
        { status: 500 }
      );
    }

    const orderNumber =
      order.order_number || `OD-GX${String(Date.now() % 100000).padStart(5, "0")}`;

    // 6. Attach every artwork file the lead recorded.
    //
    // This reads via lib/lead-artwork so it accepts BOTH formats ever written
    // and returns ALL files. It previously matched only the contact-form shape,
    // non-globally — so upload-wizard leads (the main conversion path) attached
    // nothing at all, and multi-file leads attached only the first file.
    const artworkFiles = parseLeadArtwork(lead.notes);
    const attachFailures: string[] = [];

    for (const file of artworkFiles) {
      // `file_size_kb` is the real column (001_initial_schema.sql:154). This
      // insert previously wrote a non-existent `file_size`, so PostgREST
      // rejected the whole row and the customer's artwork silently never
      // reached the order the team had just created. Error is now checked.
      const { error: fileErr } = await admin.from("order_files").insert({
        order_id: order.id,
        file_url: file.key,
        file_name: file.name,
        file_type: "artwork",
        file_size_kb: file.sizeKb,
        uploaded_by: userId,
      });

      if (fileErr) {
        console.error(
          "[convert-to-order] artwork attach failed — order",
          orderNumber,
          "file",
          file.name,
          fileErr.message
        );
        attachFailures.push(file.name);
      }
    }

    // Staff are told in the response, not only in the log: the modal used to
    // toast "Order created!" while the designer opened an order with no
    // artwork. The order is real either way — do not fail it now.
    const artworkAttached = artworkFiles.length - attachFailures.length;
    const artworkWarning =
      attachFailures.length > 0
        ? `${attachFailures.length} artwork file(s) could not be attached (${attachFailures.join(", ")}). Attach them manually before assigning.`
        : artworkFiles.length === 0
          ? "This lead has no artwork on file — request it from the customer before assigning."
          : null;

    // 7. Update lead stage to "won" and link order
    const wonNote =
      `\n[${new Date().toISOString()}] Stage changed to Won — Order ${orderNumber} created` +
      (artworkAttached > 0 ? ` (${artworkAttached} artwork file(s) attached)` : "") +
      (artworkWarning ? ` — WARNING: ${artworkWarning}` : "");
    // Error was ignored, so a failed update left the lead in its old stage while
    // the order existed — the same lead could then be converted a second time.
    const { error: wonErr } = await admin
      .from("crm_leads")
      .update({
        stage: "won",
        // Clear the follow-up clock. Left in place it is inert — the engine
        // refuses to chase a won lead — but a stale date on a closed lead fires
        // the moment anyone moves it back to an open stage. Found on a real
        // lead: converted at 08:11, still carrying the 12:11 date set when it
        // was created.
        follow_up_at: null,
        notes: (lead.notes || "") + wonNote,
      })
      .eq("id", lead_id);
    // The conversion is the single most valuable event on a lead, so it is
    // recorded whether or not the stage write succeeded — and when the stage
    // write fails, that failure is on the timeline too, because the lead still
    // reads as open and could be converted twice.
    await recordLeadEvent(
      admin,
      buildStageChangeEvent({
        leadId: lead_id,
        fromStage: lead.stage ?? null,
        toStage: "won",
        actorId: userId,
        actorLabel: "Staff",
        metadata: {
          reason: "converted to order",
          orderId: order.id,
          orderNumber,
          artworkAttached,
          artworkWarning,
          stageWriteFailed: wonErr ? wonErr.message : null,
        },
      })
    );

    await recordLeadEvent(admin, {
      leadId: lead_id,
      type: "order_created",
      actorId: userId,
      actorLabel: "Staff",
      summary: `Order ${orderNumber} created — ${design_name.trim()} · $${priceNumber}${
        artworkWarning ? ` · ${artworkWarning}` : ""
      }`,
      metadata: {
        orderId: order.id,
        orderNumber,
        price: priceNumber,
        turnaround: turnaround || "standard",
        artworkFiles: artworkFiles.map((f) => f.name),
        artworkAttached,
        artworkWarning,
      },
    });

    if (wonErr) {
      console.error(
        "[convert-to-order] lead stage NOT updated — lead",
        lead_id,
        "still shows its old stage but order",
        orderNumber,
        "exists:",
        wonErr.message
      );
    }

    // 8. Notify admins
    const { data: admins } = await admin.from("users").select("id").eq("role", "admin");
    if (admins?.length) {
      await admin.from("notifications").insert(
        admins.map((a: any) => ({
          user_id: a.id,
          type: "system",
          title: `Lead converted — ${orderNumber}${artworkWarning ? " ⚠ no artwork" : ""}`,
          body: `${lead.contact_name} · ${design_name} · $${price} · ${turnaround || "standard"}${artworkWarning ? ` · ${artworkWarning}` : ""}`,
          action_url: `/admin/orders/${order.id}`,
        }))
      );
    }

    // 9. Send password reset email for newly created users (so they can log in)
    // This is the customer's ONLY way into the account that was just created for
    // them. A failure here used to be a console line: the account existed, the
    // customer never knew, and nobody was told.
    let accountWarning: string | null = null;
    if (!existingUser) {
      const { error: resetErr } = await admin.auth.resetPasswordForEmail(lead.email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "https://genxdigitizing.com"}/reset-password`,
      });
      if (resetErr) {
        accountWarning = `Account created but the access email failed to send (${resetErr.message}). Send it from Admin → Clients.`;
        console.error(
          "[convert-to-order] password reset email FAILED for",
          lead.email,
          resetErr.message
        );
        if (admins?.length) {
          await admin.from("notifications").insert(
            admins.map((a: any) => ({
              user_id: a.id,
              type: "system",
              title: `⚠ Access email failed — ${lead.contact_name}`,
              body: `${lead.email} has an account but never received the set-password email for order ${orderNumber}.`,
              action_url: "/admin/clients",
            }))
          );
        }
      }
    }

    // 10. Send order confirmation email to client
    const turnaroundLabels: Record<string, string> = {
      standard: "12–24h",
      rush: "6h",
      urgent: "3h",
    };
    const slaHoursMap: Record<string, number> = { standard: 24, rush: 6, urgent: 3 };
    const estDelivery = new Date(
      Date.now() + (slaHoursMap[turnaround || "standard"] || 24) * 3600000
    ).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

    emailOrderSubmitted({
      to: lead.email,
      clientName: lead.contact_name,
      orderNumber,
      serviceName: design_name.trim(),
      price: priceNumber,
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
      // Both are non-fatal — the order exists. The UI used to toast a bare
      // success regardless, so staff found out about missing artwork only when
      // a designer asked for it.
      artworkWarning,
      artworkAttached,
      accountWarning,
    });
  } catch (err: any) {
    console.error("[convert-to-order]", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
