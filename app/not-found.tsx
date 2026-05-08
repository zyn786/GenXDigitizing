import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Home, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-4 overflow-hidden">
      {/* Subtle top glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-1/2 top-0 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-primary/[0.04] blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg text-center">
        {/* 404 large numeral */}
        <div
          className="mb-4 select-none text-[9rem] font-black leading-none tracking-tight"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.10) 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            textShadow: "none",
          }}
          aria-hidden
        >
          404
        </div>

        {/* Glass card */}
        <div className="glass-panel premium-shadow rounded-2xl border-border/80 p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-muted/40">
            <Undo2 className="h-6 w-6 text-muted-foreground" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-muted-foreground">
            The page you&rsquo;re looking for may have moved or doesn&rsquo;t exist.
            Head back home or place an order.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild variant="premium" shape="pill" size="sm">
              <Link href={"/" as Route}>
                <Home className="h-3.5 w-3.5" />
                Go home
              </Link>
            </Button>
            <Button asChild variant="outline" shape="pill" size="sm">
              <Link href={"/contact" as Route}>
                Get a quote
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Bottom trust line */}
        <p className="mt-6 text-xs text-muted-foreground/50">
          GenX Digitizing · Premium Embroidery Studio
        </p>
      </div>
    </main>
  );
}
