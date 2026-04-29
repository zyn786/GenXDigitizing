"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ConversationLauncherButtonProps = {
  mode: "client" | "admin";
  type: "ORDER" | "INVOICE";
  orderId?: string;
  invoiceId?: string;
  label?: string;
  className?: string;
};

export function ConversationLauncherButton({
  mode,
  type,
  orderId,
  invoiceId,
  label = "Open conversation",
  className,
}: ConversationLauncherButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    try {
      setLoading(true);

      const response = await fetch("/api/chat/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          orderId,
          invoiceId,
        }),
      });

      const data = (await response.json()) as {
        thread?: {
          thread: {
            id: string;
          };
        };
        error?: string;
      };

      if (!response.ok || !data.thread?.thread.id) {
        throw new Error(data.error ?? "Failed to open conversation.");
      }

      const base = mode === "client" ? "/client/support" : "/admin/support";
      router.push(`${base}/${data.thread.thread.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={
        className ??
        "inline-flex h-11 items-center rounded-full border border-border/80 bg-card/70 px-5 text-sm font-medium transition hover:bg-card disabled:opacity-50"
      }
    >
      {loading ? "Opening..." : label}
    </button>
  );
}