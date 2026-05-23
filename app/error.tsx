"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error:  Error & { digest?: string };
  reset:  () => void;
}) {
  useEffect(() => {
    console.error("[Global Error]", error);
  }, [error]);

  return (
    <html>
      <body className="bg-[var(--bg)] text-[var(--txt)]">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div
            className="fixed top-0 inset-x-0 h-[2px]"
            style={{ background: "linear-gradient(90deg,#F97316,#2563EB)" }}
          />
          <div className="text-center max-w-sm">
            <div className="text-5xl mb-5">⚡</div>
            <h1 className="font-syne font-bold text-xl mb-2 text-[var(--txt)]">
              Something went wrong
            </h1>
            <p className="text-sm text-[var(--txt3)] mb-6 leading-relaxed">
              An unexpected error occurred. We&apos;ve been notified and are looking into it.
            </p>
            {process.env.NODE_ENV === "development" && (
              <details className="mb-5 text-left">
                <summary className="text-xs text-[var(--txt3)] cursor-pointer hover:text-[var(--txt2)]">
                  Error details
                </summary>
                <pre className="mt-2 p-3 rounded-lg bg-[var(--elevated)] border border-[var(--border2)] text-[11px] text-[#DC2626] overflow-auto">
                  {error.message}
                  {error.digest && `\n\nDigest: ${error.digest}`}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                leftIcon={<RefreshCw size={13} />}
              >
                Try again
              </Button>
              <Button
                variant="grad"
                size="sm"
                onClick={() => { window.location.href = "/"; }}
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
