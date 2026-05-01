import Link from "next/link";
import type { Route } from "next";
import { Package, FileQuestion } from "lucide-react";

import type { PricingCatalog } from "@/lib/pricing/catalog";

export function DashboardActions({ catalog: _catalog }: { catalog?: PricingCatalog }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Link
        href={"/client/order" as Route}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
      >
        <Package className="h-3.5 w-3.5" />
        Place Order
      </Link>
      <Link
        href={"/client/quote" as Route}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border/80 px-5 text-xs font-semibold transition hover:bg-secondary/60"
      >
        <FileQuestion className="h-3.5 w-3.5" />
        Request Quote
      </Link>
    </div>
  );
}
