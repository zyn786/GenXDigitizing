// @ts-nocheck
/**
 * Client & Designer Portal — Server-side data fetching.
 * All functions use the standard server client (RLS enforced).
 */
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isS3Key, extractS3Key, getS3SignedUrl } from "@/lib/s3";

// ── Shared helper ────────────────────────────────────────────

async function signFileUrl(supabase: ReturnType<typeof createClient>, f: any): Promise<any> {
  if (!f?.file_url) return { ...f, signed_url: f?.file_url };

  // S3 keys — generate S3 signed URL
  if (isS3Key(f.file_url)) {
    try {
      const key = extractS3Key(f.file_url);
      const signed = await getS3SignedUrl(key, 86400);
      return { ...f, signed_url: signed };
    } catch { return { ...f, signed_url: f.file_url }; }
  }

  let signedUrl = f.file_url;
  try {
    const bucket = f.file_type === "output" ? "outputs" : "artwork";
    let storagePath = "";

    if (f.file_url.startsWith("http")) {
      const urlObj = new URL(f.file_url);
      const marker = `/object/public/${bucket}/`;
      const markerSign = `/object/sign/${bucket}/`;
      if (urlObj.pathname.includes(marker)) {
        storagePath = decodeURIComponent(urlObj.pathname.split(marker)[1].split("?")[0]);
      } else if (urlObj.pathname.includes(markerSign)) {
        storagePath = decodeURIComponent(urlObj.pathname.split(markerSign)[1].split("?")[0]);
      }
    } else {
      storagePath = f.file_url;
    }

    if (storagePath) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(storagePath, 3600);
      if (error) {
        console.error("[signFileUrl] Signed URL failed:", error.message, "bucket:", bucket, "path:", storagePath);
      }
      if (data?.signedUrl) signedUrl = data.signedUrl;
    }
  } catch (err: any) {
    console.error("[signFileUrl] Exception:", err?.message ?? err, "file:", f.file_name);
  }

  return { ...f, signed_url: signedUrl };
}

// ── Client queries ────────────────────────────────────────────

export async function getClientProfile(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("clients")
    .select("id, company_name, country, phone, tier, ltv, credit_balance, joined_at")
    .eq("user_id", userId)
    .single();
  return data;
}

export async function getClientOrders(clientId: string) {
  const supabase = createAdminClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id, order_number, design_name, status, client_id, price, turnaround, output_format,
      stitch_count, placement_notes, sla_deadline, created_at, delivered_at,
      service_tiers ( id, label, category, size_desc, est_hours ),
      designers ( users ( full_name ) ),
      clients ( users ( full_name ) ),
      order_files ( id, file_url, file_name, file_type, format ),
      invoices ( id, status, amount, payoneer_checkout_url, pdf_url ),
      reviews ( * )
    `)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getClientOrders] DB error:", error.message, error.code);
    return [];
  }

  if (!orders?.length) return [];

  // Normalize reviews: PostgREST returns object for one-to-one (UNIQUE FK)
  for (const order of orders) {
    if (order.reviews && !Array.isArray(order.reviews)) {
      order.reviews = [order.reviews];
    }
  }

  // Generate signed URLs for all order_files across all orders
  const signedSupabase = createClient();
  const signed = await Promise.all(
    orders.map(async (order: any) => {
      const files = (order.order_files ?? []) as any[];
      const signedFiles = await Promise.all(files.map((f: any) => signFileUrl(signedSupabase, f)));
      return { ...order, order_files: signedFiles };
    })
  );

  // Payment gating: hide output files if invoice unpaid
  for (const order of signed) {
    const invoice = (order as any).invoices;
    if (invoice?.status !== "paid") {
      order.order_files = (order.order_files ?? []).filter((f: any) => f.file_type !== "output");
    }
  }

  return signed;
}

export async function getClientOrderById(orderId: string, clientId: string) {
  const supabase = createAdminClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      id, order_number, design_name, status, price, turnaround, output_format,
      additional_formats, stitch_count, width_inches, height_inches,
      color_count, placement_notes, sla_deadline,
      created_at, assigned_at, in_progress_at, completed_at, delivered_at,
      service_tiers ( id, label, category, size_desc ),
      designers ( users ( full_name ) ),
      order_files ( id, file_url, file_name, file_type, format, stitch_count, file_size_kb, created_at ),
      invoices ( id, status, amount, payoneer_checkout_url ),
      reviews ( * )
    `)
    .eq("id", orderId)
    .eq("client_id", clientId)
    .single();

  if (error) {
    console.error("[getClientOrderById] DB error:", error.message, error.code);
    return null;
  }

  if (!order) return null;

  // Normalize reviews: PostgREST returns object for one-to-one (UNIQUE FK)
  if (order.reviews && !Array.isArray(order.reviews)) {
    order.reviews = [order.reviews];
  }

  // Payment gating: hide output files if invoice unpaid
  const invoice = (order as any).invoices;
  if (invoice?.status !== "paid") {
    order.order_files = ((order.order_files ?? []) as any[]).filter((f: any) => f.file_type !== "output");
  }

  // Generate signed URLs for all order_files rows (1-hour expiry)
  const signedSupabase = createClient();
  const files = (order.order_files ?? []) as any[];
  const signedFiles = await Promise.all(files.map((f: any) => signFileUrl(signedSupabase, f)));

  return { ...order, order_files: signedFiles };
}

