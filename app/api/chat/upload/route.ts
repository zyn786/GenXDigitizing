// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { uploadToStorage, signStorageUrl } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > 250 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum 250MB allowed." }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `chat/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const contentType = file.type || "application/octet-stream";

    await uploadToStorage(buffer, key, contentType);

    // Permanent URL — resolves via this API to a fresh signed URL
    const permanentUrl = `/api/chat/upload?key=${encodeURIComponent(key)}`;

    return NextResponse.json({ url: permanentUrl, path: key, fileName: file.name, size: file.size });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Upload failed" }, { status: 500 });
  }
}

// GET — resolve signed URL for a stored key (chat, guest-uploads, or requests paths)
export async function GET(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get("key");
    if (!key) {
      return NextResponse.json({ error: "Missing key param" }, { status: 400 });
    }

    const signedUrl = await signStorageUrl(key, undefined, 86400);
    if (!signedUrl) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    return NextResponse.redirect(signedUrl);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Failed" }, { status: 500 });
  }
}
