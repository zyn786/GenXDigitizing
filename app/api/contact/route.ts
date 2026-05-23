// @ts-nocheck
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { uploadToS3 } from "@/lib/s3";

const ALLOWED_TYPES = [
  "image/png", "image/jpeg", "image/webp",
  "application/pdf",
  "image/vnd.adobe.photoshop", "application/postscript",
  "application/illustrator",
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const name    = formData.get("name") as string;
    const email   = formData.get("email") as string;
    const company = formData.get("company") as string;
    const service = formData.get("service") as string;
    const message = formData.get("message") as string;
    const artwork = formData.get("artwork") as File | null;

    if (!name || !email || !company || !service || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (!artwork || !(artwork instanceof File)) {
      return NextResponse.json({ error: "Artwork file is required" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(artwork.type)) {
      return NextResponse.json({ error: "Invalid file type. Upload PNG, JPG, WEBP, PDF, AI, or PSD." }, { status: 400 });
    }

    if (artwork.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be under 20MB" }, { status: 400 });
    }

    // Upload artwork to S3 — folder: requests/
    const buffer = Buffer.from(await artwork.arrayBuffer());
    const safeName = artwork.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `requests/${Date.now()}-${safeName}`;
    const contentType = artwork.type || "application/octet-stream";

    await uploadToS3(buffer, key, contentType);

    // Generate view URL via the chat upload API (presigned URL)
    const artworkViewUrl = `/api/chat/upload?key=${encodeURIComponent(key)}`;

    const supabase = createAdminClient();

    // Create CRM lead with artwork info
    const { error } = await supabase.from("crm_leads").insert({
      contact_name: name,
      email,
      company: company || null,
      source: "website",
      stage: "lead",
      notes: [
        `Service: ${service}`,
        `Artwork: ${artwork.name} (${(artwork.size / 1024 / 1024).toFixed(1)}MB)`,
        `Download: ${artworkViewUrl}`,
        "",
        message,
      ].join("\n"),
    });

    if (error) {
      console.error("[contact] DB error:", error);
      return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
    }

    // Notify admins
    const { data: admins } = await supabase
      .from("users").select("id").eq("role", "admin");

    if (admins?.length) {
      await supabase.from("notifications").insert(
        admins.map((a: any) => ({
          user_id: a.id,
          type: "system",
          title: `New request from ${name}`,
          body: `${email} · ${company} · ${service} · Artwork attached`,
          action_url: "/admin/leads",
        }))
      );
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("[contact] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
