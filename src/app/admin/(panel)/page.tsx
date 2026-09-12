import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { getAnalytics, getDashboardSummary } from "@/lib/analytics";
import { getOpenStatus } from "@/lib/settings";
import { NoAccess, requireAdminPage } from "@/lib/admin-guard";
import { AdminCard, StatCard, StatusBadge, TableWrap, Td, Th, EmptyRow } from "@/components/admin/ui";
import { BarChart, DonutChart, LineChart } from "@/components/admin/charts";
import { IconAlert, IconBook, IconCalendar, IconChart, IconUsers } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  if (!(await requireAdminPage("dashboard.view"))) return <NoAccess what="the dashboard" />;

  const [summary, analytics, recentOrders, pendingReservations, status] = await Promise.all([
    getDashboardSummary(),
    getAnalytics(30),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        phone: true,
        total: true,
        status: true,
        type: true,
        createdAt: true,
      },
    }),
    prisma.reservation.findMany({
      where: { status: "PENDING" },
      orderBy: { date: "asc" },
      take: 5,
    }),
    getOpenStatus(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">Today at the dhaba</h1>
          <p className="mt-0.5 text-sm text-ink-500">
            {status.isOpen ? `Open now · ${status.todayLabel}` : status.message}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/orders" className="btn btn-sm btn-dark">
            Manage orders
          </Link>
          <Link href="/admin/analytics" className="btn btn-sm btn-outline">
            Full analytics
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Today's orders"
          value={String(summary.todayOrders)}
          hint={`${formatMoney(summary.todayRevenue)} today`}
          tone="saffron"
          icon={<IconBook className="h-5 w-5" />}
        />
        <StatCard
          label="Total revenue"
          value={formatMoney(summary.totalRevenue)}
          hint={`${summary.totalOrders} orders all time`}
          tone="mint"
          icon={<IconChart className="h-5 w-5" />}
        />
        <StatCard
          label="Pending orders"
          value={String(summary.pendingOrders)}
          hint={`${summary.completedOrders} completed · ${summary.cancelledOrders} cancelled`}
          tone={summary.pendingOrders > 0 ? "tandoor" : "default"}
          icon={<IconAlert className="h-5 w-5" />}
        />
        <StatCard
          label="Reservations"
          value={String(summary.upcomingReservations)}
          hint={`${summary.pendingReservations} awaiting confirmation`}
          icon={<IconCalendar className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <AdminCard
          title="Revenue · last 30 days"
          description={`${formatMoney(analytics.revenue)} from ${analytics.orders} orders · average ${formatMoney(analytics.averageOrderValue)}`}
          className="lg:col-span-2"
        >
          <LineChart
            label="Daily revenue"
            points={analytics.daily.map((point) => ({ label: point.label.slice(5), value: point.revenue }))}
            valueFormat={(value) => formatMoney(value)}
          />
        </AdminCard>

        <AdminCard title="Orders by status" description="Last 30 days">
          <DonutChart
            label="Orders by status"
            slices={analytics.ordersByStatus.map((entry, index) => ({
              label: entry.status.replace(/_/g, " ").toLowerCase(),
              value: entry.count,
              color: ["#e08c07", "#1f8a4c", "#b52e2c", "#c9a24a", "#584b44", "#f2a71b", "#7c6c62"][index % 7]!,
            }))}
          />
        </AdminCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <AdminCard
          title="Recent orders"
          className="lg:col-span-2"
          action={
            <Link href="/admin/orders" className="btn btn-sm btn-outline">
              View all
            </Link>
          }
        >
          <TableWrap>
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Type</Th>
                <Th>Total</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <EmptyRow colSpan={5} message="No orders yet." />
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="transition hover:bg-paper-dim/60">
                    <Td>
                      <Link href={`/admin/orders/${order.id}`} className="font-mono text-xs font-semibold text-saffron-700 hover:underline">
                        {order.orderNumber}
                      </Link>
                      <span className="mt-0.5 block text-[11px] text-ink-400">
                        {order.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </Td>
                    <Td>
                      <span className="block font-medium">{order.customerName}</span>
                      <span className="text-[11px] text-ink-400">{order.phone}</span>
                    </Td>
                    <Td className="text-xs uppercase">{order.type.toLowerCase()}</Td>
                    <Td className="font-semibold">{formatMoney(order.total)}</Td>
                    <Td>
                      <StatusBadge status={order.status} />
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </TableWrap>
        </AdminCard>

        <div className="space-y-4">
          <AdminCard
            title="Awaiting confirmation"
            action={
              <Link href="/admin/reservations" className="btn btn-sm btn-outline">
                All
              </Link>
            }
          >
            {pendingReservations.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-400">No pending reservations.</p>
            ) : (
              <ul className="space-y-3">
                {pendingReservations.map((reservation) => (
                  <li key={reservation.id} className="rounded-xl border border-ink-100 p-3">
                    <p className="font-medium text-ink-900">{reservation.name}</p>
                    <p className="text-xs text-ink-500">
                      {reservation.date.toISOString().slice(0, 10)} · {reservation.time} · {reservation.guests} guests
                    </p>
                    {reservation.specialRequest ? (
                      <p className="mt-1 text-xs italic text-ink-400">“{reservation.specialRequest}”</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>

          <AdminCard title="Inbox">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-2xl font-semibold">{summary.unreadMessages}</p>
                <p className="text-xs text-ink-400">unread enquiries</p>
              </div>
              <Link href="/admin/messages" className="btn btn-sm btn-outline">
                Open inbox
              </Link>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-4">
              <div>
                <p className="font-display text-2xl font-semibold">{summary.customers}</p>
                <p className="text-xs text-ink-400">customers in the database</p>
              </div>
              <Link href="/admin/customers" className="btn btn-sm btn-outline">
                <IconUsers className="h-4 w-4" />
              </Link>
            </div>
          </AdminCard>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard title="Popular dishes" description="By quantity sold in the last 30 days">
          <BarChart
            label="Popular dishes"
            points={analytics.topDishes.map((dish) => ({ label: dish.name, value: dish.quantity }))}
          />
        </AdminCard>
        <AdminCard title="Orders by category" description="Last 30 days">
          <BarChart
            label="Orders by category"
            points={analytics.topCategories.map((category) => ({ label: category.name, value: category.quantity }))}
          />
        </AdminCard>
      </div>
    </div>
  );
}
