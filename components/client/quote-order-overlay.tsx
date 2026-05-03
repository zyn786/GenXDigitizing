"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { QuoteOrderBuilder } from "@/components/quote-order/quote-order-builder";

type Props = {
  mode: "order" | "quote";
  flowContext?: "guest" | "client";
  userName?: string;
  userEmail?: string;
};

export function QuoteOrderOverlay({ mode, flowContext, userName, userEmail }: Props) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <button
        onClick={() => router.back()}
        aria-label="Close"
        className="fixed right-4 top-4 z-[60] flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#070816]/80 text-white/60 backdrop-blur-md transition hover:bg-white/10 hover:text-white"
      >
        <X className="h-5 w-5" />
      </button>
      <QuoteOrderBuilder
        mode={mode}
        flowContext={flowContext}
        userName={userName}
        userEmail={userEmail}
      />
    </div>
  );
}
