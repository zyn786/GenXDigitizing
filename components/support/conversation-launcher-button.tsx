"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type Props = {
  mode: "client" | "admin";
  type: "ORDER" | "INVOICE";
  orderId?: string;
  invoiceId?: string;
  label?: string;
  className?: string;
};

export function ConversationLauncherButton({
  mode, type, orderId, invoiceId, label = "Open conversation", className,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    try {
      setLoading(true);
      const response = await fetch("/api/chat/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, orderId, invoiceId }),
      });
      const data = (await response.json()) as { thread?: { thread: { id: string } }; error?: string };
      if (!response.ok || !data.thread?.thread.id) throw new Error(data.error ?? "Failed to open conversation.");
      const base = mode === "client" ? "/client/support" : "/admin/support";
      router.push(`${base}/${data.thread.thread.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      shape="pill"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {loading ? "Opening..." : label}
    </Button>
  );
}
