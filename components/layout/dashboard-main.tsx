import type { ReactNode } from "react";
import { PageAnimate } from "@/components/ui/page-animate";

export function DashboardMain({ children }: { children: ReactNode }) {
  return (
    <main className="min-w-0">
      <PageAnimate>{children}</PageAnimate>
    </main>
  );
}