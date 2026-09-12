import { Prisma } from "@prisma/client";

export type Money = number;

/** Prisma Decimal | string | number -> plain number (2dp), safe for client props. */
export function toNumber(value: Prisma.Decimal | number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return Number(value.toString());
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

const inrFormatterPaise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

/** ₹1,299 — drops decimals when the amount is whole, which most menu prices are. */
export function formatMoney(value: Prisma.Decimal | number | string | null | undefined): string {
  const n = toNumber(value);
  return Number.isInteger(n) ? inrFormatter.format(n) : inrFormatterPaise.format(n);
}

/** Plain "1299.00" for WhatsApp messages and receipts. */
export function formatAmountPlain(value: Prisma.Decimal | number | string | null | undefined): string {
  const n = toNumber(value);
  return Number.isInteger(n) ? `₹${n.toLocaleString("en-IN")}` : `₹${n.toFixed(2)}`;
}
