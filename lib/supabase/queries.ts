// @ts-nocheck
/**
 * Typed Supabase query helpers.
 * Import the relevant createClient (browser or server) before using.
 * These functions are pure data helpers — no React, no hooks.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type { UserRole } from "@/types";

type DB = SupabaseClient<Database>;

// ── Auth ─────────────────────────────────────────────────────

export async function getCurrentUser(supabase: DB) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function getCurrentUserRole(supabase: DB): Promise<UserRole | null> {
  const profile = await getCurrentUser(supabase);
  return profile?.role ?? null;
}

export async function getClientProfile(supabase: DB, userId: string) {
  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data;
}

export async function getDesignerProfile(supabase: DB, userId: string) {
  const { data } = await supabase
    .from("designers")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data;
}

// ── Orders ────────────────────────────────────────────────────

export async function getOrdersForAdmin(
  supabase: DB,
  options?: {
    status?: string;
    limit?: number;
    offset?: number;
    search?: string;
  }
) {
  let query = supabase
    .from("orders")
    .select(
      `
      *,
      clients ( id, company_name, tier,
        users ( id, full_name, email, avatar_url )
      ),
      designers ( id,
        users ( id, full_name, avatar_url )
      ),
      service_tiers ( id, label, category, size_desc ),
      invoices ( id, status, amount )
    `
    )
    .order("created_at", { ascending: false });

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit ?? 20) - 1);
  }

  const { data, error, count } = await query;
  return { data, error, count };
}

export async function getOrderById(supabase: DB, orderId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      clients ( *, users ( * ) ),
      designers ( *, users ( * ) ),
      service_tiers ( * ),
      order_files ( *, users ( full_name, avatar_url ) ),
      invoices ( * ),
      reviews ( * )
    `
    )
    .eq("id", orderId)
    .single();

  return { data, error };
}

export async function getOrdersForClient(supabase: DB, clientId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      service_tiers ( label, category, size_desc ),
      order_files ( id, file_url, file_name, file_type, format ),
      invoices ( id, status, amount, payoneer_checkout_url, pdf_url ),
      reviews ( id, stars )
    `
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  return { data, error };
}

export async function getRecentOrdersForLiveToast(supabase: DB, since: string) {
  const { data } = await supabase
    .from("orders")
    .select(`
      id, created_at, status,
      clients ( users ( full_name ) ),
      service_tiers ( label )
    `)
    .not("status", "in", '("pending","draft","cancelled")')
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(10);
  return data ?? [];
}

export async function getOrdersForDesigner(supabase: DB, designerId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      clients ( company_name ),
      service_tiers ( label, category, size_desc ),
      order_files ( id, file_url, file_name, file_type )
    `
    )
    .eq("designer_id", designerId)
    .in("status", ["assigned", "in_progress", "review"])
    .order("sla_deadline", { ascending: true });

  return { data, error };
}

// ── Clients ───────────────────────────────────────────────────

export async function getAllClients(supabase: DB) {
  const { data, error } = await supabase
    .from("clients")
    .select(
      `
      *,
      users ( id, email, full_name, avatar_url, is_active, last_sign_in )
    `
    )
    .order("ltv", { ascending: false });

  return { data, error };
}

export async function getClientById(supabase: DB, clientId: string) {
  const { data, error } = await supabase
    .from("clients")
    .select(
      `
      *,
      users ( * )
    `
    )
    .eq("id", clientId)
    .single();

  return { data, error };
}

// ── Designers ─────────────────────────────────────────────────

export async function getAllDesigners(supabase: DB) {
  const { data, error } = await supabase
    .from("designers")
    .select(`*, users ( id, email, full_name, avatar_url, is_active )`)
    .order("avg_rating", { ascending: false });

  return { data, error };
}

// ── Notifications ─────────────────────────────────────────────

export async function getNotifications(supabase: DB, userId: string, limit = 20) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return { data, error };
}

export async function markNotificationsRead(supabase: DB, userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("is_read", false);

  return { error };
}

// ── Messages ──────────────────────────────────────────────────

export async function getMessageThreads(supabase: DB, userId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select(
      `
      *,
      sender:from_user ( id, full_name, avatar_url, role ),
      recipient:to_user ( id, full_name, avatar_url, role )
    `
    )
    .or(`from_user.eq.${userId},to_user.eq.${userId}`)
    .order("created_at", { ascending: true });

  return { data, error };
}

// ── Service tiers / Pricing ───────────────────────────────────

export async function getServiceTiers(supabase: DB) {
  const { data, error } = await supabase
    .from("service_tiers")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return { data, error };
}

export async function updateServiceTierPrice(
  supabase: DB,
  tierId: string,
  price: number
) {
  const { data, error } = await supabase
    .from("service_tiers")
    .update({ price, updated_at: new Date().toISOString() })
    .eq("id", tierId)
    .select()
    .single();

  return { data, error };
}

// ── Reviews ───────────────────────────────────────────────────

export async function getAllReviews(supabase: DB) {
  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      *,
      clients ( company_name, users ( full_name, avatar_url ) ),
      orders ( order_number, service_tiers ( label ) )
    `
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return { data, error };
}

// ── Admin dashboard stats ─────────────────────────────────────

export async function getAdminDashStats(supabase: DB) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  ).toISOString();
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

  const [
    { count: ordersMTD },
    { count: ordersPrev },
    { data: revenueMTD },
    { data: revenuePrev },
    { count: activeClients },
    { count: pendingOrders },
    { data: ratingData },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfLastMonth)
      .lte("created_at", endOfLastMonth),
    supabase
      .from("invoices")
      .select("amount")
      .eq("status", "paid")
      .gte("paid_at", startOfMonth),
    supabase
      .from("invoices")
      .select("amount")
      .eq("status", "paid")
      .gte("paid_at", startOfLastMonth)
      .lte("paid_at", endOfLastMonth),
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .in("status", ["submitted", "assigned", "in_progress"]),
    supabase.from("reviews").select("stars"),
  ]);

  const revenue_mtd = revenueMTD?.reduce((s, r) => s + r.amount, 0) ?? 0;
  const revenue_prev_month = revenuePrev?.reduce((s, r) => s + r.amount, 0) ?? 0;
  const avg_rating =
    ratingData && ratingData.length > 0
      ? ratingData.reduce((s, r) => s + r.stars, 0) / ratingData.length
      : 0;

  return {
    orders_mtd: ordersMTD ?? 0,
    orders_prev_month: ordersPrev ?? 0,
    revenue_mtd,
    revenue_prev_month,
    active_clients: activeClients ?? 0,
    pending_orders: pendingOrders ?? 0,
    avg_rating: Math.round(avg_rating * 10) / 10,
    total_reviews: ratingData?.length ?? 0,
  };
}
