// @ts-nocheck
"use client";

import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";

type Props = {
  configs: {
    table: string;
    filter?: string;
    events?: ("INSERT" | "UPDATE" | "DELETE")[];
  }[];
  /** Coalesce a burst of changes into one refresh. Defaults to 400ms. */
  debounceMs?: number;
};

/**
 * Invisible client component. Place inside a Server Component page
 * to subscribe to realtime changes and auto-refresh the route.
 */
export function RealtimeRefresher({ configs, debounceMs }: Props) {
  useRealtimeRefresh(configs, debounceMs ? { debounceMs } : undefined);
  return null;
}
