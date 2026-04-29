"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function DashboardMain({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // key=pathname forces a remount on every route change,
  // which replays the CSS animation on each page navigation.
  return (
    <main
      key={pathname}
      className="min-w-0 [animation:page-enter_0.5s_cubic-bezier(0.16,1,0.3,1)_both]"
    >
      {children}
    </main>
  );
}