export async function getClientStats(clientId: string) {
  const supabase = createClient();
  const [
    { count: total },
    { count: active },
    { count: delivered },
    { data: spent },
  ] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("client_id", clientId),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("client_id", clientId).in("status", ["submitted","assigned","in_progress","review","approved"]),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("client_id", clientId).eq("status", "delivered"),
    supabase.from("invoices").select("amount").eq("client_id", clientId).eq("status", "paid"),
  ]);
  const totalSpent = (spent ?? []).reduce((s: number, i: any) => s + Number(i.amount), 0);
  return { total: total ?? 0, active: active ?? 0, delivered: delivered ?? 0, totalSpent };
}

export async function getServiceTiers() {
  const supabase = createClient();
  const { data } = await supabase
    .from("service_tiers")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return data ?? [];
}

export async function getClientMessages(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("messages")
    .select(`
      id, body, is_read, created_at, order_id,
      sender:from_user   ( id, full_name, role ),
      recipient:to_user  ( id, full_name, role )
    `)
    .or(`from_user.eq.${userId},to_user.eq.${userId}`)
    .order("created_at", { ascending: true })
    .limit(100);
  return data ?? [];
}

export async function getClientInvoices(clientId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("invoices")
    .select(`
      id, invoice_number, amount, currency, status, notes,
      payoneer_ref, payoneer_checkout_url, pdf_url, paid_at, created_at,
      orders ( id, order_number, service_tiers ( label ) )
    `)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

// ── Designer queries ──────────────────────────────────────────

export async function getDesignerProfile(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("designers")
    .select("id, avg_turnaround_h, avg_rating, revision_rate, total_orders, completed_orders, specialties")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function getDesignerActiveTasks(designerId: string) {
  const supabase = createClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id, order_number, design_name, status, turnaround, price, output_format,
      stitch_count, placement_notes, admin_notes, sla_deadline, created_at, assigned_at,
      clients ( company_name ),
      service_tiers ( label, category, size_desc, is_big_design ),
      order_files ( id, file_url, file_name, file_type )
    `)
    .eq("designer_id", designerId)
    .in("status", ["assigned","in_progress","review","revision"])
    .order("sla_deadline", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("[getDesignerActiveTasks] DB error:", error.message, error.code);
    return [];
  }

  if (!orders?.length) return [];

  const signed = await Promise.all(
    orders.map(async (order: any) => {
      const files = (order.order_files ?? []) as any[];
      const signedFiles = await Promise.all(files.map((f: any) => signFileUrl(supabase, f)));
      return { ...order, order_files: signedFiles };
    })
  );

  return signed;
}

export async function getDesignerCompletedOrders(designerId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id, order_number, design_name, status, turnaround, price, output_format,
      stitch_count, color_count, placement_notes, delivered_at, created_at,
      clients ( company_name ),
      service_tiers ( label, category, size_desc ),
      reviews ( * ),
      order_files ( id, file_url, file_name, file_type, format )
    `)
    .eq("designer_id", designerId)
    .in("status", ["approved", "delivered"])
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[getDesignerCompletedOrders] DB error:", error.message, error.code);
    return [];
  }

  if (!data?.length) return [];

  // Normalize reviews: PostgREST returns object for one-to-one (UNIQUE FK),
  // but UI expects array. Wrap single review objects in array.
  for (const order of data) {
    if (order.reviews && !Array.isArray(order.reviews)) {
      order.reviews = [order.reviews];
    }
  }

  // Sign files (S3 + Supabase Storage) — same as getDesignerActiveTasks
  const signedSupabase = createClient();
  const signed = await Promise.all(
    data.map(async (order: any) => {
      const files = (order.order_files ?? []) as any[];
      const signedFiles = await Promise.all(files.map((f: any) => signFileUrl(signedSupabase, f)));
      return { ...order, order_files: signedFiles };
    })
  );

  // Sort in-memory: approved orders may have null delivered_at, fallback to created_at
  signed.sort((a: any, b: any) => {
    const dateA = a.delivered_at || a.created_at;
    const dateB = b.delivered_at || b.created_at;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return signed;
}

export async function getDesignerMessages(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("messages")
    .select(`
      id, body, is_read, created_at, order_id,
      sender:from_user   ( id, full_name, role ),
      recipient:to_user  ( id, full_name, role )
    `)
    .or(`from_user.eq.${userId},to_user.eq.${userId}`)
    .order("created_at", { ascending: true })
    .limit(200);
  return data ?? [];
}
