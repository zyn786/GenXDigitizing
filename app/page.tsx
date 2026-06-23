// @ts-nocheck
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const PORTAL: Record<string, string> = {
  admin: "/admin", crm: "/crm", client: "/client", designer: "/designer",
};

export default async function RootPage() {
  const supabase = createClient();

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // stale / invalid session — treat as unauthenticated
  }

  if (!user) {
    // Show the marketing landing page
    redirect("/home");
  }

  const { data: profile } = await supabase
    .from("users").select("role").eq("id", user.id).single();

  redirect(PORTAL[profile?.role] ?? "/client");
}
