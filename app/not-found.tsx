import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, FileQuestion, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.06),transparent_50%)]" />
      <Card className="relative w-full max-w-md text-center">
        <CardContent className="flex flex-col items-center gap-4 p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-muted/60">
            <FileQuestion className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Page not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The page you are looking for may have moved or does not exist.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild variant="default" shape="pill" size="sm">
              <Link href={"/" as Route}>
                <Home className="h-4 w-4" />
                Go home
              </Link>
            </Button>
            <Button asChild variant="outline" shape="pill" size="sm">
              <Link href={"/order" as Route}>
                Place order
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
