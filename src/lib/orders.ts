import "server-only";
import type { Coupon, OrderSource, OrderType, PaymentMethod, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/money";
import { computeTotals, type CouponLike } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";
import { AppError } from "@/lib/errors";
import type { z } from "zod";
import type { createOrderSchema } from "@/lib/validation";

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

/** Kept as a named subclass so order routes can catch ordering problems alone. */
export class OrderError extends AppError {}

export function generateOrderNumber(now = new Date()): string {
  const stamp = now.toISOString().slice(2, 10).replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `MUD-${stamp}-${random}`;
}

export function generateReservationReference(now = new Date()): string {
  const stamp = now.toISOString().slice(2, 10).replace(/-/g, "");
  const random = Math.floor(100 + Math.random() * 900);
  return `RSV-${stamp}-${random}`;
}

export function couponToLike(coupon: Coupon): CouponLike {
  return {
    code: coupon.code,
    type: coupon.type,
    value: toNumber(coupon.value),
    maxDiscount: coupon.maxDiscount === null ? null : toNumber(coupon.maxDiscount),
    minOrderValue: toNumber(coupon.minOrderValue),
  };
}

export type CouponCheck =
  | { valid: true; coupon: Coupon; discount: number; message: string }
  | { valid: false; reason: string };

export async function validateCoupon(
  code: string,
  subtotal: number,
  phone?: string,
): Promise<CouponCheck> {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!coupon || !coupon.active) return { valid: false, reason: "That coupon code isn't valid." };

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return { valid: false, reason: "This offer hasn't started yet." };
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    return { valid: false, reason: "This offer has expired." };
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, reason: "This offer has been fully claimed." };
  }
  const minOrder = toNumber(coupon.minOrderValue);
  if (subtotal < minOrder) {
    return { valid: false, reason: `Add ₹${Math.ceil(minOrder - subtotal)} more to use this offer.` };
  }
  if (phone && coupon.perCustomerLimit) {
    const used = await prisma.couponUsage.count({ where: { couponId: coupon.id, customerPhone: phone } });
    if (used >= coupon.perCustomerLimit) {
      return { valid: false, reason: "You've already used this offer." };
    }
  }

  const { computeDiscount } = await import("@/lib/pricing");
  const discount = computeDiscount(subtotal, couponToLike(coupon));
  if (discount <= 0) return { valid: false, reason: "This offer doesn't apply to your cart." };

  return {
    valid: true,
    coupon,
    discount,
    message: `${coupon.title} applied — you saved ₹${Math.round(discount)}.`,
  };
}

type ResolvedItem = {
  dishId: string;
  dishName: string;
  variantName: string | null;
  addOns: { name: string; price: number }[];
  notes: string | null;
  unitPrice: number;
  addOnsTotal: number;
  quantity: number;
  lineTotal: number;
};

/**
 * Rebuilds the cart from database prices. The client's numbers are never
 * trusted — only dish, variant and add-on identifiers are taken from it.
 */
export async function resolveCartItems(items: CreateOrderInput["items"]): Promise<ResolvedItem[]> {
  const dishIds = [...new Set(items.map((i) => i.dishId))];
  const dishes = await prisma.dish.findMany({
    where: { id: { in: dishIds } },
    include: { variants: true, addOns: true },
  });
  const globalAddOns = await prisma.addOn.findMany({ where: { dishId: null, active: true } });
  const dishMap = new Map(dishes.map((d) => [d.id, d]));

  const resolved: ResolvedItem[] = [];
  for (const item of items) {
    const dish = dishMap.get(item.dishId);
    if (!dish) throw new OrderError("One of the dishes in your cart is no longer on the menu.");
    if (!dish.available) throw new OrderError(`${dish.name} is currently unavailable.`);

    let unitPrice = toNumber(dish.discountPrice ?? dish.price);
    let variantName: string | null = null;
    if (item.variantId) {
      const variant = dish.variants.find((v) => v.id === item.variantId);
      if (!variant) throw new OrderError(`That option for ${dish.name} is no longer available.`);
      unitPrice = toNumber(variant.price);
      variantName = variant.name;
    }

    const available = [...dish.addOns, ...globalAddOns];
    const addOns = item.addOnIds
      .map((id) => available.find((a) => a.id === id && a.active))
      .filter((a): a is NonNullable<typeof a> => Boolean(a))
      .map((a) => ({ name: a.name, price: toNumber(a.price) }));
    const addOnsTotal = addOns.reduce((sum, a) => sum + a.price, 0);

    resolved.push({
      dishId: dish.id,
      dishName: dish.name,
      variantName,
      addOns,
      notes: item.notes ?? null,
      unitPrice,
      addOnsTotal,
      quantity: item.quantity,
      lineTotal: Math.round((unitPrice + addOnsTotal) * item.quantity * 100) / 100,
    });
  }
  return resolved;
}

