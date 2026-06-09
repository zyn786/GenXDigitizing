// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { uploadToS3 } from "@/lib/s3";
import { notifyUsers } from "@/lib/notify";

const VALID_FORMATS = new Set(["DST","PES","EMB","JEF","XXX","VIP","HUS","EXP","VP3","SEW","AI","SVG","EPS","PDF"]);

export async function POST(req: NextRequest) {
  // Auth with standard client
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
    const formats = formData.getAll("formats") as string[];

    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });
    if (!files.length) return NextResponse.json({ error: "No files provided" }, { status: 400 });

    // All DB operations use admin client to bypass RLS
    const db = createAdminClient();

    // Verify designer assignment (or admin)
    if (profile.role === "designer") {
      const { data: designerData } = await db.from("designers").select("id").eq("user_id", user.id).single();
      if (!designerData) return NextResponse.json({ error: "Designer profile not found" }, { status: 403 });

      const { data: order } = await db.from("orders").select("designer_id, status").eq("id", orderId).single();
      if (!order || order.designer_id !== designerData.id) {
        return NextResponse.json({ error: "You are not assigned to this order" }, { status: 403 });
      }
    }

    const results = [];
    const now = Date.now();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 100 * 1024 * 1024) {
        return NextResponse.json({ error: `File ${file.name} exceeds 100MB limit` }, { status: 413 });
      }

      // Upload to S3
      const buffer = Buffer.from(await file.arrayBuffer());
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const key = `orders/${orderId}/output/${now}-${i}-${safeName}`;
      const fileUrl = await uploadToS3(buffer, key, file.type || "application/octet-stream");

      // Get next version
      const { data: existing } = await db
        .from("order_files")
        .select("version")
        .eq("order_id", orderId)
        .eq("file_type", "output")
        .order("version", { ascending: false })
        .limit(1);

      const nextVersion = (existing?.[0]?.version ?? 0) + 1;

      // Resolve valid format
      const uiFormat = formats[i];
      const ext = file.name.split(".").pop()?.toUpperCase();
      const resolvedFormat = (uiFormat && VALID_FORMATS.has(uiFormat)) ? uiFormat
        : (ext && VALID_FORMATS.has(ext)) ? ext : null;

      // Insert file record
      const { data: fileRecord, error } = await db
        .from("order_files")
        .insert({
          order_id: orderId,
          file_url: fileUrl,
          file_name: file.name,
          file_type: "output",
          ...(resolvedFormat ? { format: resolvedFormat } : {}),
          version: nextVersion,
          uploaded_by: user.id,
          file_size_kb: Math.round(file.size / 1024),
        })
        .select("id, file_url, file_name, version")
        .single();

      if (error) {
        return NextResponse.json({ error: "Failed to save file record", detail: String(error) }, { status: 500 });
      }

      results.push(fileRecord);
    }

    // Update status + notify
    const { data: orderData } = await db
      .from("orders")
      .select("status, order_number, clients(company_name)")
      .eq("id", orderId)
      .single();

    if (orderData && (orderData.status === "in_progress" || orderData.status === "revision" || orderData.status === "assigned")) {
      await db.from("orders").update({ status: "review" }).eq("id", orderId);

      const orderNumber = (orderData as any).order_number || `#${orderId.slice(0, 8)}`;
      const companyName = (orderData as any).clients?.company_name || "Client";

      const { data: admins } = await db.from("users").select("id").eq("role", "admin").eq("is_active", true);
      if (admins?.length) {
        await notifyUsers(admins.map((a: any) => a.id), {
          type: "order_update",
          title: `QA Submission — ${orderNumber}`,
          body: `${user.email || "Designer"} submitted files for ${companyName}. Ready for review.`,
          action_url: `/admin/orders/${orderId}`,
        });
      }
    }

    return NextResponse.json({ files: results });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Upload failed" }, { status: 500 });
  }
}
