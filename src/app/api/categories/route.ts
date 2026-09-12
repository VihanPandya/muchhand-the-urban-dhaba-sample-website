import { handleError, ok } from "@/lib/api";
import { getMenu } from "@/lib/queries";

export const revalidate = 60;

/** GET /api/categories — public menu categories. */
export async function GET() {
  try {
    const { categories } = await getMenu();
    return ok(categories);
  } catch (error) {
    return handleError(error);
  }
}
