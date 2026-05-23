// @ts-nocheck
import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/supabase";

/**
 * Supabase client for use inside Next.js middleware.
 * Must use request/response cookies (not next/headers).
 * Refreshes the session on every request so tokens stay valid.
 */
export function createMiddlewareClient(
  request: NextRequest,
  response: NextResponse
) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );
}
