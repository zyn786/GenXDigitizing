// @ts-nocheck
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type TableConfig = {
  table: string;
  filter?: string;
  events?: ("INSERT" | "UPDATE" | "DELETE")[];
};

/**
 * Subscribes to Supabase realtime postgres_changes for given tables.
 * When a change event fires, calls router.refresh() to re-render
 * server components with fresh data.
 */
export function useRealtimeRefresh(configs: TableConfig[]) {
  const router = useRouter();
  const supabase = createClient();
  const mounted = useRef(true);

  // Stable config key to avoid re-subscribing on every render
  const configKey = JSON.stringify(configs);

  useEffect(() => {
    mounted.current = true;

    const channels = configs.map((cfg, idx) => {
      const events = cfg.events ?? ["INSERT", "UPDATE", "DELETE"];
      const channelName = `rt-${cfg.table}-${idx}`;

      const channel = supabase.channel(channelName);

      for (const event of events) {
        channel.on(
          "postgres_changes",
          { event, schema: "public", table: cfg.table, filter: cfg.filter || undefined },
          () => {
            if (mounted.current) {
              router.refresh();
            }
          }
        );
      }

      return channel.subscribe();
    });

    return () => {
      mounted.current = false;
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey, supabase, router]);
}
