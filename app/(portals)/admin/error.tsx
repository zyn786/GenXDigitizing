"use client";

import { PortalError } from "@/components/portals/PortalError";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PortalError error={error} reset={reset} homeHref="/admin" />;
}
