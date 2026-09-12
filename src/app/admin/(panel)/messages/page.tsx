import { NoAccess, requireAdminPage } from "@/lib/admin-guard";
import { MessagesManager } from "@/components/admin/resources/messages";

export const dynamic = "force-dynamic";
export const metadata = { title: "Messages" };

export default async function AdminMessagesPage() {
  if (!(await requireAdminPage("messages.view"))) return <NoAccess what="the inbox" />;
  return <MessagesManager />;
}
