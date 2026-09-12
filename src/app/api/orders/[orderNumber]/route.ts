import type { NextRequest } from "next/server";
import { fail, guardRate, handleError, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/money";

export const dynamic = "force-dynamic";

/**
 * GET /api/orders/:orderNumber — order status lookup.
 * Public by order number, so only non-sensitive fields are returned and the
 * phone number is masked.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ orderNumber: string }> }) {
  const limited = guardRate(req, "order-status", 60, 60_000);
  if (limited) return limited;

  try {
    const { orderNumber } = await params;
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });
    if (!order) return fail("We couldn't find that order number.", 404);

    return ok({
      orderNumber: order.orderNumber,
      status: order.status,
      type: order.type,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      customerName: order.customerName,
      phone: order.phone.replace(/\d(?=\d{4})/g, "•"),
      placedAt: order.createdAt.toISOString(),
      subtotal: toNumber(order.subtotal),
      taxAmount: toNumber(order.taxAmount),
      deliveryFee: toNumber(order.deliveryFee),
      discountAmount: toNumber(order.discountAmount),
      total: toNumber(order.total),
      items: order.items.map((item) => ({
        name: item.dishName,
        variantName: item.variantName,
        quantity: item.quantity,
        lineTotal: toNumber(item.lineTotal),
        addOns: item.addOns,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}