export async function createOrder(input: CreateOrderInput, source: OrderSource = "WEB") {
  const settings = await getSettings();

  if (!settings.directOrderingEnabled) {
    throw new OrderError("Online ordering is currently switched off. Please call us or order on Zomato/Swiggy.", 409);
  }
  if (input.type === "DELIVERY" && !settings.deliveryEnabled) {
    throw new OrderError("Delivery is unavailable right now. Please choose pickup.", 409);
  }
  if (input.type === "PICKUP" && !settings.pickupEnabled) {
    throw new OrderError("Pickup is unavailable right now. Please choose delivery.", 409);
  }
  const methodEnabled: Record<PaymentMethod, boolean> = {
    COD: settings.codEnabled,
    UPI: settings.upiEnabled,
    ONLINE: settings.onlinePaymentEnabled,
  };
  if (!methodEnabled[input.paymentMethod]) {
    throw new OrderError("That payment method isn't available right now.", 409);
  }

  const resolved = await resolveCartItems(input.items);

  const subtotal = resolved.reduce((sum, item) => sum + item.lineTotal, 0);
  let coupon: Coupon | null = null;
  if (input.couponCode) {
    const check = await validateCoupon(input.couponCode, subtotal, input.phone);
    if (!check.valid) throw new OrderError(check.reason, 422);
    coupon = check.coupon;
  }

  const totals = computeTotals(
    resolved.map((r) => ({ unitPrice: r.unitPrice, quantity: r.quantity, addOnsTotal: r.addOnsTotal })),
    {
      taxPercent: toNumber(settings.taxPercent),
      deliveryFee: toNumber(settings.deliveryFee),
      freeDeliveryThreshold:
        settings.freeDeliveryThreshold === null ? null : toNumber(settings.freeDeliveryThreshold),
      minOrderValue: toNumber(settings.minOrderValue),
    },
    { orderType: input.type as OrderType, coupon: coupon ? couponToLike(coupon) : null },
  );

  if (!totals.meetsMinimum) {
    throw new OrderError(
      `The minimum order value is ₹${Math.round(toNumber(settings.minOrderValue))}. Please add ₹${Math.ceil(totals.shortfall)} more.`,
      422,
    );
  }

  const order = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.upsert({
      where: { phone: input.phone },
      create: {
        name: input.customerName,
        phone: input.phone,
        email: input.email,
        addressLine: input.addressLine,
        landmark: input.landmark,
        pincode: input.pincode || null,
        ordersCount: 1,
        totalSpend: totals.total,
        lastOrderAt: new Date(),
      },
      update: {
        name: input.customerName,
        email: input.email,
        addressLine: input.addressLine ?? undefined,
        landmark: input.landmark ?? undefined,
        pincode: input.pincode || undefined,
        ordersCount: { increment: 1 },
        totalSpend: { increment: totals.total },
        lastOrderAt: new Date(),
      },
    });

    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerId: customer.id,
        customerName: input.customerName,
        phone: input.phone,
        email: input.email,
        type: input.type as OrderType,
        addressLine: input.type === "DELIVERY" ? input.addressLine : null,
        landmark: input.type === "DELIVERY" ? input.landmark : null,
        pincode: input.type === "DELIVERY" ? input.pincode || null : null,
        notes: input.notes,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        deliveryFee: totals.deliveryFee,
        discountAmount: totals.discountAmount,
        total: totals.total,
        couponCode: coupon?.code ?? null,
        paymentMethod: input.paymentMethod as PaymentMethod,
        paymentStatus: "PENDING",
        source,
        items: {
          create: resolved.map((item) => ({
            dishId: item.dishId,
            dishName: item.dishName,
            variantName: item.variantName,
            addOns: item.addOns as unknown as Prisma.InputJsonValue,
            notes: item.notes,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            lineTotal: item.lineTotal,
          })),
        },
        payments: {
          create: {
            provider: input.paymentMethod === "COD" ? "cash" : settings.paymentProvider,
            amount: totals.total,
            status: "PENDING",
          },
        },
      },
      include: { items: true },
    });

    if (coupon) {
      await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
      await tx.couponUsage.create({
        data: {
          couponId: coupon.id,
          orderId: created.id,
          customerPhone: input.phone,
          discount: totals.discountAmount,
        },
      });
    }

    return created;
  });

  return { order, totals };
}
