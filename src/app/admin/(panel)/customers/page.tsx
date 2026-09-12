import { NoAccess, requireAdminPage } from "@/lib/admin-guard";
import { CustomersManager } from "@/components/admin/resources/customers";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customers" };

export default async function AdminCustomersPage() {
  if (!(await requireAdminPage("customers.view"))) return <NoAccess what="customers" />;
  return <CustomersManager />;
}
