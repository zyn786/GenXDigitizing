// @ts-nocheck
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { uploadToS3 } from "@/lib/s3";
import { notifyUsers } from "@/lib/notify-server";
import { recordRedemption } from "@/lib/coupons";

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

    // Upload files to S3 (max 25MB each, max 5 files)
    const MAX_FILE_SIZE = 25 * 1024 * 1024;
    const MAX_FILES = 5;

    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Maximum ${MAX_FILES} files allowed` }, { status: 413 });
    }

    const uploadedFiles: { name: string; key: string; size: number }[] = [];
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: `File ${file.name} exceeds 25MB limit` }, { status: 413 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const key = `guest-uploads/${Date.now()}-${safeName}`;
      await uploadToS3(buffer, key, file.type || "application/octet-stream");
      uploadedFiles.push({ name: file.name, key, size: file.size });
    }

    // Create CRM lead
    const fileList = uploadedFiles.map(f =>
      `- ${f.name} (${(f.size / 1024 / 1024).toFixed(1)}MB) — /api/chat/upload?key=${encodeURIComponent(f.key)}`
    ).join("\n");

    const leadNotes = [
      `Design: ${designName}`,
      `Placement: ${placement}`,
      `Format: ${format}`,
      `Speed: ${speed}`,
      width && `Size: ${width}" × ${height}"`,
      colors && `Colors: ${colors}`,
      notes && `Notes: ${notes}`,
      couponCode && `Coupon: ${couponCode} (${discountAmount ? `-$${discountAmount}` : "applied"})`,
      visitorId && `Visitor: ${visitorId}`,
      "",
      "Uploaded Files:",
      fileList,
    ].filter(Boolean).join("\n");

    const { error: leadErr } = await admin.from("crm_leads").insert({
      contact_name: name,
      email,
      company: company || null,
      source: "upload_wizard",
      stage: "lead",
      deal_value: null,
      notes: leadNotes,
    });

    if (leadErr) {
      console.error("[guest-order] Lead insert error:", leadErr);
      return NextResponse.json({ error: "Failed to save request" }, { status: 500 });
    }

    // Record coupon redemption (non-blocking)
    if (couponId && visitorId) {
      try {
        await recordRedemption(
          couponId,
          visitorId,
          email || null,
          null,
          discountAmount ? Number(discountAmount) : 0,
        );
      } catch (err) {
        console.error("[guest-order] Coupon redemption error:", err);
        // Don't fail the upload if coupon recording fails
      }
    }

    // Notify admins
    const { data: admins } = await admin.from("users").select("id").eq("role", "admin");
    if (admins?.length) {
      await notifyUsers(admins.map((a: any) => a.id), {
        type: "system",
        title: `New upload from ${name}`,
        body: `${email} · ${designName} · ${placement} · ${files.length} file(s)`,
        action_url: "/admin/leads",
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[guest-order]", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
