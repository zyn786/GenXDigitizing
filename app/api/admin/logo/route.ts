// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/supabase/get-user";
import { cloudinary, getThumbnailUrl } from "@/lib/cloudinary";

// POST — upload platform logo
export async function POST(req: NextRequest) {
  try {
    const user = await getAdminUser().catch(() => null);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "genxdigitizing/logos",
          resource_type: "image",
          transformation: [{ quality: "auto", fetch_format: "auto" }],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    const url = getThumbnailUrl(result.public_id);

    // Save to DB — try upsert, fall back to direct insert
    const admin = createAdminClient();

    try {
      await admin.from("platform_settings").upsert({ key: "logo_url", value: url }).select();
    } catch (dbErr: any) {
      // Table might not exist — try insert into existing structure or notify
      console.error("[logo] DB save failed (run 010_platform_settings.sql):", dbErr.message);
    }

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("[logo] upload error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}

// GET — fetch current logo
export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("platform_settings").select("value").eq("key", "logo_url").maybeSingle();
    if (error) {
      console.error("[logo] GET error (run migration?):", error.message);
      return NextResponse.json({ url: null });
    }
    return NextResponse.json({ url: data?.value || null });
  } catch {
    return NextResponse.json({ url: null });
  }
}
