// @ts-nocheck
import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/supabase";

/**
 * Supabase client for use inside Next.js middleware.
 * Must use request/response cookies (not next/headers).
 * Refreshes the session on every request so tokens stay valid.
 */
function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if ((!url || !anonKey) && process.env.VERCEL === "1") {
    return { url: "https://placeholder.supabase.co", anonKey: "placeholder" };
  }
  return { url: url || "", anonKey: anonKey || "" };
}

export function createMiddlewareClient(
  request: NextRequest,
  response: NextResponse
) {
  const { url, anonKey } = getEnv();
  return createServerClient<Database>(url, anonKey, {
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
