"use client";

import { ResourceManager } from "@/components/admin/resource-manager";
import { StatusBadge } from "@/components/admin/ui";
import { ROLE_LABELS } from "@/lib/permissions";

type AdminRow = {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "MANAGER" | "STAFF";
  permissions: string[];
  active: boolean;
  lastLoginAt: string | null;
};

export function AdminsManager() {
  return (
    <ResourceManager<AdminRow>
      resource="admins"
      title="Team & roles"
      singularLabel="Team member"
      description="Who can sign in to this panel, and what each role is allowed to do."
      emptyMessage="No admin accounts."
      defaults={{ name: "", email: "", password: "", role: "STAFF", permissions: [], active: true }}
      columns={[
        {
          key: "name",
          label: "Name",
          render: (row) => (
            <span>
              <span className="block font-medium text-ink-900">{row.name}</span>
              <span className="block text-[11px] text-ink-400">{row.email}</span>
            </span>
          ),
        },
        { key: "role", label: "Role", render: (row) => ROLE_LABELS[row.role] },
        {
          key: "permissions",
          label: "Permissions",
          render: (row) =>
            row.permissions.length ? (
              <span className="text-xs text-ink-500">{row.permissions.length} custom</span>
            ) : (
              <span className="text-xs text-ink-400">Role defaults</span>
            ),
        },
        {
          key: "lastLogin",
          label: "Last sign-in",
          render: (row) => (row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString("en-IN") : "Never"),
        },
        { key: "active", label: "Status", render: (row) => <StatusBadge status={row.active ? "COMPLETED" : "ARCHIVED"} /> },
      ]}
      fields={[
        { name: "name", label: "Full name", type: "text", required: true, half: true },
        { name: "email", label: "Email", type: "email", required: true, half: true },
        {
          name: "password",
          label: "Password",
          type: "password",
          half: true,
          hint: "leave blank when editing to keep the current one",
        },
        {
          name: "role",
          label: "Role",
          type: "select",
          half: true,
          options: [
            { value: "SUPER_ADMIN", label: "Super Admin — full access" },
            { value: "MANAGER", label: "Manager — orders, menu, reservations, customers" },
            { value: "STAFF", label: "Staff — orders and reservations" },
          ],
        },
        {
          name: "permissions",
          label: "Permission overrides",
          type: "tags",
          hint: "comma separated, e.g. orders.view, menu.manage — leave blank to use role defaults",
          placeholder: "orders.view, orders.update",
        },
        { name: "active", label: "Account is active", type: "switch" },
      ]}
      toForm={(row) => ({
        name: row.name,
        email: row.email,
        password: "",
        role: row.role,
        permissions: row.permissions,
        active: row.active,
      })}
      toPayload={(form) => {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        return payload;
      }}
    />
  );
}
