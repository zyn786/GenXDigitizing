// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadToS3, S3_BUCKET } from "@/lib/s3";

export async function POST(req: NextRequest) {
  const supabase = createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get user role
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "client" && profile.role !== "admin")) {
    return NextResponse.json({ error: "Only clients and admins can upload artwork" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const orderId = formData.get("orderId") as string;
    const files = formData.getAll("files") as File[];

    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });
    if (!files.length) return NextResponse.json({ error: "No files provided" }, { status: 400 });

    // Verify user has access to this order (client owns it, or admin)
    if (profile.role === "client") {
      const { data: clientData } = await supabase.from("clients").select("id").eq("user_id", user.id).single();
      const { data: order } = await supabase.from("orders").select("client_id").eq("id", orderId).single();
      if (!order || order.client_id !== clientData?.id) {
        return NextResponse.json({ error: "You don't have access to this order" }, { status: 403 });
      }
    }

    const results = [];

    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json({ error: `File ${file.name} exceeds 50MB limit` }, { status: 413 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const key = `orders/${orderId}/artwork/${Date.now()}-${safeName}`;

      const fileUrl = await uploadToS3(buffer, key, file.type || "image/png");

      // Create order_files record
      const { data: fileRecord, error } = await supabase
        .from("order_files")
        .insert({
          order_id: orderId,
          file_url: fileUrl,
          file_name: file.name,
          file_type: "artwork",
          uploaded_by: user.id,
          file_size_kb: Math.round(file.size / 1024),
        })
        .select("id, file_url, file_name")
        .single();

      if (error) {
        console.error("[artwork upload] DB insert error:", error.message);
        return NextResponse.json({ error: "Failed to save file record" }, { status: 500 });
      }

      results.push(fileRecord);
    }

    return NextResponse.json({ files: results });
  } catch (err: any) {
    console.error("[artwork upload]", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
