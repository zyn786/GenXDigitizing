import { Role } from "@prisma/client";

export const adminRoles = new Set<Role>([
  Role.SUPER_ADMIN,
  Role.MANAGER,
  Role.DESIGNER,
  Role.CHAT_SUPPORT,
  Role.MARKETING,
]);

export function isAdminRole(role: Role | undefined | null) {
  return !!role && adminRoles.has(role);
}

export function canAccessAdmin(role: Role | undefined | null) {
  return isAdminRole(role);
}

export function canAccessClient(role: Role | undefined | null) {
  return !!role;
}
