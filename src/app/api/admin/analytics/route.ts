import type { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { getAnalytics } from "@/lib/analytics";

export const dynamic = "force-dynamic";

/** GET /api/admin/analytics?days=30 — revenue, orders and trend data. */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin("analytics.view");
    const days = Math.min(365, Math.max(1, Number(req.nextUrl.searchParams.get("days") ?? 30)));
    return ok(await getAnalytics(days));
  } catch (error) {
    return handleError(error);
  }
}
