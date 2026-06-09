// @ts-nocheck
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { notify } from "@/lib/notify";
import type { Notification } from "@/types";

export function useNotifications(userId: string | undefined, opts?: { skipRealtime?: boolean }) {
  const skipRealtime = opts?.skipRealtime ?? false;
  const supabase = useRef(createClient());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    if (!userId) { return; }

    const { data, error } = await supabase.current
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[useNotifications] fetch failed:", error.message);
    }
    if (data) {
      setNotifications(data as Notification[]);
    }
    setLoading(false);
  }, [userId]);

  const markAllRead = useCallback(async () => {
    if (!userId) { return; }

    const prev = notifications;
    setNotifications((p) =>
      p.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
    );

    const { error } = await supabase.current
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("[useNotifications] markAllRead failed:", error.message);
      setNotifications(prev);
    }
  }, [userId, notifications]);

  const markRead = useCallback(async (notifId: string) => {
    const prev = notifications;
    setNotifications((p) =>
      p.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
    );

    const { error } = await supabase.current
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", notifId);

    if (error) {
      console.error("[useNotifications] markRead failed:", error.message);
      setNotifications(prev);
    }
  }, [notifications]);

  const channelRef = useRef<ReturnType<typeof supabase.current.channel> | null>(null);

  useEffect(() => {
    if (!userId) { return; }

    fetchNotifications();

    if (skipRealtime) return;

    // Prevent duplicate subscription
    if (channelRef.current) {
      supabase.current.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase.current.channel(`notifs-${userId}`);
    channelRef.current = channel;

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev]);
          notify(newNotif.title, newNotif.body, newNotif.action_url);
        }
      )
      .subscribe((status) => {
        console.log("[useNotifications] Realtime status:", status);
        if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          console.warn("[useNotifications] Realtime disconnected");
          channelRef.current = null;
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.current.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, fetchNotifications, skipRealtime]);

  return {
    notifications,
    unreadCount,
    loading,
    markAllRead,
    markRead,
    refetch: fetchNotifications,
  };
}
