"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error]", error);
  }, [error]);

  return (
    <html>
      <body className="bg-[var(--bg)] text-[var(--txt)]">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div
            className="fixed inset-x-0 top-0 h-[2px]"
            style={{ background: "linear-gradient(90deg,#F97316,#2563EB)" }}
          />
          <div className="max-w-sm text-center">
            <div className="mb-5 text-5xl">⚡</div>
            <h1 className="mb-2 font-syne text-xl font-bold text-[var(--txt)]">
              Something went wrong
            </h1>
            <p className="mb-6 text-sm leading-relaxed text-[var(--txt3)]">
              An unexpected error occurred. We&apos;ve been notified and are looking into it.
            </p>
            {process.env.NODE_ENV === "development" && (
              <details className="mb-5 text-left">
                <summary className="cursor-pointer text-xs text-[var(--txt3)] hover:text-[var(--txt2)]">
                  Error details
                </summary>
                <pre className="mt-2 overflow-auto rounded-lg border border-[var(--border2)] bg-[var(--elevated)] p-3 text-[11px] text-[#DC2626]">
                  {error.message}
                  {error.digest && `\n\nDigest: ${error.digest}`}
                </pre>
              </details>
            )}
            <div className="flex justify-center gap-3">
              <Button variant="ghost" size="sm" onClick={reset} leftIcon={<RefreshCw size={13} />}>
                Try again
              </Button>
              <Button
                variant="grad"
                size="sm"
                onClick={() => {
                  window.location.href = "/";
                }}
                leftIcon={<Home size={13} />}
              >
                Go home
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
