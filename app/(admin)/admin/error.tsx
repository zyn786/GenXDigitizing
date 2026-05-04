"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { Route } from "next";
import { AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Admin workspace error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.06),transparent_50%)]" />
      <Card className="relative w-full max-w-md text-center">
        <CardContent className="flex flex-col items-center gap-4 p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10">
            <AlertTriangle className="h-7 w-7 text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We couldn&apos;t load this admin workspace. Please try again.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="default" shape="pill" size="sm" onClick={reset}>
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
            <Button asChild variant="outline" shape="pill" size="sm">
              <Link href={"/admin/dashboard" as Route}>Admin dashboard</Link>
            </Button>
            <Button asChild variant="premium" shape="pill" size="sm">
              <Link href={"/admin/orders" as Route}>
                Orders
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
