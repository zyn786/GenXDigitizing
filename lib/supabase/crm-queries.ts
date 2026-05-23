// @ts-nocheck
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function getCRMContacts() {
  const supabase = createClient();
  const { data } = await supabase
    .from("clients")
    .select(`
      id, company_name, country, phone, tier, ltv, credit_balance,
      is_active, joined_at,
      users ( id, full_name, email, last_sign_in_at )
    `)
    .order("ltv", { ascending: false });
  return data ?? [];
}

export async function getCRMContactWithOrders(clientId: string) {
  const supabase = createClient();
  const [{ data: client }, { data: orders }] = await Promise.all([
    supabase
      .from("clients")
      .select(`
        id, company_name, country, phone, tier, ltv, credit_balance, is_active, joined_at,
        users ( id, full_name, email, last_sign_in_at )
      `)
      .eq("id", clientId)
      .single(),
    supabase
      .from("orders")
      .select(`
        id, order_number, status, price, turnaround, created_at, delivered_at,
        service_tiers ( label, category ),
        reviews ( stars )
      `)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  return { client, orders: orders ?? [] };
}

export async function getCRMLeads() {
  const supabase = createClient();

  // Auto-lost: leads older than 3 days with no activity → lost
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  try {
    const admin = createAdminClient();
    const { data: staleLeads } = await admin
      .from("crm_leads")
      .select("id, notes")
      .in("stage", ["lead", "contacted"])
      .lt("updated_at", threeDaysAgo);

    if (staleLeads?.length) {
      for (const lead of staleLeads) {
        const activityNote = `\n[${new Date().toISOString()}] Auto moved to Lost — no client login for 3+ days`;
        await admin.from("crm_leads").update({
          stage: "lost",
          notes: (lead.notes || "") + activityNote,
        }).eq("id", lead.id);
      }
    }
  } catch (e) {
    console.error("[getCRMLeads] auto-lost check failed:", e);
  }

  const { data, error } = await supabase
    .from("crm_leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[getCRMLeads]", error.message);
    return [];
  }
  return data ?? [];
}

export async function getCRMStats() {
  const supabase = createClient();
  const [
    { count: totalClients },
    { count: activeClients },
    { count: totalLeads },
    { data: revenueData },
  ] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase.from("clients").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("crm_leads").select("*", { count: "exact", head: true }),
    supabase.from("invoices").select("amount").eq("status", "paid"),
  ]);

  const totalRevenue = (revenueData ?? []).reduce((s: number, i: any) => s + Number(i.amount), 0);

  return {
    totalClients:  totalClients  ?? 0,
    activeClients: activeClients ?? 0,
    totalLeads:    totalLeads    ?? 0,
    totalRevenue,
  };
}

export async function getCRMReviews() {
  const supabase = createClient();
  const { data } = await supabase
    .from("reviews")
    .select(`
      id, stars, text, is_published, created_at,
      clients ( company_name, users ( full_name ) ),
      orders ( order_number, service_tiers ( label ) )
    `)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getCRMMessages() {
  const supabase = createClient();
  const { data } = await supabase
    .from("messages")
    .select(`
      id, body, is_read, created_at,
      sender:from_user   ( id, full_name, role ),
      recipient:to_user  ( id, full_name, role )
    `)
    .order("created_at", { ascending: false })
    .limit(200);
  return data ?? [];
}
