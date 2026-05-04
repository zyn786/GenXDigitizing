"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { QuoteOrderBuilder } from "@/components/quote-order/quote-order-builder";

type FlowContext = "guest" | "client";

type Props = {
  mode: "order" | "quote";
  flowContext?: FlowContext;
  user?: { name?: string | null; email?: string | null };
};

export function QuoteOrderOverlay({ mode, flowContext, user }: Props) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <button
        onClick={() => router.back()}
        aria-label="Close"
        className="fixed right-4 top-4 z-[60] flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/80 text-muted-foreground backdrop-blur-md transition hover:bg-card hover:text-foreground"
      >
        <X className="h-5 w-5" />
      </button>
      <QuoteOrderBuilder mode={mode} flowContext={flowContext} user={user} />
    </div>
  );
}
