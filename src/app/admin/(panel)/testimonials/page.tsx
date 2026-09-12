import { NoAccess, requireAdminPage } from "@/lib/admin-guard";
import { TestimonialsManager } from "@/components/admin/resources/testimonials";

export const dynamic = "force-dynamic";
export const metadata = { title: "Testimonials" };

export default async function AdminTestimonialsPage() {
  if (!(await requireAdminPage("testimonials.manage"))) return <NoAccess what="testimonials" />;
  return <TestimonialsManager />;
}
