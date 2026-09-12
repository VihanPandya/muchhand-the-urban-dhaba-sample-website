import { handleError, ok } from "@/lib/api";
import { getBusinessHours, getOpenStatus, getPublicSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** GET /api/settings — public restaurant configuration for clients. */
export async function GET() {
  try {
    const [settings, hours, status] = await Promise.all([getPublicSettings(), getBusinessHours(), getOpenStatus()]);
    return ok({
      settings,
      hours: hours.map((h) => ({
        dayOfWeek: h.dayOfWeek,
        isOpen: h.isOpen,
        openTime: h.openTime,
        closeTime: h.closeTime,
      })),
      status: { isOpen: status.isOpen, message: status.message, nextOpenLabel: status.nextOpenLabel },
    });
  } catch (error) {
    return handleError(error);
  }
}
