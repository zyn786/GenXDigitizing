import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PublicShellBackground } from "@/components/marketing/public-shell-background";
import { PageTransition } from "@/components/ui/page-transition";
import { NeedleCursor } from "@/components/ui/needle-cursor";

export default function PublicLayout({
  children,
  modal,
}: Readonly<{
  children: ReactNode;
  modal?: ReactNode;
}>) {
  return (
    // Whole shell fades in (opacity only — translate on an ancestor breaks sticky header)
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground [animation:shell-fade_0.4s_ease_both]">
      <NeedleCursor />
      <PublicShellBackground />
      <PageTransition />

      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteHeader />

        {/* Content rises up after the shell fades in */}
        <main className="flex-1 [animation:page-enter_0.6s_cubic-bezier(0.16,1,0.3,1)_0.15s_both]">
          {children}
        </main>

        {/* Footer drifts in last */}
        <div className="[animation:shell-fade_0.5s_ease_0.35s_both]">
          <SiteFooter />
        </div>
      </div>

      {modal}
    </div>
  );
}
