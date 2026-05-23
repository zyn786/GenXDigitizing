// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadToS3 } from "@/lib/s3";

const ALLOWED_TYPES = [
  "application/octet-stream",
  "application/x-dst", "application/dst",
  "application/x-pes", "application/pes",
  "application/x-emb", "application/emb",
  "application/zip", "application/x-zip-compressed",
  "image/png", "image/jpeg",
];

export async function POST(req: NextRequest) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "designer" && profile.role !== "admin")) {
    return NextResponse.json({ error: "Only designers and admins can upload outputs" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const orderId = formData.get("orderId") as string;
    const files = formData.getAll("files") as File[];

    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });
    if (!files.length) return NextResponse.json({ error: "No files provided" }, { status: 400 });

    // Verify designer is assigned to this order (or is admin)
    if (profile.role === "designer") {
      const { data: designerData } = await supabase.from("designers").select("id").eq("user_id", user.id).single();
      const { data: order } = await supabase.from("orders").select("designer_id, status").eq("id", orderId).single();
      if (!order || order.designer_id !== designerData?.id) {
        return NextResponse.json({ error: "You are not assigned to this order" }, { status: 403 });
      }
    }

    const results = [];

    for (const file of files) {
      if (file.size > 100 * 1024 * 1024) {
        return NextResponse.json({ error: `File ${file.name} exceeds 100MB limit` }, { status: 413 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const key = `orders/${orderId}/output/${Date.now()}-${safeName}`;

      const fileUrl = await uploadToS3(buffer, key, file.type || "application/octet-stream");

      // Get current max version for this order's output files
      const { data: existing } = await supabase
        .from("order_files")
        .select("version")
        .eq("order_id", orderId)
        .eq("file_type", "output")
        .order("version", { ascending: false })
        .limit(1);

      const nextVersion = (existing?.[0]?.version ?? 0) + 1;

      // Detect format from extension
      const ext = file.name.split(".").pop()?.toUpperCase() || undefined;

      const { data: fileRecord, error } = await supabase
        .from("order_files")
        .insert({
          order_id: orderId,
          file_url: fileUrl,
          file_name: file.name,
          file_type: "output",
          format: ext,
          version: nextVersion,
          uploaded_by: user.id,
          file_size_kb: Math.round(file.size / 1024),
        })
        .select("id, file_url, file_name, version")
        .single();

      if (error) {
        console.error("[output upload] DB insert error:", error.message);
        return NextResponse.json({ error: "Failed to save file record" }, { status: 500 });
      }

      results.push(fileRecord);
    }

    // Update order status to "review" for QA after upload
    const { data: order } = await supabase.from("orders").select("status").eq("id", orderId).single();
    if (order?.status === "in_progress" || order?.status === "revision") {
      await supabase.from("orders").update({ status: "review" }).eq("id", orderId);
    }

    return NextResponse.json({ files: results, status: "review" });
  } catch (err: any) {
    console.error("[output upload]", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
