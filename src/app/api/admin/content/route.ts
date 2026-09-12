import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { handleError, ok } from "@/lib/api";
import { assertCsrf } from "@/lib/csrf";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";
import { contentBlockSchema } from "@/lib/validation";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

/** GET /api/admin/content — every CMS block. */
export async function GET() {
  try {
    await requireAdmin("content.manage");
    const blocks = await prisma.contentBlock.findMany({ orderBy: { key: "asc" } });
    return ok(serialize(blocks));
  } catch (error) {
    return handleError(error);
  }
}

/** PUT /api/admin/content — upsert one block by key. */
export async function PUT(req: NextRequest) {
  try {
    await requireAdmin("content.manage");
    assertCsrf(req);

    const input = contentBlockSchema.parse(await req.json());
    const data = input.data as Prisma.InputJsonValue;
    const block = await prisma.contentBlock.upsert({
      where: { key: input.key },
      create: { key: input.key, data },
      update: { data },
    });

    revalidatePath("/", "layout");
    return ok(serialize(block));
  } catch (error) {
    return handleError(error);
  }
}
