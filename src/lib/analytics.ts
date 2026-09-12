import "server-only";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/money";

export type AnalyticsPoint = { label: string; orders: number; revenue: number };

export type Analytics = {
  days: number;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  completed: number;
  cancelled: number;
  pending: number;
  newCustomers: number;
  repeatCustomers: number;
  reservations: number;
  daily: AnalyticsPoint[];
  monthly: AnalyticsPoint[];
  topDishes: { name: string; quantity: number; revenue: number }[];
  topCategories: { name: string; quantity: number; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  ordersByType: { type: string; count: number }[];
};

const PENDING_STATUSES = ["NEW", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"] as const;

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Aggregates the order book for the dashboard and the analytics page.
 * Totals are computed in-process, which is fine at dhaba scale; move the daily
 * rollups into SQL (or a materialised view) if the order table gets very large.
 */
export async function getAnalytics(days = 30): Promise<Analytics> {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const [orders, topItems, categoryRows, reservations, newCustomers] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: since } },
      select: { id: true, createdAt: true, total: true, status: true, type: true, phone: true },
    }),
    prisma.orderItem.groupBy({
      by: ["dishName"],
      where: { order: { createdAt: { gte: since }, status: { not: "CANCELLED" } } },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 8,
    }),
    prisma.$queryRaw<{ name: string; quantity: bigint; revenue: unknown }[]>`
      SELECT c.name AS name,
             SUM(oi.quantity)::bigint AS quantity,
             SUM(oi."lineTotal") AS revenue
      FROM "OrderItem" oi
      JOIN "Order" o ON o.id = oi."orderId"
      LEFT JOIN "Dish" d ON d.id = oi."dishId"
      LEFT JOIN "Category" c ON c.id = d."categoryId"
      WHERE o."createdAt" >= ${since} AND o.status <> 'CANCELLED' AND c.name IS NOT NULL
      GROUP BY c.name
      ORDER BY quantity DESC
      LIMIT 8
    `,
    prisma.reservation.count({ where: { createdAt: { gte: since } } }),
    prisma.customer.count({ where: { createdAt: { gte: since } } }),
  ]);

  const billable = orders.filter((order) => order.status !== "CANCELLED");
  const revenue = billable.reduce((sum, order) => sum + toNumber(order.total), 0);

  const dailyMap = new Map<string, AnalyticsPoint>();
  for (let i = 0; i < days; i++) {
    const date = new Date(since);
    date.setDate(date.getDate() + i);
    dailyMap.set(dayKey(date), { label: dayKey(date), orders: 0, revenue: 0 });
  }
  const monthlyMap = new Map<string, AnalyticsPoint>();

  for (const order of billable) {
    const key = dayKey(order.createdAt);
    const point = dailyMap.get(key);
    if (point) {
      point.orders += 1;
      point.revenue += toNumber(order.total);
    }
    const month = key.slice(0, 7);
    const monthPoint = monthlyMap.get(month) ?? { label: month, orders: 0, revenue: 0 };
    monthPoint.orders += 1;
    monthPoint.revenue += toNumber(order.total);
    monthlyMap.set(month, monthPoint);
  }

  const phoneCounts = new Map<string, number>();
  for (const order of orders) {
    phoneCounts.set(order.phone, (phoneCounts.get(order.phone) ?? 0) + 1);
  }
  const repeatCustomers = [...phoneCounts.values()].filter((count) => count > 1).length;

  const statusCounts = new Map<string, number>();
  const typeCounts = new Map<string, number>();
  for (const order of orders) {
    statusCounts.set(order.status, (statusCounts.get(order.status) ?? 0) + 1);
    typeCounts.set(order.type, (typeCounts.get(order.type) ?? 0) + 1);
  }

  return {
    days,
    revenue: Math.round(revenue * 100) / 100,
    orders: orders.length,
    averageOrderValue: billable.length ? Math.round((revenue / billable.length) * 100) / 100 : 0,
    completed: statusCounts.get("COMPLETED") ?? 0,
    cancelled: statusCounts.get("CANCELLED") ?? 0,
    pending: PENDING_STATUSES.reduce((sum, status) => sum + (statusCounts.get(status) ?? 0), 0),
    newCustomers,
    repeatCustomers,
    reservations,
    daily: [...dailyMap.values()].map((point) => ({ ...point, revenue: Math.round(point.revenue * 100) / 100 })),
    monthly: [...monthlyMap.values()]
      .sort((a, b) => a.label.localeCompare(b.label))
      .map((point) => ({ ...point, revenue: Math.round(point.revenue * 100) / 100 })),
    topDishes: topItems.map((item) => ({
      name: item.dishName,
      quantity: item._sum.quantity ?? 0,
      revenue: toNumber(item._sum.lineTotal as unknown as number),
    })),
    topCategories: categoryRows.map((row) => ({
      name: row.name,
      quantity: Number(row.quantity),
      revenue: toNumber(row.revenue as number),
    })),
    ordersByStatus: [...statusCounts.entries()].map(([status, count]) => ({ status, count })),
    ordersByType: [...typeCounts.entries()].map(([type, count]) => ({ type, count })),
  };
}

export type DashboardSummary = {
  todayOrders: number;
  todayRevenue: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  upcomingReservations: number;
  pendingReservations: number;
  unreadMessages: number;
  customers: number;
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    todayAgg,
    totalAgg,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    upcomingReservations,
    pendingReservations,
    unreadMessages,
    customers,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfToday }, status: { not: "CANCELLED" } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { total: true }, _count: true }),
    prisma.order.count({ where: { status: { in: [...PENDING_STATUSES] } } }),
    prisma.order.count({ where: { status: "COMPLETED" } }),
    prisma.order.count({ where: { status: "CANCELLED" } }),
    prisma.reservation.count({ where: { date: { gte: startOfToday }, status: { in: ["PENDING", "CONFIRMED"] } } }),
    prisma.reservation.count({ where: { status: "PENDING" } }),
    prisma.contactMessage.count({ where: { status: "NEW" } }),
    prisma.customer.count(),
  ]);

  return {
    todayOrders: todayAgg._count,
    todayRevenue: toNumber(todayAgg._sum.total),
    totalOrders: totalAgg._count,
    totalRevenue: toNumber(totalAgg._sum.total),
    pendingOrders,
    completedOrders,
    cancelledOrders,
    upcomingReservations,
    pendingReservations,
    unreadMessages,
    customers,
  };
}
