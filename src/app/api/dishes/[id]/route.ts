import { fail, handleError, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { toDishDTO } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** GET /api/dishes/:id — a single dish by id or slug. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const dish = await prisma.dish.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: { variants: true, addOns: true, category: true },
    });
    if (!dish) return fail("Dish not found.", 404);
    return ok(toDishDTO(dish));
  } catch (error) {
    return handleError(error);
  }
}
