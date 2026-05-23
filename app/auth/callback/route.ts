// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { emailWelcome }              from "@/lib/email";

const PORTAL_HOME: Record<string, string> = {
  admin: "/admin", crm: "/crm", client: "/client", designer: "/designer",
};

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code     = searchParams.get("code");
  const next     = searchParams.get("next") ?? "";
  const redirect = searchParams.get("redirect") ?? "";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()    { return cookieStore.getAll(); },
        setAll(cs)  { try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {} },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback] exchangeCodeForSession:", error.message);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login?error=auth_failed`);

  // Ensure profile exists (trigger may be slightly delayed)
  const { data: profile } = await supabase
    .from("users").select("role, full_name").eq("id", user.id).single();

  let isNewUser = false;

  if (!profile) {
    isNewUser = true;
    const role = (user.user_metadata?.role as string) ?? "client";

    await supabase.from("users").insert({
      id:        user.id,
      email:     user.email ?? "",
      full_name: user.user_metadata?.full_name ?? "",
      role,
    }).onConflict("id").ignoreDuplicates();

    if (!role || role === "client") {
      await supabase.from("clients").insert({
        user_id:      user.id,
        company_name: user.user_metadata?.company_name ?? "",
        country:      user.user_metadata?.country ?? "",
      }).onConflict("user_id").ignoreDuplicates();
    }
  }

  // Send welcome email for new clients
  if (isNewUser || !profile) {
    const role = (user.user_metadata?.role ?? "client") as string;
    if (role === "client" && user.email) {
      emailWelcome({
        to:          user.email,
        clientName:  user.user_metadata?.full_name ?? "there",
        companyName: process.env.COMPANY_NAME ?? "GenXdigitizing",
      }).catch(console.error);
    }
  }

  // Auto-progress CRM lead: login → won
  if (user.email) {
    const { data: lead } = await supabase
      .from("crm_leads")
      .select("id")
      .eq("email", user.email)
      .in("stage", ["lead", "contacted"])
      .maybeSingle();

    if (lead) {
      const activityNote = `\n[${new Date().toISOString()}] Client logged in — auto moved to Won`;
      await supabase.from("crm_leads").update({
        stage: "won",
        notes: (lead.notes || "") + activityNote,
      }).eq("id", lead.id);
    }
  }

  const role = profile?.role ?? user.user_metadata?.role ?? "client";

  if (next === "/reset-password") return NextResponse.redirect(`${origin}/reset-password`);
  if (redirect)                   return NextResponse.redirect(`${origin}${redirect}`);

  const dest = PORTAL_HOME[role as string] ?? "/client";
  return NextResponse.redirect(`${origin}${dest}`);
}
