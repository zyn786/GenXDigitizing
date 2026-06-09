// @ts-nocheck
"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useNotificationContext } from "./NotificationProvider";

interface BadgeState {
  orders: number;
  invoices: number;
  messages: number;
  notifications: number;
  total: number;
}

interface BadgeContextType extends BadgeState {
  markMessagesRead: () => void;
}

const Ctx = createContext<BadgeContextType | null>(null);

export function useBadges() {
  const c = useContext(Ctx);
  if (!c) throw new Error("Missing BadgeProvider");
  return c;
}

export function BadgeProvider({ userId, children }: { userId: string | undefined; children: React.ReactNode }) {
  const supabase = useRef(createClient());
  const { unreadCount } = useNotificationContext();
  const [badges, setBadges] = useState<BadgeState>({ orders: 0, invoices: 0, messages: 0, notifications: 0, total: 0 });
  const subscribedRef = useRef(false);
  const channelRef = useRef<any>(null);

  // Sync notifications count
  useEffect(() => {
    setBadges(p => ({ ...p, notifications: unreadCount }));
  }, [unreadCount]);

  const fetchCounts = useCallback(async () => {
    if (!userId) return;
    const [
      { count: pendingOrders },
      { count: unreadMsgs },
      { count: pendingInvoices },
    ] = await Promise.all([
      supabase.current.from("orders").select("*", { count: "exact", head: true }).eq("status", "submitted"),
      supabase.current.from("messages").select("*", { count: "exact", head: true }).eq("is_read", false).neq("from_user", userId),
      supabase.current.from("invoices").select("*", { count: "exact", head: true }).eq("status", "pending"),
    ]);
    setBadges(p => ({
      orders: pendingOrders ?? 0,
      invoices: pendingInvoices ?? 0,
      messages: unreadMsgs ?? 0,
      notifications: p.notifications,
      total: (pendingOrders ?? 0) + (pendingInvoices ?? 0) + (unreadMsgs ?? 0) + p.notifications,
    }));
  }, [userId]);

  // Subscribe to realtime
  useEffect(() => {
    if (!userId || subscribedRef.current) return;
    subscribedRef.current = true;
    fetchCounts();

    const channel = supabase.current.channel(`badges-${userId}`);
    channelRef.current = channel;

    const refetch = () => fetchCounts();

    channel
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, refetch)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, refetch)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `to_user=eq.${userId}` }, refetch)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "invoices" }, refetch)
      .subscribe((status: string) => {
        console.log("[BadgeProvider] Realtime status:", status);
        if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          console.warn("[BadgeProvider] Realtime disconnected");
          subscribedRef.current = false;
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.current.removeChannel(channelRef.current);
        channelRef.current = null;
        subscribedRef.current = false;
      }
    };
  }, [userId, fetchCounts]);

  const markMessagesRead = useCallback(() => {
    setBadges(p => ({ ...p, messages: 0 }));
  }, []);

  return (
    <Ctx.Provider value={{ ...badges, markMessagesRead }}>
      {children}
    </Ctx.Provider>
  );
}
