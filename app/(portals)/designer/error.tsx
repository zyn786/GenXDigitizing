"use client";

import { PortalError } from "@/components/portals/PortalError";

export default function DesignerError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PortalError error={error} reset={reset} homeHref="/designer" />;
}
