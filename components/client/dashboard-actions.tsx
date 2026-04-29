"use client";

import * as React from "react";
import { Package, FileQuestion } from "lucide-react";

import type { PricingCatalog } from "@/lib/pricing/catalog";
import { OrderModal } from "@/components/client/order-modal";
import { QuoteModal } from "@/components/client/quote-modal";

export function DashboardActions({ catalog }: { catalog?: PricingCatalog }) {
  const [orderOpen, setOrderOpen] = React.useState(false);
  const [quoteOpen, setQuoteOpen] = React.useState(false);

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          onClick={() => setOrderOpen(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <Package className="h-3.5 w-3.5" />
          Place Order
        </button>
        <button
          onClick={() => setQuoteOpen(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border/80 px-5 text-xs font-semibold transition hover:bg-secondary/60"
        >
          <FileQuestion className="h-3.5 w-3.5" />
          Request Quote
        </button>
      </div>

      <OrderModal open={orderOpen} onClose={() => setOrderOpen(false)} catalog={catalog} />
      <QuoteModal open={quoteOpen} onClose={() => setQuoteOpen(false)} catalog={catalog} />
    </>
  );
}
