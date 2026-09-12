import { NoAccess, requireAdminPage } from "@/lib/admin-guard";
import { CategoriesManager } from "@/components/admin/resources/categories";

export const dynamic = "force-dynamic";
export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  if (!(await requireAdminPage("categories.manage"))) return <NoAccess what="categories" />;
  return <CategoriesManager />;
}
