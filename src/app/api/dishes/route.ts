import type { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api";
import { getMenu } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** GET /api/dishes?category=&q=&veg=true — public dish listing. */
export async function GET(req: NextRequest) {
  try {
    const { dishes } = await getMenu();
    const params = req.nextUrl.searchParams;
    const category = params.get("category");
    const query = params.get("q")?.toLowerCase().trim();
    const veg = params.get("veg");

    const filtered = dishes.filter((dish) => {
      if (category && dish.categorySlug !== category) return false;
      if (veg === "true" && !dish.isVeg) return false;
      if (veg === "false" && dish.isVeg) return false;
      if (query && !`${dish.name} ${dish.description}`.toLowerCase().includes(query)) return false;
      return true;
    });

    return ok(filtered);
  } catch (error) {
    return handleError(error);
  }
}
