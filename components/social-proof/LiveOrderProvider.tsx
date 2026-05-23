"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { LiveOrderToast } from "./LiveOrderToast";
import { generateNotification } from "./data";
import type { FakeNotification } from "./data";

const MIN_INTERVAL = 18_000; // 18 seconds
const MAX_INTERVAL = 55_000; // 55 seconds
const DISPLAY_DURATION = 7_000; // 7 seconds visible
const MAX_VISIBLE = 2; // max toasts on screen at once

export function LiveOrderProvider() {
  const [notifications, setNotifications] = useState<FakeNotification[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const scheduleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const t = timersRef.current.get(id);
    if (t) { clearTimeout(t); timersRef.current.delete(id); }
  }, []);

  // Schedule next notification at random interval
  const scheduleNext = useCallback(() => {
    if (scheduleRef.current) clearTimeout(scheduleRef.current);

    const delay = Math.floor(Math.random() * (MAX_INTERVAL - MIN_INTERVAL)) + MIN_INTERVAL;

    scheduleRef.current = setTimeout(() => {
      setNotifications((prev) => {
        if (prev.length >= MAX_VISIBLE) return prev; // skip if screen full
        const notification = generateNotification();
        // Auto-dismiss after duration
        const dismissTimer = setTimeout(() => {
          dismiss(notification.id);
        }, DISPLAY_DURATION);
        timersRef.current.set(notification.id, dismissTimer);
        return [...prev, notification];
      });
      scheduleNext(); // queue next
    }, delay);
  }, [dismiss]);

  // Start on mount, stop on unmount
  useEffect(() => {
    // Initial notification after 3 seconds
    const initial = setTimeout(() => {
      const notification = generateNotification();
      const dismissTimer = setTimeout(() => dismiss(notification.id), DISPLAY_DURATION);
      timersRef.current.set(notification.id, dismissTimer);
      setNotifications([notification]);
      scheduleNext();
    }, 3000);

    return () => {
      clearTimeout(initial);
      if (scheduleRef.current) clearTimeout(scheduleRef.current);
      timersRef.current.forEach((t) => clearTimeout(t));
    };
  }, [dismiss, scheduleNext]);

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
