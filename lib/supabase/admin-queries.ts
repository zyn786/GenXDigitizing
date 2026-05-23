// @ts-nocheck
/**
 * Admin Portal — Server-side data fetching functions.
 * All functions use the server Supabase client (respects RLS).
 * Called from Server Components — no "use client".
 */
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isS3Key, extractS3Key, getS3SignedUrl } from "@/lib/s3";

// ── Shared helper ────────────────────────────────────────────

async function signFileUrl(supabase: ReturnType<typeof createAdminClient>, f: any): Promise<any> {
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

// ── Dashboard stats ───────────────────────────────────────────

export async function getAdminStats() {
  const supabase = createClient();
  const now      = new Date();
  const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const prevStart= new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const prevEnd  = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

  const [
    { count: ordersMTD },
    { count: ordersPrev },
    { data: revMTD },
    { data: revPrev },
    { count: totalClients },
    { count: activeOrders },
    { data: ratingData },
    { data: weeklyData },
  ] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }).gte("created_at", mtdStart),
    supabase.from("orders").select("*", { count: "exact", head: true }).gte("created_at", prevStart).lte("created_at", prevEnd),
    supabase.from("invoices").select("amount").eq("status", "paid").gte("paid_at", mtdStart),
    supabase.from("invoices").select("amount").eq("status", "paid").gte("paid_at", prevStart).lte("paid_at", prevEnd),
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }).in("status", ["submitted", "assigned", "in_progress", "review", "approved"]),
    supabase.from("reviews").select("stars"),
    supabase.from("orders").select("created_at").gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
  ]);

  const revenue_mtd   = revMTD?.reduce((s, r) => s + Number(r.amount), 0) ?? 0;
  const revenue_prev  = revPrev?.reduce((s, r) => s + Number(r.amount), 0) ?? 0;
  const avg_rating    = ratingData?.length
    ? ratingData.reduce((s, r) => s + r.stars, 0) / ratingData.length : 0;

  // Build weekly bar data (last 7 days)
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const weekly = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const label = days[d.getDay()];
    const count = weeklyData?.filter(o => new Date(o.created_at).toDateString() === d.toDateString()).length ?? 0;
    return { day: label, orders: count };
  });

  return {
    orders_mtd:    ordersMTD   ?? 0,
    orders_prev:   ordersPrev  ?? 0,
    revenue_mtd,
    revenue_prev,
    active_clients: totalClients ?? 0,
    active_orders:  activeOrders ?? 0,
    avg_rating:    Math.round(avg_rating * 10) / 10,
    total_reviews: ratingData?.length ?? 0,
    weekly,
  };
}

// ── Orders ────────────────────────────────────────────────────

export async function getAdminOrders(opts?: {
  status?: string;
  search?: string;
  limit?:  number;
  offset?: number;
}) {
  const supabase = createClient();
  let q = supabase
    .from("orders")
    .select(`
      id, order_number, status, priority, turnaround, price, currency,
      stitch_count, output_format, service_tier_id, sla_deadline,
      created_at, updated_at,
      clients!inner ( id, company_name, tier,
        users ( id, full_name, email )
      ),
      designers (
        id, users ( id, full_name )
      ),
      service_tiers ( id, label, category, size_desc )
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 50);

  if (opts?.status && opts.status !== "all") {
    q = q.eq("status", opts.status);
  }
  if (opts?.offset) {
    q = q.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1);
  }

  const { data, error, count } = await q;
  return { data: data ?? [], error, count: count ?? 0 };
}

export async function getAdminOrderById(id: string) {
  const supabase = createClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      *,
      clients ( *, users ( * ) ),
      designers ( *, users ( * ) ),
      service_tiers ( * ),
      order_files ( *, users ( full_name, avatar_url ) ),
      invoices ( * ),
      reviews ( * )
    `)
    .eq("id", id)
    .single();

  if (error || !order) return { data: null, error };

  // Generate signed URLs using admin client (bypasses RLS on storage)
  const adminSupabase = createAdminClient();
  const files = (order.order_files ?? []) as any[];
  const signedFiles = await Promise.all(files.map((f: any) => signFileUrl(adminSupabase, f)));

  return { data: { ...order, order_files: signedFiles }, error: null };
}

// ── Clients ───────────────────────────────────────────────────

export async function getAdminClients() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clients")
    .select(`
      id, company_name, country, phone, tier, ltv, credit_balance, joined_at,
      users ( id, email, full_name, avatar_url, is_active, last_sign_in )
    `)
    .order("ltv", { ascending: false });
  return { data: data ?? [], error };
}

export async function getClientWithOrders(clientId: string) {
  const supabase = createClient();
  const [{ data: client }, { data: orders }, { data: reviews }] = await Promise.all([
    supabase.from("clients").select("*, users(*)").eq("id", clientId).single(),
    supabase.from("orders")
      .select("id, order_number, status, price, turnaround, created_at, service_tiers(label)")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("reviews")
      .select("stars, text, created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
  ]);
  return { client, orders: orders ?? [], reviews: reviews ?? [] };
}

// ── Designers ─────────────────────────────────────────────────

export async function getAdminDesigners() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("designers")
    .select(`
      id, avg_turnaround_h, avg_rating, revision_rate, total_orders, completed_orders, specialties,
      users ( id, email, full_name, avatar_url, is_active )
    `)
    .order("avg_rating", { ascending: false });
  return { data: data ?? [], error };
}

