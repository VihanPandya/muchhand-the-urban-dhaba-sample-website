import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { AdminShell } from "@/components/admin/shell";
import { ToastProvider } from "@/components/providers/toast";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  // The middleware already blocked unauthenticated requests; this re-check
  // makes sure the account still exists, is active and hasn't been revoked.
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const settings = await getSettings();

  return (
    <ToastProvider>
      <AdminShell
        admin={{ name: admin.name, email: admin.email, role: admin.role, permissions: admin.permissions }}
        restaurantName={settings.name}
        logoUrl={settings.logoUrl || "/logo.svg"}
      >
        {children}
      </AdminShell>
    </ToastProvider>
  );
}
