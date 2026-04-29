"use client";

import { useEffect, useRef } from "react";
import { signOut } from "next-auth/react";

const INACTIVITY_LIMIT_MS = 60 * 60 * 1000; // 1 hour
const STORAGE_KEY = "genx-last-activity";

export function InactivityLogout() {
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    const stamp = () => {
      const now = Date.now();
      lastActivityRef.current = now;
      try {
        localStorage.setItem(STORAGE_KEY, String(now));
      } catch {
        // localStorage unavailable — ignore
      }
    };

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"] as const;
    events.forEach((e) => window.addEventListener(e, stamp, { passive: true }));

    const tick = setInterval(() => {
      let lastActivity = lastActivityRef.current;
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) lastActivity = Math.max(lastActivity, Number(stored));
      } catch {
        // ignore
      }

      if (Date.now() - lastActivity > INACTIVITY_LIMIT_MS) {
        signOut({ callbackUrl: "/login?status=session-expired" });
      }
    }, 60_000); // check every minute

    return () => {
      events.forEach((e) => window.removeEventListener(e, stamp));
      clearInterval(tick);
    };
  }, []);

  return null;
}