export async function getDesignerWithOrders(designerId: string) {
  const supabase = createClient();
  const [{ data: designer }, { data: orders }] = await Promise.all([
    supabase.from("designers").select("*, users(*)").eq("id", designerId).single(),
    supabase.from("orders")
      .select("id, order_number, status, turnaround, created_at, clients(company_name), service_tiers(label)")
      .eq("designer_id", designerId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  return { designer, orders: orders ?? [] };
}

// ── Reviews ───────────────────────────────────────────────────

export async function getAdminReviews() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(`
      id, stars, text, is_published, created_at,
      clients ( id, company_name, users ( full_name, avatar_url ) ),
      orders ( id, order_number, service_tiers ( label ) )
    `)
    .order("created_at", { ascending: false });

  const reviews   = data ?? [];
  const avg       = reviews.length ? reviews.reduce((s, r) => s + r.stars, 0) / reviews.length : 0;
  const fiveStar  = reviews.filter(r => r.stars === 5).length;

  return {
    data: reviews,
    error,
    avg_rating:     Math.round(avg * 10) / 10,
    total:          reviews.length,
    five_star_pct:  reviews.length ? Math.round((fiveStar / reviews.length) * 100) : 0,
  };
}

// ── Service tiers / Pricing ───────────────────────────────────

export async function getServiceTiers() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("service_tiers")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return { data: data ?? [], error };
}

// ── Messages ──────────────────────────────────────────────────

export async function getAdminMessages() {
  const supabase = createClient();

  // Get all messages involving admin users or unread ones
  const { data, error } = await supabase
    .from("messages")
    .select(`
      id, body, subject, is_read, created_at, order_id,
      sender:from_user ( id, full_name, avatar_url, role ),
      recipient:to_user ( id, full_name, avatar_url, role ),
      orders ( id, order_number )
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  // Group into threads by participant pair
  const threads = new Map<string, any>();
  for (const msg of data ?? []) {
    const sender    = (msg as any).sender;
    const recipient = (msg as any).recipient;
    if (!sender || !recipient) { continue; }

    const key = [sender.id, recipient.id].sort().join("-");
    if (!threads.has(key)) {
      const other = sender.role !== "admin" ? sender : recipient;
      threads.set(key, {
        key,
        participant:  other,
        messages:     [],
        unread:       0,
        last_message: null,
      });
    }
    const thread = threads.get(key)!;
    thread.messages.push(msg);
    if (!msg.is_read && (msg as any).recipient?.role === "admin") { thread.unread++; }
    if (!thread.last_message || new Date(msg.created_at) > new Date(thread.last_message.created_at)) {
      thread.last_message = msg;
    }
  }

  return { threads: Array.from(threads.values()), error };
}

// ── Reports ───────────────────────────────────────────────────

export async function getAdminReports() {
  const supabase = createClient();
  const year     = new Date().getFullYear();

  const [
    { data: monthlyInvoices },
    { data: serviceBreakdown },
    { data: designerStats },
    { data: topClients },
  ] = await Promise.all([
    // Monthly revenue for current year
    supabase.from("invoices")
      .select("amount, paid_at")
      .eq("status", "paid")
      .gte("paid_at", `${year}-01-01`)
      .lte("paid_at", `${year}-12-31`),

    // Orders by service tier
    supabase.from("orders")
      .select("service_tier_id, price, service_tiers(label, category)"),

    // Designer performance
    supabase.from("designers")
      .select("id, avg_rating, avg_turnaround_h, completed_orders, revision_rate, total_orders, users(full_name)")
      .order("completed_orders", { ascending: false })
      .limit(10),

    // Top clients by LTV
    supabase.from("clients")
      .select("id, company_name, ltv, tier, users(email)")
      .order("ltv", { ascending: false })
      .limit(10),
  ]);

  // Build monthly chart data
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthly = months.map((month, i) => {
    const monthOrders = monthlyInvoices?.filter(inv => {
      if (!inv.paid_at) { return false; }
      return new Date(inv.paid_at).getMonth() === i;
    }) ?? [];
    return {
      month,
      revenue: monthOrders.reduce((s, inv) => s + Number(inv.amount), 0),
      orders:  monthOrders.length,
    };
  });

  // Service breakdown
  const svcMap = new Map<string, { label: string; category: string; count: number; revenue: number }>();
  for (const order of serviceBreakdown ?? []) {
    const tier = (order as any).service_tiers;
    if (!tier) { continue; }
    const key = order.service_tier_id;
    if (!svcMap.has(key)) {
      svcMap.set(key, { label: tier.label, category: tier.category, count: 0, revenue: 0 });
    }
    const entry = svcMap.get(key)!;
    entry.count++;
    entry.revenue += Number(order.price);
  }
  const totalOrders = (serviceBreakdown ?? []).length || 1;
  const breakdown = Array.from(svcMap.values())
    .sort((a, b) => b.count - a.count)
    .map(s => ({ ...s, pct: Math.round((s.count / totalOrders) * 100) }));

  return {
    monthly,
    breakdown,
    designers: designerStats ?? [],
    topClients: topClients ?? [],
    totalRevenue: (monthlyInvoices ?? []).reduce((s, inv) => s + Number(inv.amount), 0),
    totalOrders: serviceBreakdown?.length ?? 0,
  };
}
