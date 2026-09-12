import Link from "next/link";
import { NoAccess, requireAdminPage } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { AdminCard } from "@/components/admin/ui";
import { MarkAllRead } from "@/components/admin/mark-all-read";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notifications" };

export default async function AdminNotificationsPage() {
  if (!(await requireAdminPage("dashboard.view"))) return <NoAccess what="notifications" />;
  const notifications = await prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 60 });

  return (
    <AdminCard title="Notifications" description="New orders, reservations and enquiries." action={<MarkAllRead />}>
      {notifications.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-400">Nothing here yet.</p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className={`rounded-xl border px-4 py-3 ${
                notification.read ? "border-ink-100 bg-white" : "border-saffron-200 bg-saffron-50"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink-900">{notification.title}</p>
                  <p className="text-sm text-ink-500">{notification.message}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-[11px] text-ink-400">
                    {notification.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                  {notification.link ? (
                    <Link href={notification.link} className="btn btn-sm btn-outline">
                      Open
                    </Link>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminCard>
  );
}
