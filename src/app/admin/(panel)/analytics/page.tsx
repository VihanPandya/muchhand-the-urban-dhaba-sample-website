import Link from "next/link";
import { NoAccess, requireAdminPage } from "@/lib/admin-guard";
import { getAnalytics } from "@/lib/analytics";
import { formatMoney } from "@/lib/money";
import { AdminCard, StatCard } from "@/components/admin/ui";
import { BarChart, DonutChart, LineChart } from "@/components/admin/charts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics" };

const RANGES = [7, 30, 90, 365];

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  if (!(await requireAdminPage("analytics.view"))) return <NoAccess what="analytics" />;
  const { days: daysParam } = await searchParams;
  const days = RANGES.includes(Number(daysParam)) ? Number(daysParam) : 30;
  const analytics = await getAnalytics(days);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">Analytics</h1>
          <p className="text-sm text-ink-500">Last {days} days</p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Date range">
          {RANGES.map((range) => (
            <Link
              key={range}
              href={`/admin/analytics?days=${range}`}
              aria-current={days === range ? "page" : undefined}
              className={`chip transition ${days === range ? "bg-ink-900 text-paper" : "bg-ink-100 text-ink-600 hover:bg-ink-200/60"}`}
            >
              {range === 365 ? "1 year" : `${range} days`}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue" value={formatMoney(analytics.revenue)} hint={`${analytics.orders} orders`} tone="mint" />
        <StatCard label="Average order value" value={formatMoney(analytics.averageOrderValue)} hint="excluding cancelled orders" tone="saffron" />
        <StatCard label="New customers" value={String(analytics.newCustomers)} hint={`${analytics.repeatCustomers} ordered more than once`} />
        <StatCard label="Reservations" value={String(analytics.reservations)} hint={`${analytics.cancelled} orders cancelled`} />
      </div>

      <AdminCard title="Revenue trend" description={`Daily revenue over the last ${days} days`}>
        <LineChart
          label="Daily revenue"
          points={analytics.daily.map((point) => ({ label: point.label.slice(5), value: point.revenue }))}
          valueFormat={(value) => formatMoney(value)}
          height={240}
        />
      </AdminCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard title="Orders per day">
          <LineChart
            label="Orders per day"
            points={analytics.daily.map((point) => ({ label: point.label.slice(5), value: point.orders }))}
          />
        </AdminCard>
        <AdminCard title="Monthly revenue">
          <BarChart
            label="Monthly revenue"
            points={analytics.monthly.map((point) => ({ label: point.label, value: point.revenue }))}
            valueFormat={(value) => formatMoney(value)}
          />
        </AdminCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard title="Best-selling dishes" description="By quantity sold">
          <BarChart label="Best-selling dishes" points={analytics.topDishes.map((dish) => ({ label: dish.name, value: dish.quantity }))} />
        </AdminCard>
        <AdminCard title="Most popular categories">
          <BarChart
            label="Popular categories"
            points={analytics.topCategories.map((category) => ({ label: category.name, value: category.quantity }))}
          />
        </AdminCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard title="Orders by status">
          <DonutChart
            label="Orders by status"
            slices={analytics.ordersByStatus.map((entry, index) => ({
              label: entry.status.replace(/_/g, " ").toLowerCase(),
              value: entry.count,
              color: ["#e08c07", "#1f8a4c", "#b52e2c", "#c9a24a", "#584b44", "#f2a71b", "#7c6c62"][index % 7]!,
            }))}
          />
        </AdminCard>
        <AdminCard title="Delivery vs pickup">
          <DonutChart
            label="Delivery vs pickup"
            slices={analytics.ordersByType.map((entry, index) => ({
              label: entry.type.toLowerCase(),
              value: entry.count,
              color: ["#e08c07", "#1f8a4c"][index % 2]!,
            }))}
          />
        </AdminCard>
      </div>
    </div>
  );
}
