// @ts-nocheck
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

function getEnv(): { url: string; anonKey: string; serviceKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // During build on Vercel, env vars may not be set yet.
  // Return placeholder values to prevent build crash.
  // At runtime, actual env vars from Vercel dashboard will be used.
  if (!url || !anonKey) {
    if (process.env.VERCEL === "1") {
      // Build-time on Vercel without env vars — use placeholders
      // Set real values in Vercel dashboard to replace these at runtime
      return {
        url: "https://placeholder.supabase.co",
        anonKey: "placeholder",
        serviceKey: serviceKey || "placeholder",
      };
    }
  }

  if (!url || !anonKey) {
    throw new Error(
      "@supabase/ssr: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Set them in your Vercel project dashboard or .env.local file."
    );
  }

  return { url, anonKey, serviceKey: serviceKey || "" };
}

/**
 * Standard server client — respects RLS via the user's session cookie.
 */
export function createClient() {
  const { url, anonKey } = getEnv();
  const cookieStore = cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {}
      },
    },
  });
}

/**
 * Admin/service-role client — bypasses ALL Row Level Security.
 * NEVER expose this to the browser.
 */
export function createAdminClient() {
  const { url, serviceKey } = getEnv();

  // Service-role client bypasses RLS entirely.
  // Must NOT attach user auth cookies — if a user JWT is present,
  // RLS evaluates against that user instead of the service role.
  return createServerClient<Database>(url, serviceKey, {
    cookies: {
      getAll() { return []; },
      setAll() {},
    },
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  });
}
