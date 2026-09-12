/**
 * Order pricing. Deliberately shared between the cart UI and the API so a
 * customer never sees a total that the server then disagrees with — the server
 * always recomputes from its own prices before saving an order.
 */

export type PriceableItem = {
  unitPrice: number;
  quantity: number;
  addOnsTotal: number;
};

export type CouponLike = {
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  maxDiscount: number | null;
  minOrderValue: number;
};

export type PricingConfig = {
  taxPercent: number;
  deliveryFee: number;
  freeDeliveryThreshold: number | null;
  minOrderValue: number;
};

export type OrderTotals = {
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  discountAmount: number;
  total: number;
  meetsMinimum: boolean;
  shortfall: number;
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function lineTotal(item: PriceableItem): number {
  return round2((item.unitPrice + item.addOnsTotal) * item.quantity);
}

export function computeDiscount(subtotal: number, coupon: CouponLike | null): number {
  if (!coupon) return 0;
  if (subtotal < coupon.minOrderValue) return 0;
  const raw = coupon.type === "PERCENT" ? (subtotal * coupon.value) / 100 : coupon.value;
  const capped = coupon.maxDiscount !== null ? Math.min(raw, coupon.maxDiscount) : raw;
  return round2(Math.min(capped, subtotal));
}

export function computeTotals(
  items: PriceableItem[],
  config: PricingConfig,
  options: { orderType: "DELIVERY" | "PICKUP"; coupon?: CouponLike | null },
): OrderTotals {
  const subtotal = round2(items.reduce((sum, item) => sum + lineTotal(item), 0));
  const discountAmount = computeDiscount(subtotal, options.coupon ?? null);
  const discounted = round2(Math.max(subtotal - discountAmount, 0));

  let deliveryFee = 0;
  if (options.orderType === "DELIVERY" && subtotal > 0) {
    const free =
      config.freeDeliveryThreshold !== null && discounted >= config.freeDeliveryThreshold;
    deliveryFee = free ? 0 : round2(config.deliveryFee);
  }

  const taxAmount = round2((discounted * config.taxPercent) / 100);
  const total = round2(discounted + taxAmount + deliveryFee);
  const meetsMinimum = subtotal >= config.minOrderValue;

  return {
    subtotal,
    taxAmount,
    deliveryFee,
    discountAmount,
    total,
    meetsMinimum,
    shortfall: meetsMinimum ? 0 : round2(config.minOrderValue - subtotal),
  };
}
