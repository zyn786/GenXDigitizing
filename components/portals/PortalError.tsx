"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function PortalError({
  error,
  reset,
  homeHref,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref: string;
}) {
  const router = useRouter();

  return (
    <div className="portal-content flex h-full items-center justify-center">
      <div className="max-w-[420px] p-8 text-center">
        <div className="mb-3 text-[48px]">⚠️</div>
        <h2 className="mb-2 font-syne text-lg font-bold text-[var(--txt)]">Something went wrong</h2>
        <p className="mb-5 text-[13px] leading-relaxed text-[var(--txt2)]">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex justify-center gap-2">
          <Button variant="grad" size="sm" onClick={reset}>
            Try again
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.push(homeHref)}>
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}
