import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { handleError, ok } from "@/lib/api";
import { assertCsrf } from "@/lib/csrf";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";
import { settingsInputSchema } from "@/lib/validation";
import { getBusinessHours, getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** GET /api/admin/settings — restaurant settings plus business hours. */
export async function GET() {
  try {
    await requireAdmin("settings.manage");
    const [settings, hours] = await Promise.all([getSettings(), getBusinessHours()]);
    return ok({ settings: serialize(settings), hours: serialize(hours) });
  } catch (error) {
    return handleError(error);
  }
}

/** PUT /api/admin/settings — update settings and/or the weekly hours. */
export async function PUT(req: NextRequest) {
  try {
    await requireAdmin("settings.manage");
    assertCsrf(req);

    const input = settingsInputSchema.parse(await req.json());
    const { businessHours, ...rest } = input;

    // Empty strings mean "clear this optional field".
    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (value === undefined) continue;
      data[key] = value === "" ? null : value;
    }
    // These columns are non-nullable in the schema — keep empty strings.
    for (const key of ["address", "phone", "email", "whatsappNumber", "whatsappCountryCode", "closedMessage", "tagline"]) {
      if (rest[key as keyof typeof rest] === "") data[key] = "";
    }

    const settings = await prisma.restaurantSettings.upsert({
      where: { id: "default" },
      create: { id: "default", ...data },
      update: data,
    });

    if (businessHours) {
      for (const hour of businessHours) {
        await prisma.businessHours.upsert({
          where: { dayOfWeek: hour.dayOfWeek },
          create: hour,
          update: { isOpen: hour.isOpen, openTime: hour.openTime, closeTime: hour.closeTime },
        });
      }
    }

    revalidatePath("/", "layout");
    return ok(serialize(settings));
  } catch (error) {
    return handleError(error);
  }
}
