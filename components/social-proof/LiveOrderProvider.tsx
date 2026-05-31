// @ts-nocheck
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { LiveOrderToast } from "./LiveOrderToast";
import { createClient } from "@/lib/supabase/client";
import { getRecentOrdersForLiveToast } from "@/lib/supabase/queries";
import { formatTimeAgo } from "./data";
import type { LiveNotification } from "./data";

const POLL_INTERVAL = 30_000; // 30 seconds
const DISPLAY_DURATION = 7_000;
const MAX_VISIBLE = 2;
const LOOKBACK_MINUTES = 120; // show orders from last 2 hours

export function LiveOrderProvider() {
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const shownIds = useRef<Set<string>>(new Set());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const t = timersRef.current.get(id);
    if (t) { clearTimeout(t); timersRef.current.delete(id); }
  }, []);

  const showNotification = useCallback((notification: LiveNotification) => {
    setNotifications((prev) => {
      if (prev.length >= MAX_VISIBLE) return prev;
      const dismissTimer = setTimeout(() => dismiss(notification.id), DISPLAY_DURATION);
      timersRef.current.set(notification.id, dismissTimer);
      return [...prev, notification];
    });
  }, [dismiss]);

  const poll = useCallback(async () => {
    try {
      const supabase = createClient();
      const since = new Date(Date.now() - LOOKBACK_MINUTES * 60 * 1000).toISOString();
      const orders = await getRecentOrdersForLiveToast(supabase, since);

      for (const order of orders ?? []) {
        if (shownIds.current.has(order.id)) continue;
        shownIds.current.add(order.id);

        // Keep set bounded
        if (shownIds.current.size > 200) {
          const first = shownIds.current.values().next().value;
          if (first) shownIds.current.delete(first);
        }

        const clientName: string = (order as any).clients?.users?.full_name ?? "Someone";
        const serviceLabel: string = (order as any).service_tiers?.label ?? "Order";
        const createdAt = new Date((order as any).created_at);

        const notification: LiveNotification = {
          id: order.id,
          clientName,
          serviceLabel,
          timestamp: createdAt,
          timeAgo: formatTimeAgo(createdAt),
        };

        showNotification(notification);
      }
    } catch {
      // Silently ignore — polling will retry
    }
  }, [showNotification]);

  useEffect(() => {
    // Initial fetch
    poll();
    // Then poll on interval
    pollRef.current = setInterval(poll, POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      timersRef.current.forEach((t) => clearTimeout(t));
    };
  }, [poll]);

  return (
    <div
      className="fixed bottom-14 sm:bottom-16 right-2 sm:right-6 z-[150] flex flex-col-reverse gap-2 sm:gap-2.5 pointer-events-none"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-live="polite"
      aria-label="Live order activity"
    >
      <AnimatePresence mode="popLayout">
        {notifications.map((n) => (
          <LiveOrderToast
            key={n.id}
            notification={n}
            onDismiss={() => dismiss(n.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
