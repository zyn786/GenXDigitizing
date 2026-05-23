"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if ((!url || !anonKey) && process.env.VERCEL === "1") {
    return { url: "https://placeholder.supabase.co", anonKey: "placeholder" };
  }
  return { url: url || "", anonKey: anonKey || "" };
}

export function createClient() {
  if (!browserClient) {
    const { url, anonKey } = getEnv();
    browserClient = createBrowserClient<Database>(url, anonKey);
  }
  return browserClient;
}
