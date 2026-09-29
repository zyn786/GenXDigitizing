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

type Options = {
  /** How long to coalesce a burst of changes before refreshing. */
  debounceMs?: number;
};

/**
 * Subscribes to Supabase realtime postgres_changes for the given tables and
 * re-renders server components with fresh data.
 *
 * Two things this does beyond passing the event straight through, both of which
 * matter as soon as real traffic arrives:
 *
 *   · **Coalescing.** An "Import from Resend" writes every message in one go, so
 *     a single sync produced one router.refresh() per row — a hundred full server
 *     re-renders for one user action, each one aborting the last. Changes are now
 *     debounced into a single refresh.
 *
 *   · **Visibility.** Refreshing a tab nobody is looking at is wasted work, and
 *     coming back to it caused a burst. Events that land while the tab is hidden
 *     set a pending flag instead; the refresh happens once on return.
 *
 * The subscription itself is kept alive deliberately: unlike a polling loop it
 * holds no data, so there is no client cache that can drift from the server.
 * The server component stays the single source of truth and the socket only
 * says "this changed, look again".
 */
export function useRealtimeRefresh(configs: TableConfig[], opts: Options = {}) {
  const debounceMs = opts.debounceMs ?? 400;
  const router = useRouter();
  const supabase = createClient();
  const mounted = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingWhileHidden = useRef(false);

  // Stable config key to avoid re-subscribing on every render
  const configKey = JSON.stringify(configs);

  useEffect(() => {
    mounted.current = true;

    function refreshNow() {
      timer.current = null;
      pendingWhileHidden.current = false;
      router.refresh();
    }

    function schedule() {
      if (!mounted.current) return;

      // Nobody is looking — remember it and refresh on return instead.
      if (typeof document !== "undefined" && document.hidden) {
        pendingWhileHidden.current = true;
        return;
      }

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(refreshNow, debounceMs);
    }

    function onVisible() {
      if (document.hidden || !pendingWhileHidden.current) return;
      schedule();
    }

    document.addEventListener("visibilitychange", onVisible);

    const channels = configs.map((cfg, idx) => {
      const events = cfg.events ?? ["INSERT", "UPDATE", "DELETE"];
      const channelName = `rt-${cfg.table}-${idx}`;

      const channel = supabase.channel(channelName);

      for (const event of events) {
        channel.on(
          "postgres_changes",
          { event, schema: "public", table: cfg.table, filter: cfg.filter || undefined },
          schedule
        );
      }

      channel.subscribe((status: string) => {
        // Surface it rather than going quiet: a table missing from the
        // supabase_realtime publication never fires, and previously produced a
        // silently dead subscription that looked identical to "no new mail".
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn(
            `[realtime] subscription for ${cfg.table} is ${status} — is it in the supabase_realtime publication?`
          );
        }
      });

      return channel;
    });

    return () => {
      mounted.current = false;
      if (timer.current) clearTimeout(timer.current);
      document.removeEventListener("visibilitychange", onVisible);
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey, supabase, router, debounceMs]);
}
