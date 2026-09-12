"use client";

import { ResourceManager } from "@/components/admin/resource-manager";
import { StatusBadge } from "@/components/admin/ui";
import { formatMoney } from "@/lib/money";

type CouponRow = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  type: "PERCENT" | "FIXED";
  value: number;
  maxDiscount: number | null;
  minOrderValue: number;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  usedCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  active: boolean;
  showOnSite: boolean;
  badge: string | null;
  displayOrder: number;
};

const toDateInput = (value: string | null) => (value ? value.slice(0, 10) : "");

export function CouponsManager() {
  return (
    <ResourceManager<CouponRow>
      resource="coupons"
      title="Offers & coupons"
      singularLabel="Coupon"
      description="Discount codes customers can apply at checkout. Offers marked visible also appear on the Offers page."
      emptyMessage="No coupons yet. Create one to start running offers."
      wideForm
      defaults={{
        code: "",
        title: "",
        description: "",
        type: "PERCENT",
        value: 10,
        maxDiscount: null,
        minOrderValue: 0,
        usageLimit: null,
        perCustomerLimit: null,
        startsAt: "",
        expiresAt: "",
        active: true,
        showOnSite: true,
        badge: "",
        displayOrder: 0,
      }}
      columns={[
        {
          key: "code",
          label: "Code",
          render: (row) => (
            <span>
              <span className="block font-mono text-sm font-bold text-saffron-700">{row.code}</span>
              <span className="block text-[11px] text-ink-400">{row.title}</span>
            </span>
          ),
        },
        {
          key: "discount",
          label: "Discount",
          render: (row) => (
            <span>
              <span className="block font-medium">
                {row.type === "PERCENT" ? `${row.value}%` : formatMoney(row.value)}
              </span>
              {row.maxDiscount ? <span className="block text-[11px] text-ink-400">max {formatMoney(row.maxDiscount)}</span> : null}
            </span>
          ),
        },
        { key: "min", label: "Min order", render: (row) => formatMoney(row.minOrderValue) },
        {
          key: "usage",
          label: "Used",
          render: (row) => `${row.usedCount}${row.usageLimit ? ` / ${row.usageLimit}` : ""}`,
        },
        {
          key: "expiry",
          label: "Expires",
          render: (row) => (row.expiresAt ? new Date(row.expiresAt).toLocaleDateString("en-IN") : "No expiry"),
        },
        { key: "active", label: "Status", render: (row) => <StatusBadge status={row.active ? "COMPLETED" : "ARCHIVED"} /> },
      ]}
      fields={[
        { name: "code", label: "Coupon code", type: "text", required: true, half: true, hint: "UPPERCASE, no spaces", placeholder: "FIRST10" },
        { name: "title", label: "Title", type: "text", required: true, half: true, placeholder: "10% OFF" },
        { name: "description", label: "Description", type: "textarea", hint: "Shown on the offers page" },
        {
          name: "type",
          label: "Discount type",
          type: "select",
          half: true,
          options: [
            { value: "PERCENT", label: "Percentage off" },
            { value: "FIXED", label: "Fixed amount off" },
          ],
        },
        { name: "value", label: "Discount value", type: "number", required: true, half: true, min: 0, step: 0.01 },
        { name: "maxDiscount", label: "Maximum discount (₹)", type: "number", half: true, min: 0, hint: "percentage coupons only" },
        { name: "minOrderValue", label: "Minimum order (₹)", type: "number", half: true, min: 0 },
        { name: "usageLimit", label: "Total usage limit", type: "number", half: true, min: 0, hint: "leave blank for unlimited" },
        { name: "perCustomerLimit", label: "Per-customer limit", type: "number", half: true, min: 0, hint: "leave blank for unlimited" },
        { name: "startsAt", label: "Starts on", type: "date", half: true },
        { name: "expiresAt", label: "Expires on", type: "date", half: true },
        { name: "badge", label: "Badge text", type: "text", half: true, placeholder: "First order" },
        { name: "displayOrder", label: "Display order", type: "number", half: true, min: 0 },
        { name: "active", label: "Coupon is active", type: "switch", half: true },
        { name: "showOnSite", label: "Show on the offers page", type: "switch", half: true },
      ]}
      toForm={(row) => ({
        code: row.code,
        title: row.title,
        description: row.description ?? "",
        type: row.type,
        value: row.value,
        maxDiscount: row.maxDiscount,
        minOrderValue: row.minOrderValue,
        usageLimit: row.usageLimit,
        perCustomerLimit: row.perCustomerLimit,
        startsAt: toDateInput(row.startsAt),
        expiresAt: toDateInput(row.expiresAt),
        active: row.active,
        showOnSite: row.showOnSite,
        badge: row.badge ?? "",
        displayOrder: row.displayOrder,
      })}
      toPayload={(form) => ({
        ...form,
        code: String(form.code ?? "").toUpperCase(),
        startsAt: form.startsAt ? `${form.startsAt}T00:00:00.000Z` : null,
        expiresAt: form.expiresAt ? `${form.expiresAt}T23:59:59.000Z` : null,
      })}
    />
  );
}
