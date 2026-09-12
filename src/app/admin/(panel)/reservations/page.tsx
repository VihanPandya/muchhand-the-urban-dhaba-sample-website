import { NoAccess, requireAdminPage } from "@/lib/admin-guard";
import { getSettings } from "@/lib/settings";
import { ReservationsManager } from "@/components/admin/resources/reservations";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reservations" };

export default async function AdminReservationsPage() {
  const admin = await requireAdminPage("reservations.view");
  if (!admin) return <NoAccess what="reservations" />;
  const settings = await getSettings();
  return (
    <ReservationsManager
      canUpdate={admin.permissions.includes("reservations.update")}
      restaurantName={settings.name}
      countryCode={settings.whatsappCountryCode}
    />
  );
}
