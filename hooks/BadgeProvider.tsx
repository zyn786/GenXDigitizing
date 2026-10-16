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
  /**
   * Conversations with unread channel messages — the unified inbox.
   *
   * RLS decides who actually sees a number here: migration 057 grants
   * `conversations` to admin and crm only, so every other role's query returns
   * zero rows rather than an error, and the badge simply stays absent.
   */
  inbox: number;
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

export function BadgeProvider({
  userId,
  children,
}: {
  userId: string | undefined;
  children: React.ReactNode;
}) {
  const supabase = useRef(createClient());
  const { unreadCount } = useNotificationContext();
  const [badges, setBadges] = useState<BadgeState>({
    orders: 0,
    invoices: 0,
    messages: 0,
    notifications: 0,
    inbox: 0,
    total: 0,
  });
  const subscribedRef = useRef(false);
  const channelRef = useRef<any>(null);

  // Sync notifications count
  useEffect(() => {
    setBadges((p) => ({ ...p, notifications: unreadCount }));
  }, [unreadCount]);

  const fetchCounts = useCallback(async () => {
    if (!userId) return;
    const [
      { count: pendingOrders },
      { count: unreadMsgs },
      { count: pendingInvoices },
      { count: unreadThreads },
    ] = await Promise.all([
      supabase.current
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "submitted"),
      supabase.current
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false)
        .neq("from_user", userId),
      supabase.current
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      // Counts threads, not messages: a customer sending four lines is one
      // thing to answer, and a badge of "4" would overstate the work.
      supabase.current
        .from("conversations")
        .select("*", { count: "exact", head: true })
        .gt("unread_count", 0),
    ]);
    setBadges((p) => ({
      orders: pendingOrders ?? 0,
      invoices: pendingInvoices ?? 0,
      messages: unreadMsgs ?? 0,
      notifications: p.notifications,
      inbox: unreadThreads ?? 0,
      total:
        (pendingOrders ?? 0) +
        (pendingInvoices ?? 0) +
        (unreadMsgs ?? 0) +
        (unreadThreads ?? 0) +
        p.notifications,
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
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `to_user=eq.${userId}` },
        refetch
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "invoices" }, refetch)
      // Needs migration 062 — `conversations` is not in the supabase_realtime
      // publication, so until that runs these two handlers never fire and the
      // inbox badge relies on the focus refresh below plus the inbox's own 30s
      // poll. Harmless if unpublished; just do not read "subscribed" as "live".
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversations" },
        refetch
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        refetch
      )
      .subscribe((status: string) => {
        if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          console.warn("[BadgeProvider] Realtime disconnected:", status);
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

  /**
   * Refresh when the tab becomes visible again.
   *
   * Staff leave this open in a background tab. Without this the counts freeze
   * at whenever the page loaded, and the inbox badge — the whole point of the
   * badge — shows a stale number until a manual reload. Doubles as the
   * freshness path for `conversations`, which is not on the realtime
   * publication yet.
   */
  useEffect(() => {
    if (!userId) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchCounts();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [userId, fetchCounts]);

  const markMessagesRead = useCallback(() => {
    setBadges((p) => ({ ...p, messages: 0 }));
  }, []);

  return <Ctx.Provider value={{ ...badges, markMessagesRead }}>{children}</Ctx.Provider>;
}
