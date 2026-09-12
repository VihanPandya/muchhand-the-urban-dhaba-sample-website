"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type ListResponse } from "@/components/admin/api";
import { useToast } from "@/components/providers/toast";
import { formatMoney } from "@/lib/money";
import { AdminCard, EmptyRow, Pagination, StatusBadge, TableWrap, Td, Th } from "@/components/admin/ui";
import { IconSearch } from "@/components/icons";

export const ORDER_STATUSES = [
  "NEW",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
] as const;

type OrderRow = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  type: "DELIVERY" | "PICKUP";
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  items: { id: string }[];
};

export function OrdersTable({ canUpdate }: { canUpdate: boolean }) {
  const { toast } = useToast();
  const [data, setData] = useState<ListResponse<OrderRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), perPage: "25" });
      if (query.trim()) params.set("q", query.trim());
      if (status) params.set("status", status);
      if (type) params.set("type", type);
      setData(await api.get<ListResponse<OrderRow>>(`/api/admin/orders?${params}`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load orders.");
    } finally {
      setLoading(false);
    }
  }, [page, query, status, type]);

  useEffect(() => {
    const timer = setTimeout(load, query ? 250 : 0);
    return () => clearTimeout(timer);
  }, [load, query]);

  const updateStatus = async (id: string, next: string) => {
    try {
      await api.put(`/api/admin/orders/${id}`, { status: next });
      toast(`Order marked ${next.replace(/_/g, " ").toLowerCase()}.`, "success");
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not update that order.", "error");
    }
  };

  return (
    <AdminCard
      title="Orders"
      description="Every order placed through the website and WhatsApp."
      action={
        <button type="button" onClick={load} className="btn btn-sm btn-outline">
          Refresh
        </button>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-52 flex-1">
          <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            className="field pl-10"
            placeholder="Search order number, name or phone…"
            value={query}
            onChange={(event) => {
              setPage(1);
              setQuery(event.target.value);
            }}
            aria-label="Search orders"
          />
        </div>
        <select
          className="field w-auto"
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value);
          }}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {value.replace(/_/g, " ").toLowerCase()}
            </option>
          ))}
        </select>
        <select
          className="field w-auto"
          value={type}
          onChange={(event) => {
            setPage(1);
            setType(event.target.value);
          }}
          aria-label="Filter by order type"
        >
          <option value="">All types</option>
          <option value="DELIVERY">Delivery</option>
          <option value="PICKUP">Pickup</option>
        </select>
      </div>

      {error ? (
        <div className="rounded-xl bg-tandoor-500/10 px-4 py-6 text-center text-sm text-tandoor-700">
          {error}
          <button type="button" onClick={load} className="btn btn-sm btn-outline ml-3">
            Retry
          </button>
        </div>
      ) : loading && !data ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="skeleton h-12 w-full" />
          ))}
        </div>
      ) : (
        <>
          <TableWrap>
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Items</Th>
                <Th>Total</Th>
                <Th>Payment</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {!data || data.items.length === 0 ? (
                <EmptyRow colSpan={7} message="No orders match those filters." />
              ) : (
                data.items.map((order) => (
                  <tr key={order.id} className="transition hover:bg-paper-dim/60">
                    <Td>
                      <Link href={`/admin/orders/${order.id}`} className="font-mono text-xs font-semibold text-saffron-700 hover:underline">
                        {order.orderNumber}
                      </Link>
                      <span className="mt-0.5 block text-[11px] text-ink-400">
                        {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                      <span className="text-[11px] uppercase text-ink-400">{order.type.toLowerCase()}</span>
                    </Td>
                    <Td>
                      <span className="block font-medium">{order.customerName}</span>
                      <a href={`tel:${order.phone}`} className="text-[11px] text-ink-400 hover:text-saffron-700">
                        {order.phone}
                      </a>
                    </Td>
                    <Td>{order.items.length}</Td>
                    <Td className="font-semibold">{formatMoney(order.total)}</Td>
                    <Td>
                      <span className="block text-xs uppercase">{order.paymentMethod}</span>
                      <StatusBadge status={order.paymentStatus} />
                    </Td>
                    <Td>
                      <StatusBadge status={order.status} />
                    </Td>
                    <Td className="text-right">
                      {canUpdate ? (
                        <select
                          className="field w-auto py-1.5 text-xs"
                          value={order.status}
                          onChange={(event) => updateStatus(order.id, event.target.value)}
                          aria-label={`Change status of order ${order.orderNumber}`}
                        >
                          {ORDER_STATUSES.map((value) => (
                            <option key={value} value={value}>
                              {value.replace(/_/g, " ").toLowerCase()}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Link href={`/admin/orders/${order.id}`} className="btn btn-sm btn-outline">
                          View
                        </Link>
                      )}
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </TableWrap>

          {data ? (
            <div className="mt-4">
              <Pagination page={data.page} pages={data.pages} total={data.total} onPage={setPage} />
            </div>
          ) : null}
        </>
      )}
    </AdminCard>
  );
}
