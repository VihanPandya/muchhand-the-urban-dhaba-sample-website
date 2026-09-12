import type { AdminRole } from "@prisma/client";

/** Every capability the admin panel gates on. */
export const PERMISSIONS = [
  "dashboard.view",
  "orders.view",
  "orders.update",
  "reservations.view",
  "reservations.update",
  "menu.manage",
  "categories.manage",
  "coupons.manage",
  "gallery.manage",
  "testimonials.manage",
  "customers.view",
  "messages.view",
  "content.manage",
  "settings.manage",
  "integrations.manage",
  "analytics.view",
  "admins.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const STAFF: Permission[] = [
  "dashboard.view",
  "orders.view",
  "orders.update",
  "reservations.view",
  "reservations.update",
];

const MANAGER: Permission[] = [
  ...STAFF,
  "menu.manage",
  "categories.manage",
  "coupons.manage",
  "gallery.manage",
  "testimonials.manage",
  "customers.view",
  "messages.view",
  "analytics.view",
];

export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  STAFF,
  MANAGER,
  SUPER_ADMIN: [...PERMISSIONS],
};

export const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super Admin",
  MANAGER: "Manager",
  STAFF: "Staff",
};

/** Role defaults, unless the admin record carries explicit overrides. */
export function permissionsFor(role: AdminRole, overrides: string[] = []): Permission[] {
  if (overrides.length > 0) {
    return overrides.filter((p): p is Permission => (PERMISSIONS as readonly string[]).includes(p));
  }
  return ROLE_PERMISSIONS[role];
}

export function can(
  actor: { role: AdminRole; permissions?: string[] } | null | undefined,
  permission: Permission,
): boolean {
  if (!actor) return false;
  return permissionsFor(actor.role, actor.permissions ?? []).includes(permission);
}
