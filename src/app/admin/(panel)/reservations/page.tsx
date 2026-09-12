import { NoAccess, requireAdminPage } from "@/lib/admin-guard";
import { ReservationsManager } from "@/components/admin/resources/reservations";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reservations" };

export default async function AdminReservationsPage() {
  const admin = await requireAdminPage("reservations.view");
  if (!admin) return <NoAccess what="reservations" />;
  return <ReservationsManager canUpdate={admin.permissions.includes("reservations.update")} />;
}
