// @ts-nocheck
"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { notify } from "@/lib/notify";
import type { Notification } from "@/types";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const Ctx = createContext<NotificationContextType | null>(null);

export function useNotificationContext() {
  const c = useContext(Ctx);
  if (!c) throw new Error("Missing NotificationProvider");
  return c;
}

export function NotificationProvider({ userId, children }: { userId: string | undefined; children: React.ReactNode }) {
  const supabase = useRef(createClient());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<any>(null);
  const subscribedRef = useRef(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase.current
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) setNotifications(data as Notification[]);
    setLoading(false);
  }, [userId]);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    setNotifications((p) => p.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
    await supabase.current
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("is_read", false);
  }, [userId]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((p) => p.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await supabase.current
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", id);
  }, []);

  // Single realtime subscription
  useEffect(() => {
    if (!userId || subscribedRef.current) return;

    fetchNotifications();
    subscribedRef.current = true;

    const channel = supabase.current.channel(`notifs-${userId}`);
    channelRef.current = channel;

    channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const n = payload.new as Notification;
          setNotifications((prev) => {
            if (prev.some((x) => x.id === n.id)) return prev;
            return [n, ...prev];
          });
          notify(n.title, n.body, n.action_url);
        }
      )
      .subscribe((status: string) => {
        if (status === "CLOSED" || status === "CHANNEL_ERROR") {
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
  }, [userId, fetchNotifications]);

  return (
    <Ctx.Provider value={{ notifications, unreadCount, loading, markAllRead, markRead, refetch: fetchNotifications }}>
      {children}
    </Ctx.Provider>
  );
}
