// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/supabase/get-user";
import { cloudinary, getThumbnailUrl } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const user = await getAdminUser().catch(() => null);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const userId = formData.get("userId") as string;
    const file = formData.get("file") as File;

    if (!userId || !file) {
      return NextResponse.json({ error: "Missing userId or file" }, { status: 400 });
    }

    // Users can only update their own avatar; admins can update any
    if (user.role !== "admin" && user.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Max 5MB" }, { status: 400 });
    }

    // Upload to Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "genxdigitizing/avatars",
          resource_type: "image",
          transformation: [{ width: 200, height: 200, crop: "fill", gravity: "face", quality: "auto", fetch_format: "auto" }],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    const avatarUrl = getThumbnailUrl(result.public_id);

    // Update user profile
    const admin = createAdminClient();
    await admin.from("users").update({ avatar_url: avatarUrl }).eq("id", userId);

    return NextResponse.json({ url: avatarUrl });
  } catch (error: any) {
    console.error("[avatar] upload error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
