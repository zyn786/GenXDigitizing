"use client";

import { PortalError } from "@/components/portals/PortalError";

export default function CrmError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PortalError error={error} reset={reset} homeHref="/crm" />;
}
