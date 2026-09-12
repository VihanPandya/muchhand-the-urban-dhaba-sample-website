import { NoAccess, requireAdminPage } from "@/lib/admin-guard";
import { AdminsManager } from "@/components/admin/resources/admins";

export const dynamic = "force-dynamic";
export const metadata = { title: "Team" };

export default async function AdminAdminsPage() {
  if (!(await requireAdminPage("admins.manage"))) return <NoAccess what="the team settings" />;
  return <AdminsManager />;
}
