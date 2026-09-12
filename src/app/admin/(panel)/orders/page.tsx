import { NoAccess, requireAdminPage } from "@/lib/admin-guard";
import { OrdersTable } from "@/components/admin/orders-table";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders" };

export default async function AdminOrdersPage() {
  const admin = await requireAdminPage("orders.view");
  if (!admin) return <NoAccess what="orders" />;
  return <OrdersTable canUpdate={admin.permissions.includes("orders.update")} />;
}
