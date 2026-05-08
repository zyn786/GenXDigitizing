import type { ReactNode } from "react";

export function DashboardMain({ children }: { children: ReactNode }) {
  return <main className="min-w-0">{children}</main>;
}