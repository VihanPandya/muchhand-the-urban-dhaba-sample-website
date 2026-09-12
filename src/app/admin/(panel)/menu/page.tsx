import { NoAccess, requireAdminPage } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { DishesManager } from "@/components/admin/resources/dishes";

export const dynamic = "force-dynamic";
export const metadata = { title: "Menu" };

export default async function AdminMenuPage() {
  if (!(await requireAdminPage("menu.manage"))) return <NoAccess what="the menu" />;
  const categories = await prisma.category.findMany({
    orderBy: { displayOrder: "asc" },
    select: { id: true, name: true },
  });
  return <DishesManager categories={categories} />;
}
