// @ts-nocheck
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { uploadToStorage } from "@/lib/storage";
import { notifyUsers } from "@/lib/notify-server";
import { recordRedemption } from "@/lib/coupons";
import { formatLeadArtworkLines } from "@/lib/lead-artwork";
import { formatLeadReferenceLine, generateLeadReference } from "@/lib/lead-reference";
import { recordLeadEvent } from "@/lib/lead-events";
import { emailRequestReceived } from "@/lib/email";
import { nextFollowUpAt } from "@/lib/follow-up";

export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData();
    const designName = fd.get("design_name") as string;
    const width = fd.get("width") as string;
    const height = fd.get("height") as string;
    const colors = fd.get("colors") as string;
    const placement = fd.get("placement") as string;
    const format = fd.get("format") as string;
    const speed = fd.get("speed") as string;
    const notes = fd.get("notes") as string;
    // Garment/fabric arrive as human labels, and each file may carry its own
    // requested output format. All three were being sent by the wizard and
    // ignored here — the labels only survived because the client pasted the raw
    // option ids into the notes string, and a per-file format choice was lost
    // silently.
    const garment = fd.get("garment") as string;
    const fabric = fd.get("fabric") as string;
    const fileFormats = fd.getAll("file_formats") as string[];
    const name = fd.get("name") as string;
    const email = fd.get("email") as string;
    const company = fd.get("company") as string;
    const couponCode = fd.get("coupon_code") as string;
    const couponId = fd.get("coupon_id") as string;
    const discountAmount = fd.get("discount_amount") as string;
    const visitorId = fd.get("visitor_id") as string;
    const files = fd.getAll("files") as File[];

    if (!designName || !placement || !name || !email || files.length === 0) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Upload files to Supabase Storage (max 25MB each, max 5 files)
    const MAX_FILE_SIZE = 25 * 1024 * 1024;
    const MAX_FILES = 5;

    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Maximum ${MAX_FILES} files allowed` }, { status: 413 });
    }

    // Reject oversized files up front rather than mid-loop: the old code
    // uploaded files 1..N-1, then returned 413 on file N, leaving partial
    // uploads on a lead that the customer was told had failed.
    const oversized = files.find((f) => f.size > MAX_FILE_SIZE);
    if (oversized) {
      return NextResponse.json(
        { error: `File ${oversized.name} exceeds 25MB limit` },
        { status: 413 }
      );
    }

    const uploadedFiles: { name: string; key: string; size: number; format?: string }[] = [];
    const failedFiles: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const buffer = Buffer.from(await file.arrayBuffer());
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const key = `guest-uploads/${Date.now()}-${i}-${safeName}`;
      try {
        await uploadToStorage(buffer, key, file.type || "application/octet-stream");
        uploadedFiles.push({
          name: file.name,
          key,
          size: file.size,
          format: fileFormats[i] || undefined,
        });
      } catch (uploadErr) {
        // One bad file must not discard the whole enquiry — the customer typed
        // their details in and expects us to have them.
        console.error("[guest-order] upload failed for", file.name, uploadErr);
        failedFiles.push(file.name);
      }
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { error: "We could not store your files. Please try again, or email them to us." },
        { status: 502 }
      );
    }

    // Create CRM lead
    // Canonical format (lib/lead-artwork) — convert-to-order reads exactly this.
    // The previous shape ("- name (1.2MB) — /api/chat/upload?key=…") matched
    // nothing in that reader, so upload-wizard leads converted to orders with
    // NO artwork attached and no error shown to staff.
    const artworkLines = formatLeadArtworkLines(uploadedFiles);

    // Per-file output formats, kept as their own lines so the digitizer sees
    // them. A guest who switches file 2 to PES used to have that choice dropped.
    const perFileFormats = uploadedFiles
      .map((f, i) =>
        f.format
          ? `  ${String(i + 1).padStart(2, " ")}. ${f.name} → requested output: ${f.format}`
          : null
      )
      .filter(Boolean);

    // The reference the customer will quote. Generated here, not in the
    // browser — the wizard used to invent one and never send it, so the number
    // on the confirmation screen existed nowhere and could not be looked up.
    const reference = generateLeadReference();

    const leadNotes = [
      formatLeadReferenceLine(reference),
      `Design: ${designName}`,
      `Placement: ${placement}`,
      `Format: ${format}`,
      `Speed: ${speed}`,
      garment && `Garment: ${garment}`,
      fabric && `Fabric: ${fabric}`,
      width && `Size: ${width}" × ${height}"`,
      colors && `Colors: ${colors}`,
      notes && `Notes: ${notes}`,
      couponCode && `Coupon: ${couponCode} (${discountAmount ? `-$${discountAmount}` : "applied"})`,
      visitorId && `Visitor: ${visitorId}`,
      failedFiles.length > 0 &&
        `UPLOAD FAILED for: ${failedFiles.join(", ")} — ask the customer to resend`,
      "",
      "Uploaded Files:",
      ...artworkLines,
      ...(perFileFormats.length
        ? ["", "Requested output formats (per file):", ...perFileFormats]
        : []),
    ]
      .filter(Boolean)
      .join("\n");

    const { data: lead, error: leadErr } = await admin
      .from("crm_leads")
      .insert({
        contact_name: name,
        email,
        company: company || null,
        source: "upload_wizard",
        stage: "lead",
        deal_value: null,
        // Start the follow-up clock — see the contact route.
        follow_up_at: nextFollowUpAt("lead")?.toISOString() ?? null,
        notes: leadNotes,
      })
      .select("id")
      .single();

    if (leadErr) {
      console.error("[guest-order] Lead insert error:", leadErr);
      return NextResponse.json({ error: "Failed to save request" }, { status: 500 });
    }

    // Start the timeline — this is the first thing the customer did.
    await recordLeadEvent(admin, {
      leadId: lead.id,
      type: "created",
      actorLabel: name,
      summary: `Design submitted from the upload wizard — ${designName}, ${placement}, ${files.length} file(s)`,
      toStage: "lead",
      metadata: {
        reference,
        source: "upload_wizard",
        designName,
        placement,
        format,
        speed,
        fileCount: uploadedFiles.length,
        failedFiles,
      },
    });

    // Record coupon redemption (non-blocking)
    if (couponId && visitorId) {
      try {
        await recordRedemption(
          couponId,
          visitorId,
          email || null,
          // The reference, so a redemption can be traced back to the request
          // that used it. This was `null`, leaving no link at all.
          reference,
          discountAmount ? Number(discountAmount) : 0
        );
      } catch (err) {
        console.error("[guest-order] Coupon redemption error:", err);
        // Don't fail the upload if coupon recording fails
      }
    }

    // Notify the people who work leads. This used to be admins only, so the
    // `crm` role — the one with a /crm/leads screen built for exactly this —
    // was never told a lead had arrived.
    const { data: staff } = await admin
      .from("users")
      .select("id")
      .in("role", ["admin", "crm"])
      .eq("is_active", true);
    if (staff?.length) {
      await notifyUsers(
        staff.map((a: any) => a.id),
        {
          type: "system",
          title: `New upload from ${name}`,
          body: `${reference} · ${email} · ${designName} · ${placement} · ${files.length} file(s)`,
          action_url: "/admin/leads",
        }
      );
    }

    // Written confirmation for the customer. Until now a guest got a screen
    // that disappeared and nothing else — no email, no proof they had been in
    // touch, and a reference number that did not exist anywhere.
    const ack = await emailRequestReceived({
      to: email,
      name,
      reference,
      subject: designName,
      // A partial upload is reported as a partial upload: the customer is told
      // which files did not land rather than being congratulated on artwork we
      // do not have.
      artworkReceived: failedFiles.length === 0,
      viaUpload: true,
    });
    if (!ack.success) {
      console.error("[guest-order] acknowledgement email failed for", reference, ack.error);
    }

    return NextResponse.json({ success: true, reference });
  } catch (err: any) {
    console.error("[guest-order]", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
