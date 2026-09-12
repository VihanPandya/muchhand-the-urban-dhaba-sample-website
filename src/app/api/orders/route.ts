import type { NextRequest } from "next/server";
import { fail, guardRate, handleError, ok } from "@/lib/api";
import { assertSameOrigin } from "@/lib/csrf";
import { createOrder, OrderError } from "@/lib/orders";
import { createOrderSchema } from "@/lib/validation";
import { notifyAdmins } from "@/lib/notifications";
import { getOpenStatus, getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

/** POST /api/orders — place a direct order. Public, rate limited, server-priced. */
export async function POST(req: NextRequest) {
  const limited = guardRate(req, "orders", 8, 60_000);
  if (limited) return limited;

  try {
    assertSameOrigin(req);
    const body = await req.json();
    const input = createOrderSchema.parse(body);

    const status = await getOpenStatus();
    if (!status.isOpen) {
      return fail(
        status.nextOpenLabel
          ? `We're closed right now. Online ordering reopens ${status.nextOpenLabel}.`
          : "We're closed right now. Please try again during our opening hours.",
        409,
      );
    }

    const { order, totals } = await createOrder(input, "WEB");
    const settings = await getSettings();

    await notifyAdmins({
      type: "ORDER",
      title: `New ${order.type.toLowerCase()} order · ${order.orderNumber}`,
      message: `${order.customerName} ordered ${order.items.length} item(s) for ${formatMoney(totals.total)}.`,
      link: `/admin/orders/${order.id}`,
      email: settings.notifyOnNewOrder
        ? {
            to: settings.notifyEmail,
            subject: `New order ${order.orderNumber} — ${formatMoney(totals.total)}`,
            body: [
              `Order: ${order.orderNumber}`,
              `Customer: ${order.customerName} (${order.phone})`,
              `Type: ${order.type}`,
              order.addressLine ? `Address: ${order.addressLine}` : "",
              `Total: ${formatMoney(totals.total)}`,
              `Payment: ${order.paymentMethod}`,
            ]
              .filter(Boolean)
              .join("\n"),
          }
        : undefined,
    });

    return ok(
      {
        orderNumber: order.orderNumber,
        id: order.id,
        total: totals.total,
        status: order.status,
        paymentMethod: order.paymentMethod,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof OrderError) return fail(error.message, error.status);
    return handleError(error);
  }
}
