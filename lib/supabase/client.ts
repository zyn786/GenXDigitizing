"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // NEXT_PUBLIC_* vars are inlined at build time by Next.js.
    // If missing at runtime, the build was misconfigured or
    // Vercel dashboard env vars are not set for this environment.
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Add them in Vercel project settings → Environment Variables."
    );
  }

  return { url, anonKey };
}

export function createClient() {
  const { url, anonKey } = getEnv();
  return createBrowserClient<Database>(url, anonKey);
}
