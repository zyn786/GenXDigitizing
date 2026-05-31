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
      className="relative flex items-start gap-3 w-[300px] sm:w-[340px] p-3.5 sm:p-4 pr-10
        rounded-2xl pointer-events-auto select-none overflow-hidden"
      style={{
        background: "#FFFFFF",
        border: "1px solid var(--border2)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px]" style={{ background: "var(--border)" }}>
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
          className="absolute top-3 left-4 text-[9px] font-semibold px-2 py-0.5
            rounded-full border z-10"
          style={{ background: "var(--elevated)", borderColor: "var(--border2)", color: "var(--txt3)" }}>
          Paused
        </motion.div>
      )}

      {/* Close button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(); }}
        className="absolute top-2.5 right-2.5 w-6 h-6 rounded-lg flex items-center justify-center
          transition-all cursor-pointer bg-transparent border-none z-10 hover:opacity-70"
        style={{ color: "var(--txt3)" }}
      >
        <X size={13} />
      </button>

      {/* Service icon */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
        <span className="text-lg sm:text-xl leading-none">{emoji}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-[12px] sm:text-[13px] leading-snug font-semibold" style={{ color: "var(--txt)" }}>
          {firstName}{" "}
          <span className="font-normal" style={{ color: "var(--txt2)" }}>placed an order</span>
        </p>
        <p className="text-[11.5px] sm:text-[12px] mt-1 leading-snug" style={{ color: "var(--txt2)" }}>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10.5px] sm:text-[11px] font-bold"
            style={{
              background: `${accent}15`,
              color: accent,
              border: `1px solid ${accent}25`,
            }}>
            {emoji} {serviceLabel}
          </span>
        </p>
        <p className="text-[10px] mt-1.5 font-medium" style={{ color: "var(--txt3)" }}>
          {notification.timeAgo}
        </p>
      </div>

      {/* Accent dot */}
      <div
        className="absolute bottom-3 right-3 w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ background: accent, opacity: 0.6 }}
      />

      {/* Pause ring */}
      {isPaused && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            border: `2px solid ${accent}30`,
            boxShadow: `inset 0 0 24px ${accent}08`,
          }}
        />
      )}
    </motion.div>
  );
}
