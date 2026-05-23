// @ts-nocheck
"use client";

import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";

type Props = {
  configs: {
    table: string;
    filter?: string;
    events?: ("INSERT" | "UPDATE" | "DELETE")[];
  }[];
};

/**
 * Invisible client component. Place inside a Server Component page
 * to subscribe to realtime changes and auto-refresh the route.
 */
export function RealtimeRefresher({ configs }: Props) {
  useRealtimeRefresh(configs);
  return null;
}
