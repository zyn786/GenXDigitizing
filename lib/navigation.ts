/**
 * Centralized navigation config — single source of truth.
 *
 * Used by: Sidebar.tsx, Topbar.tsx (MobileSidebarDrawer), MobileBottomNav.tsx
 * NEVER define nav items inline in components. Use this config.
 */

import type { UserRole } from "@/types";

export interface NavItem {
  label: string;
  href: string;
  iconName: string;   // lucide-react icon name
  badgeKey?: string;   // maps to BadgeProvider counts
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface MobileTab {
  href?: string;
  label: string;
  iconName: string;
  badgeKey?: string;
  highlight?: boolean;
}

// ═══════════════════════════════════════════════════════════════
//  SIDEBAR / DRAWER NAVIGATION
// ═══════════════════════════════════════════════════════════════

export const NAV_SECTIONS: Record<UserRole, NavSection[]> = {
  admin: [
    { title: "Overview", items: [
      { label: "Dashboard", href: "/admin", iconName: "LayoutDashboard" },
      { label: "Reports", href: "/admin/reports", iconName: "BarChart3" },
    ]},
    { title: "Operations", items: [
      { label: "Orders", href: "/admin/orders", iconName: "FileText", badgeKey: "orders" },
      { label: "Clients", href: "/admin/clients", iconName: "Users" },
      { label: "Designers", href: "/admin/designers", iconName: "UserCircle" },
      { label: "Invoices", href: "/admin/invoices", iconName: "Receipt", badgeKey: "invoices" },
    ]},
    { title: "Content", items: [
      { label: "Portfolio", href: "/admin/portfolio", iconName: "ImageIcon" },
      { label: "Free Designs", href: "/admin/free-designs", iconName: "Download" },
      { label: "Pricing", href: "/admin/pricing", iconName: "Tag" },
    ]},
    { title: "Engagement", items: [
      { label: "Support Inbox", href: "/admin/messages", iconName: "MessageSquare", badgeKey: "messages" },
      { label: "Reviews", href: "/admin/reviews", iconName: "Star" },
      { label: "Leads", href: "/admin/leads", iconName: "TrendingUp" },
      { label: "Notifications", href: "/admin/notifications", iconName: "Bell", badgeKey: "notifications" },
    ]},
    { title: "System", items: [
      { label: "Settings", href: "/admin/settings", iconName: "Settings" },
    ]},
  ],
  crm: [
    { title: "Workspace", items: [
      { label: "Pipeline", href: "/crm/leads", iconName: "TrendingUp" },
      { label: "Contacts", href: "/crm/contacts", iconName: "Users" },
      { label: "Messages", href: "/crm/messages", iconName: "MessageSquare" },
    ]},
    { title: "Monitor", items: [
      { label: "Reviews", href: "/crm/reviews", iconName: "Star" },
      { label: "Notifications", href: "/crm/notifications", iconName: "Bell" },
    ]},
    { title: "System", items: [
      { label: "Settings", href: "/crm/settings", iconName: "Settings" },
    ]},
  ],
  client: [
    { title: "Orders", items: [
      { label: "Dashboard", href: "/client", iconName: "LayoutDashboard" },
      { label: "New Order", href: "/client/new-order", iconName: "PlusCircle" },
      { label: "My Orders", href: "/client/my-orders", iconName: "FileText" },
    ]},
    { title: "Account", items: [
      { label: "Invoices", href: "/client/invoices", iconName: "Receipt" },
      { label: "My Reviews", href: "/client/my-reviews", iconName: "Star" },
      { label: "Messages", href: "/client/messages", iconName: "MessageSquare" },
      { label: "Notifications", href: "/client/notifications", iconName: "Bell" },
    ]},
  ],
  designer: [
    { title: "Work", items: [
      { label: "My Tasks", href: "/designer/tasks", iconName: "ClipboardList" },
      { label: "Completed", href: "/designer/completed", iconName: "CheckCircle2" },
    ]},
    { title: "Account", items: [
      { label: "Messages", href: "/designer/messages", iconName: "MessageSquare" },
      { label: "Notifications", href: "/designer/notifications", iconName: "Bell" },
      { label: "Settings", href: "/designer/settings", iconName: "Settings" },
    ]},
  ],
};

// ═══════════════════════════════════════════════════════════════
//  MOBILE BOTTOM NAV TABS
// ═══════════════════════════════════════════════════════════════

export const MOBILE_TABS: Record<UserRole, MobileTab[]> = {
  admin: [
    { href: "/admin", label: "Home", iconName: "Home" },
    { href: "/admin/orders", label: "Orders", iconName: "ShoppingCart", badgeKey: "orders" },
    { href: "/admin/leads", label: "Leads", iconName: "TrendingUp" },
    { href: "/admin/messages", label: "Messages", iconName: "MessageSquare", badgeKey: "messages" },
    { label: "Menu", iconName: "Menu" },
  ],
  client: [
    { href: "/client", label: "Home", iconName: "Home" },
    { href: "/client/my-orders", label: "My Orders", iconName: "ClipboardList" },
    { href: "/client/new-order", label: "New Order", iconName: "PlusCircle", highlight: true },
    { href: "/client/messages", label: "Messages", iconName: "MessageSquare" },
    { label: "Menu", iconName: "Menu" },
  ],
  crm: [
    { href: "/crm", label: "Home", iconName: "Home" },
    { href: "/crm/leads", label: "Leads", iconName: "TrendingUp" },
    { href: "/crm/contacts", label: "Contacts", iconName: "Users" },
    { href: "/crm/messages", label: "Chat", iconName: "MessageSquare", badgeKey: "messages" },
    { href: "/crm/reviews", label: "Reviews", iconName: "Star" },
  ],
  designer: [
    { href: "/designer/tasks", label: "My Tasks", iconName: "ClipboardList", badgeKey: "orders" },
    { href: "/designer/completed", label: "Completed", iconName: "CheckCircle2" },
    { href: "/designer/messages", label: "Messages", iconName: "MessageSquare", badgeKey: "messages" },
    { label: "Menu", iconName: "Menu" },
  ],
};

// ═══════════════════════════════════════════════════════════════
//  PORTAL BRANDING
// ═══════════════════════════════════════════════════════════════

export const PORTAL_COLORS: Record<UserRole, { color: string; light: string; text: string }> = {
  admin:    { color: "#3B82F6", light: "rgba(59,130,246,0.10)", text: "#1D4ED8" },
  crm:      { color: "#6366F1", light: "rgba(99,102,241,0.10)", text: "#4338CA" },
  client:   { color: "#0EA5E9", light: "rgba(14,165,233,0.10)", text: "#0369A1" },
  designer: { color: "#10B981", light: "rgba(16,185,129,0.10)", text: "#047857" },
};

export const PORTAL_LABELS: Record<UserRole, string> = {
  admin: "Admin", crm: "CRM", client: "Client", designer: "Designer",
};

// ═══════════════════════════════════════════════════════════════
//  ACTIVE ROUTE HELPER
// ═══════════════════════════════════════════════════════════════

export function isActiveRoute(pathname: string, href: string, role: string): boolean {
  if (href === `/${role}`) return pathname === href;
  return pathname.startsWith(href);
}
