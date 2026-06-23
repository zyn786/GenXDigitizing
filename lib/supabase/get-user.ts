// @ts-nocheck
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

export interface SimpleUser {
  id:           string;
  email:        string;
  full_name:    string;
  role:         UserRole | string;
  avatar_url?:  string | null;
  client_id?:   string;
  designer_id?: string;
}

/**
 * Fetches the current user's profile from public.users.
 * Redirects to /login if not authenticated or profile is missing.
 * Works for ALL roles — admin, crm, client, designer.
 */
export async function getAdminUser(): Promise<SimpleUser> {
  const supabase = createClient();

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // stale / invalid session — redirect to login
  }

  if (!user) redirect("/login");

  const { data: p } = await supabase
    .from("users")
    .select("id, email, full_name, role, avatar_url")
    .eq("id", user.id)
    .single();

  if (!p) redirect("/login?error=profile_missing");

  // Fetch extended ID if needed
  let client_id:   string | undefined;
  let designer_id: string | undefined;

  if (p.role === "client") {
    const { data: c } = await supabase
      .from("clients").select("id").eq("user_id", user.id).single();
    client_id = c?.id;
  }
  if (p.role === "designer") {
    const { data: d } = await supabase
      .from("designers").select("id").eq("user_id", user.id).single();
    designer_id = d?.id;
  }

  return {
    id:          p.id,
    email:       p.email,
    full_name:   p.full_name ?? "",
    role:        p.role,
    avatar_url:  p.avatar_url ?? null,
    client_id,
    designer_id,
  };
}
