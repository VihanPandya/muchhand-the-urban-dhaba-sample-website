import { NoAccess, requireAdminPage } from "@/lib/admin-guard";
import { getBusinessHours, getSettings } from "@/lib/settings";
import { serialize } from "@/lib/serialize";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  if (!(await requireAdminPage("settings.manage"))) return <NoAccess what="settings" />;
  const [settings, hours] = await Promise.all([getSettings(), getBusinessHours()]);

  return (
    <SettingsForm
      initial={serialize(settings) as unknown as Record<string, unknown>}
      hours={hours.map((hour) => ({
        dayOfWeek: hour.dayOfWeek,
        isOpen: hour.isOpen,
        openTime: hour.openTime,
        closeTime: hour.closeTime,
      }))}
    />
  );
}
