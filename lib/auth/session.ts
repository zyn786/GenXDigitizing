export const SESSION_COOKIE = "genx-session";

/** Cookie values used by the dev session switcher (/api/dev/session). */
export type DemoCookieRole = "client" | "admin";

/** Prisma Role enum values used in the real auth system. */
export type AppRole =
  | "CLIENT"
  | "SUPER_ADMIN"
  | "MANAGER"
  | "DESIGNER"
  | "CHAT_SUPPORT"
  | "MARKETING";

export type DemoRole = DemoCookieRole | AppRole | null | undefined;

export const ADMIN_ROLES: AppRole[] = [
  "SUPER_ADMIN",
  "MANAGER",
  "DESIGNER",
  "CHAT_SUPPORT",
  "MARKETING",
];

export function isAppAdminRole(role: string | null | undefined): boolean {
  return ADMIN_ROLES.includes(role as AppRole);
}

type AccessDecision =
  | { type: "allow" }
  | { type: "redirect"; location: string };

function isClientPath(pathname: string) {
  return pathname.startsWith("/client");
}

function isAdminPath(pathname: string) {
  return pathname.startsWith("/admin");
}

function isInternalRole(role: DemoRole) {
  return (
    role === "admin" ||
    role === "SUPER_ADMIN" ||
    role === "MANAGER" ||
    role === "DESIGNER" ||
    role === "CHAT_SUPPORT" ||
    role === "MARKETING"
  );
}

function isClientRole(role: DemoRole) {
  return role === "client" || role === "CLIENT";
}

export function resolveDashboardPath(role: DemoRole): string {
  if (!role) return "/login";
  if (isInternalRole(role)) return "/admin";
  return "/client/dashboard";
}

export function canEnterPath(pathname: string, role: DemoRole): boolean {
  if (isAdminPath(pathname)) {
    return isInternalRole(role);
  }

  if (isClientPath(pathname)) {
    return isClientRole(role) || isInternalRole(role);
  }

  return true;
}

export function resolveAccessDecision(
  pathname: string,
  role: DemoRole
): AccessDecision {
  const protectedPath = isClientPath(pathname) || isAdminPath(pathname);

  if (protectedPath && !role) {
    return {
      type: "redirect",
      location: `/login?next=${encodeURIComponent(pathname)}`,
    };
  }

  if (!canEnterPath(pathname, role)) {
    return {
      type: "redirect",
      location: `/login?next=${encodeURIComponent(pathname)}`,
    };
  }

  return { type: "allow" };
}