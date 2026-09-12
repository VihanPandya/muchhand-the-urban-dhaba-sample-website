import "server-only";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin, type AdminActor } from "@/lib/auth";
import type { Permission } from "@/lib/permissions";

/**
 * Page-level guard. Signed-out visitors go to the login screen; signed-in
 * admins without the permission get null so the page can render <NoAccess />
 * instead of throwing an error boundary at them. API routes still use
 * requireAdmin(), which throws — that is the enforcement that matters.
 */
export async function requireAdminPage(permission: Permission): Promise<AdminActor | null> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin.permissions.includes(permission) ? admin : null;
}

export function NoAccess({ what = "this page" }: { what?: string }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-ink-100 bg-white p-8 text-center shadow-[var(--shadow-soft)]">
      <h1 className="font-display text-xl font-semibold text-ink-900">You don&apos;t have access to {what}</h1>
      <p className="mt-2 text-sm text-ink-500">
        Your role doesn&apos;t include this area. If you need it, ask a super admin to update your
        permissions under Team &amp; roles.
      </p>
      <Link href="/admin" className="btn btn-primary mt-6">
        Back to the dashboard
      </Link>
    </div>
  );
}
