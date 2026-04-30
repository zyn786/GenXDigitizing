import type { Route } from "next";

export const siteConfig = {
  name: "GenX Digitizing",
  shortName: "GenX",
  description:
    "Premium embroidery digitizing, vector art, custom patches, workflow, billing, and support-ready client platform.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  nav: [
    { href: "/" as Route, label: "Home" },
    { href: "/services" as Route, label: "Services" },
    { href: "/pricing" as Route, label: "Pricing" },
    { href: "/portfolio" as Route, label: "Portfolio" },
    { href: "/contact" as Route, label: "Contact" },
  ],
  protectedNav: {
    client: [
      { href: "/client/dashboard" as Route, label: "Dashboard" },
      { href: "/client/orders" as Route, label: "My Orders" },
      { href: "/client/quotes" as Route, label: "Quote Requests" },
      { href: "/client/files" as Route, label: "Files" },
      { href: "/client/invoices" as Route, label: "Invoices" },
      { href: "/client/support" as Route, label: "Chat & Support" },
      { href: "/client/profile" as Route, label: "My Profile" },
    ],
  },
} as const;

export type StaffRole =
  | "SUPER_ADMIN"
  | "MANAGER"
  | "DESIGNER"
  | "CHAT_SUPPORT"
  | "MARKETING";

export function getAdminNav(role?: string | null) {
  const r = role as StaffRole | null | undefined;

  if (r === "DESIGNER") {
    return [
      { href: "/admin/designer" as Route, label: "Dashboard" },
      { href: "/admin/designer/earnings" as Route, label: "My Earnings" },
      { href: "/admin/notifications" as Route, label: "Notifications" },
    ];
  }

  if (r === "CHAT_SUPPORT") {
    return [
      { href: "/admin/support" as Route, label: "Support Inbox" },
      { href: "/admin/notifications" as Route, label: "Notifications" },
    ];
  }

  if (r === "MARKETING") {
    return [
      { href: "/admin/marketing" as Route, label: "Marketing Hub" },
      { href: "/admin/notifications" as Route, label: "Notifications" },
    ];
  }

  // MANAGER + SUPER_ADMIN
  const base = [
    { href: "/admin/dashboard" as Route, label: "Dashboard" },
    { href: "/admin/orders" as Route, label: "Order Queue" },
    { href: "/admin/quotes" as Route, label: "Quote Requests" },
    { href: "/admin/invoices" as Route, label: "Invoices" },
    { href: "/admin/payment-proofs" as Route, label: "Payment Proofs" },
    { href: "/admin/support" as Route, label: "Support Inbox" },
    { href: "/admin/staff" as Route, label: "Staff & Commissions" },
    { href: "/admin/portfolio" as Route, label: "Portfolio" },
    { href: "/admin/pricing" as Route, label: "Pricing" },
    { href: "/admin/pricing-config" as Route, label: "Pricing Config" },
    { href: "/admin/leads" as Route, label: "Lead Sources" },
    { href: "/admin/payment-accounts" as Route, label: "Payment Methods" },
    { href: "/admin/reports" as Route, label: "Reports" },
    { href: "/admin/coupons" as Route, label: "Coupons" },
    { href: "/admin/notifications" as Route, label: "Notifications" },
    { href: "/admin/activity" as Route, label: "Activity Log" },
    { href: "/admin/audit" as Route, label: "Audit Access" },
  ];

  if (r === "SUPER_ADMIN") {
    return [
      ...base,
      { href: "/admin/settings" as Route, label: "Settings" },
    ];
  }

  return base;
}

export function buildTitle(page: string) {
  return page;
}
