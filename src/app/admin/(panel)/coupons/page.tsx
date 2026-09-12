import { NoAccess, requireAdminPage } from "@/lib/admin-guard";
import { CouponsManager } from "@/components/admin/resources/coupons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Offers" };

export default async function AdminCouponsPage() {
  if (!(await requireAdminPage("coupons.manage"))) return <NoAccess what="offers" />;
  return <CouponsManager />;
}
