"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { Route } from "next";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
        <main className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md rounded-[2rem] border border-border/60 bg-card/80 p-8 text-center shadow-2xl">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10">
              <AlertTriangle className="h-7 w-7 text-amber-500" />
            </div>
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              A critical error occurred. Please try again or return home.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
              <Link
                href={"/" as Route}
                className="inline-flex items-center gap-2 rounded-full border border-border/60 px-5 py-2.5 text-sm font-medium transition hover:bg-muted/30"
              >
                <Home className="h-4 w-4" />
                Go home
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
