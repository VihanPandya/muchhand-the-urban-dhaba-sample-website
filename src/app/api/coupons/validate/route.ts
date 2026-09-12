import type { NextRequest } from "next/server";
import { fail, guardRate, handleError, ok } from "@/lib/api";
import { assertSameOrigin } from "@/lib/csrf";
import { couponCheckSchema } from "@/lib/validation";
import { validateCoupon } from "@/lib/orders";

export const dynamic = "force-dynamic";

/** POST /api/coupons/validate — check a coupon against a cart subtotal. */
export async function POST(req: NextRequest) {
  const limited = guardRate(req, "coupon", 20, 60_000);
  if (limited) return limited;

  try {
    assertSameOrigin(req);
    const input = couponCheckSchema.parse(await req.json());
    const result = await validateCoupon(input.code, input.subtotal, input.phone);
    if (!result.valid) return fail(result.reason, 422);

    return ok({
      code: result.coupon.code,
      title: result.coupon.title,
      discount: result.discount,
      message: result.message,
    });
  } catch (error) {
    return handleError(error);
  }
}
