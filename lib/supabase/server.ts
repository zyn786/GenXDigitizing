// @ts-nocheck
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

/**
 * Standard server client — respects RLS via the user's session cookie.
 * Use in Server Components, Server Actions, Route Handlers.
 */
export function createClient() {
  // In Next.js 14 with @supabase/ssr >=0.3, cookies() is synchronous here
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore: called from a Server Component where cookies can't be set
          }
        },
      },
    }
  );
}

/**
 * Admin/service-role client — bypasses ALL Row Level Security.
 * Only use in server-side code (Route Handlers, Server Actions).
 * NEVER expose this to the browser.
 */
export function createAdminClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
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
      auth: {
        autoRefreshToken: false,
        persistSession:   false,
      },
    }
  );
}
