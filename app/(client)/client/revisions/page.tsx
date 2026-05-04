import type { Metadata } from "next";
import Link from "next/link";
import { RefreshCw, MessageCircle, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildTitle } from "@/lib/site";

export const metadata: Metadata = { title: buildTitle("Revisions") };

export default function ClientRevisionsPage() {
  return (
    <div className="grid gap-6">
      <section>
        <p className="section-eyebrow">Revisions</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Revision Requests</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Track open revision requests across your orders. Request changes to a delivered proof directly from the order detail page.
        </p>
      </section>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-muted/30">
            <RefreshCw className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">No open revisions</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              When you request changes to a delivered proof, those requests will appear here so you can track their status.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild variant="default" shape="pill" size="sm">
              <Link href="/client/orders"><Package className="h-3.5 w-3.5" />View my orders</Link>
            </Button>
            <Button asChild variant="outline" shape="pill" size="sm">
              <Link href="/client/support"><MessageCircle className="h-3.5 w-3.5" />Contact support</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
