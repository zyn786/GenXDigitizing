// @ts-nocheck
/**
 * Upload one attachment for the admin email composer.
 *
 * Attachments used to be base64-encoded into the send-email JSON body, which
 * blew Vercel's 4.5MB serverless request limit and surfaced as a bare
 * "Internal server error". Files go to Supabase Storage instead, and the send
 * route receives only storage paths.
 *
 * Note the limit below is deliberately under the platform's 4.5MB request
 * body cap — a larger request never reaches this code at all.
 */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { uploadToStorage } from "@/lib/storage";
import { getAdminUser } from "@/lib/supabase/get-user";

/** Keep in sync with MAX_ATTACHMENT_BYTES in EmailComposer. */
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const user = await getAdminUser().catch(() => null);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        {
          error: `"${file.name}" is ${(file.size / 1048576).toFixed(1)}MB — the limit is 4MB per file.`,
        },
        { status: 413 }
      );
    }

    const safeName = (file.name || "attachment").replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `email-attachments/${Date.now()}-${safeName}`;
    const contentType = file.type || "application/octet-stream";

    await uploadToStorage(Buffer.from(await file.arrayBuffer()), path, contentType);

    return NextResponse.json({
      path,
      filename: file.name || safeName,
      size: file.size,
      content_type: contentType,
    });
  } catch (err: any) {
    console.error("[admin/email/upload]", err);
    return NextResponse.json({ error: err?.message || "Upload failed" }, { status: 500 });
  }
}
