import type { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api";
import { assertCsrf } from "@/lib/csrf";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

/** GET /api/admin/notifications — latest dashboard notifications. */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin("dashboard.view");
    const unreadOnly = req.nextUrl.searchParams.get("unread") === "true";
    const [items, unread] = await Promise.all([
      prisma.notification.findMany({
        where: unreadOnly ? { read: false } : undefined,
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.notification.count({ where: { read: false } }),
    ]);
    return ok({ items: serialize(items), unread });
  } catch (error) {
    return handleError(error);
  }
}

/** PUT /api/admin/notifications — mark one (or all) as read. */
export async function PUT(req: NextRequest) {
  try {
    await requireAdmin("dashboard.view");
    assertCsrf(req);
    const body = (await req.json()) as { id?: string; all?: boolean };

    if (body.all) {
      await prisma.notification.updateMany({ where: { read: false }, data: { read: true } });
    } else if (body.id) {
      await prisma.notification.update({ where: { id: body.id }, data: { read: true } });
    }

    const unread = await prisma.notification.count({ where: { read: false } });
    return ok({ unread });
  } catch (error) {
    return handleError(error);
  }
}
