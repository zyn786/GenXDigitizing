"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { serviceEmoji, serviceAccent } from "./data";
import type { LiveNotification } from "./data";

const DISPLAY_MS = 7000;

interface LiveOrderToastProps {
  notification: LiveNotification;
  onDismiss: () => void;
}

export function LiveOrderToast({ notification, onDismiss }: LiveOrderToastProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const { clientName, serviceLabel } = notification;
  const accent = serviceAccent(serviceLabel);
  const emoji = serviceEmoji(serviceLabel);

  // Countdown progress bar
  useEffect(() => {
    if (isPaused) return;
    const start = Date.now();
    const remaining = DISPLAY_MS * (progress / 100);
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / remaining) * 100);
      setProgress(pct);
      if (pct <= 0) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Extract first name from full name
  const firstName = clientName.split(" ")[0] || clientName;

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, y: -8, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      className="pointer-events-auto relative flex w-[300px] select-none items-start gap-3 overflow-hidden rounded-2xl p-3.5 pr-10 sm:w-[340px] sm:p-4"
      style={{
        background: "#FFFFFF",
        border: "1px solid var(--border2)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* Progress bar */}
      <div
        className="absolute left-0 right-0 top-0 h-[2.5px]"
        style={{ background: "var(--border)" }}
      >
        <motion.div
          className="h-full rounded-r-full"
          style={{
            background: `linear-gradient(90deg, ${accent}, ${accent}88)`,
            width: `${progress}%`,
          }}
        />
      </div>

      {/* Pause indicator */}
      {isPaused && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-4 top-3 z-10 rounded-full border px-2 py-0.5 text-[9px] font-semibold"
          style={{
            background: "var(--elevated)",
            borderColor: "var(--border2)",
            color: "var(--txt3)",
          }}
        >
          Paused
        </motion.div>
      )}

      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="absolute right-2.5 top-2.5 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent transition-all hover:opacity-70"
        style={{ color: "var(--txt3)" }}
      >
        <X size={13} />
      </button>

      {/* Service icon */}
      <div className="flex flex-shrink-0 flex-col items-center gap-1 pt-0.5">
        <span className="text-lg leading-none sm:text-xl">{emoji}</span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 pt-0.5">
        <p
          className="text-[12px] font-semibold leading-snug sm:text-[13px]"
          style={{ color: "var(--txt)" }}
        >
          {firstName}{" "}
          <span className="font-normal" style={{ color: "var(--txt2)" }}>
            placed an order
          </span>
        </p>
        <p
          className="mt-1 text-[11.5px] leading-snug sm:text-[12px]"
          style={{ color: "var(--txt2)" }}
        >
          <span
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-bold sm:text-[11px]"
            style={{
              background: `${accent}15`,
              color: accent,
              border: `1px solid ${accent}25`,
            }}
          >
            {emoji} {serviceLabel}
          </span>
        </p>
        <p className="mt-1.5 text-[10px] font-medium" style={{ color: "var(--txt3)" }}>
          {notification.timeAgo}
        </p>
      </div>

      {/* Accent dot */}
      <div
        className="absolute bottom-3 right-3 h-1.5 w-1.5 animate-pulse rounded-full"
        style={{ background: accent, opacity: 0.6 }}
      />

      {/* Pause ring */}
      {isPaused && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            border: `2px solid ${accent}30`,
            boxShadow: `inset 0 0 24px ${accent}08`,
          }}
        />
      )}
    </motion.div>
  );
}
