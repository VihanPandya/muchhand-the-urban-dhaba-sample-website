"use client";

import { formatMoney } from "@/lib/money";
import { computeTotals, type CouponLike } from "@/lib/pricing";
import type { CartLine } from "@/components/providers/cart";
import { useSite } from "@/components/providers/site";

export type AppliedCoupon = CouponLike & { title: string };

export function useOrderTotals(lines: CartLine[], orderType: "DELIVERY" | "PICKUP", coupon: AppliedCoupon | null) {
  const { settings } = useSite();
  return computeTotals(
    lines.map((line) => ({
      unitPrice: line.unitPrice,
      quantity: line.quantity,
      addOnsTotal: line.addOns.reduce((sum, a) => sum + a.price, 0),
    })),
    {
      taxPercent: settings.taxPercent,
      deliveryFee: settings.deliveryFee,
      freeDeliveryThreshold: settings.freeDeliveryThreshold,
      minOrderValue: settings.minOrderValue,
    },
    { orderType, coupon },
  );
}

export function OrderSummary({
  lines,
  orderType,
  coupon,
  children,
}: {
  lines: CartLine[];
  orderType: "DELIVERY" | "PICKUP";
  coupon: AppliedCoupon | null;
  children?: React.ReactNode;
}) {
  const { settings } = useSite();
  const totals = useOrderTotals(lines, orderType, coupon);
  const freeDeliveryGap =
    orderType === "DELIVERY" && settings.freeDeliveryThreshold !== null && totals.deliveryFee > 0
      ? settings.freeDeliveryThreshold - (totals.subtotal - totals.discountAmount)
      : 0;

  return (
    <div className="card p-5 md:p-6">
      <h2 className="mb-4 font-display text-lg font-semibold">Bill summary</h2>
      <dl className="space-y-2.5 text-sm">
        <Row label={`Item total (${lines.reduce((n, l) => n + l.quantity, 0)} items)`} value={formatMoney(totals.subtotal)} />
        {totals.discountAmount > 0 ? (
          <Row
            label={`Discount${coupon ? ` · ${coupon.code}` : ""}`}
            value={`− ${formatMoney(totals.discountAmount)}`}
            tone="mint"
          />
        ) : null}
        <Row label={`Taxes (${settings.taxPercent}%)`} value={formatMoney(totals.taxAmount)} />
        {orderType === "DELIVERY" ? (
          <Row
            label="Delivery fee"
            value={totals.deliveryFee === 0 ? "FREE" : formatMoney(totals.deliveryFee)}
            tone={totals.deliveryFee === 0 ? "mint" : undefined}
          />
        ) : (
          <Row label="Pickup" value="No delivery fee" tone="mint" />
        )}
      </dl>

      {freeDeliveryGap > 0 ? (
        <p className="mt-3 rounded-xl bg-saffron-50 px-3.5 py-2.5 text-xs font-medium text-saffron-700">
          Add {formatMoney(Math.ceil(freeDeliveryGap))} more for free delivery.
        </p>
      ) : null}

      <div className="mt-4 flex items-baseline justify-between border-t border-ink-100 pt-4">
        <span className="font-display text-base font-semibold">To pay</span>
        <span className="font-display text-2xl font-semibold text-ink-900">{formatMoney(totals.total)}</span>
      </div>

      {!totals.meetsMinimum && totals.subtotal > 0 ? (
        <p className="mt-3 rounded-xl bg-tandoor-500/10 px-3.5 py-2.5 text-xs font-medium text-tandoor-700">
          Minimum order is {formatMoney(settings.minOrderValue)} — add {formatMoney(Math.ceil(totals.shortfall))} more to
          check out.
        </p>
      ) : null}

      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "mint" }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-ink-500">{label}</dt>
      <dd className={`font-semibold ${tone === "mint" ? "text-mint-600" : "text-ink-800"}`}>{value}</dd>
    </div>
  );
}
