import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PublicShellBackground } from "@/components/marketing/public-shell-background";
import { PageAnimate } from "@/components/ui/page-animate";

export default function PublicLayout({
  children,
  modal,
}: Readonly<{
  children: ReactNode;
  modal?: ReactNode;
}>) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <PublicShellBackground />

      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteHeader />

        <main className="flex-1">
          <PageAnimate>{children}</PageAnimate>
        </main>

        <SiteFooter />
      </div>

      {modal}
    </div>
  );
}