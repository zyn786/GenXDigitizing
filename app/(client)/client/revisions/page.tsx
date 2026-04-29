import type { Metadata } from "next";
import Link from "next/link";
import { RefreshCw } from "lucide-react";

import { buildTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: buildTitle("Revisions"),
};

export default function ClientRevisionsPage() {
  return (
    <div className="grid gap-6">
      <section>
        <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Revisions
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Revision requests
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          Track open revision requests across your orders. Request changes to a
          delivered proof directly from the order detail page.
        </p>
      </section>

      <div className="flex flex-col items-center justify-center rounded-[2rem] border border-border/80 bg-card/70 py-16 text-center">
        <RefreshCw className="h-8 w-8 text-muted-foreground/40" />
        <div className="mt-3 text-sm font-medium">No open revisions</div>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          When you request changes to a delivered proof, those requests will
          appear here so you can track their status.
        </p>
        <Link
          href="/client/orders"
          className="mt-6 inline-flex h-9 items-center rounded-full border border-border/80 px-5 text-xs font-semibold transition hover:bg-secondary"
        >
          View my orders
        </Link>
      </div>
    </div>
  );
}
