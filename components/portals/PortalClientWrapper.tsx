"use client";

import dynamic from "next/dynamic";
import { NotificationProvider } from "@/hooks/NotificationProvider";
import { BadgeProvider } from "@/hooks/BadgeProvider";

const MobileBottomNav = dynamic(
  () => import("./MobileBottomNav").then(m => ({ default: m.MobileBottomNav })),
  { ssr: false }
);

export function PortalClientWrapper({ userId, children, role, userName, userEmail }: {
  userId: string; children: React.ReactNode; role?: string; userName?: string; userEmail?: string;
}) {
  return (
    <NotificationProvider userId={userId}>
      <BadgeProvider userId={userId}>
        {children}
        {role && <MobileBottomNav role={role as any} userName={userName} userEmail={userEmail} />}
      </BadgeProvider>
    </NotificationProvider>
  );
}

// Top-level wrapper that wraps Sidebar + main content so Sidebar gets BadgeProvider context
export function PortalProviders({ userId, children, role, userName, userEmail }: {
  userId: string; children: React.ReactNode; role?: string; userName?: string; userEmail?: string;
}) {
  return (
    <NotificationProvider userId={userId}>
      <BadgeProvider userId={userId}>
        {children}
        {role && <MobileBottomNav role={role as any} userName={userName} userEmail={userEmail} />}
      </BadgeProvider>
    </NotificationProvider>
  );
}
