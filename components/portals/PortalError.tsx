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
    <div className="portal-content flex items-center justify-center h-full">
      <div className="text-center max-w-[420px] p-8">
        <div className="text-[48px] mb-3">⚠️</div>
        <h2 className="font-syne font-bold text-lg text-[var(--txt)] mb-2">
          Something went wrong
        </h2>
        <p className="text-[13px] text-[var(--txt2)] mb-5 leading-relaxed">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex gap-2 justify-center">
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
