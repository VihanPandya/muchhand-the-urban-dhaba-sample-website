import { NoAccess, requireAdminPage } from "@/lib/admin-guard";
import { GalleryManager } from "@/components/admin/resources/gallery";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gallery" };

export default async function AdminGalleryPage() {
  if (!(await requireAdminPage("gallery.manage"))) return <NoAccess what="the gallery" />;
  return <GalleryManager />;
}
