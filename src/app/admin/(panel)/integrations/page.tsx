import { NoAccess, requireAdminPage } from "@/lib/admin-guard";
import { getSettings } from "@/lib/settings";
import { serialize } from "@/lib/serialize";
import { IntegrationsForm } from "@/components/admin/integrations-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Integrations" };

export default async function AdminIntegrationsPage() {
  if (!(await requireAdminPage("integrations.manage"))) return <NoAccess what="integrations" />;
  const settings = await getSettings();
  return <IntegrationsForm initial={serialize(settings) as unknown as Record<string, unknown>} />;
}
