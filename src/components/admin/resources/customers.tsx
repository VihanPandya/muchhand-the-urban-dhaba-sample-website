"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type ListResponse } from "@/components/admin/api";
import { formatMoney } from "@/lib/money";
import { AdminCard, EmptyRow, Pagination, TableWrap, Td, Th } from "@/components/admin/ui";
import { IconSearch } from "@/components/icons";

type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  addressLine: string | null;
  pincode: string | null;
  ordersCount: number;
  totalSpend: number;
  lastOrderAt: string | null;
  createdAt: string;
  _count?: { orders: number; reservations: number };
};

export function CustomersManager() {
  const [data, setData] = useState<ListResponse<CustomerRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), perPage: "25" });
      if (query.trim()) params.set("q", query.trim());
      setData(await api.get<ListResponse<CustomerRow>>(`/api/admin/customers?${params}`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load customers.");
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    const timer = setTimeout(load, query ? 250 : 0);
    return () => clearTimeout(timer);
  }, [load, query]);

  return (
    <AdminCard title="Customers" description="Everyone who has ordered or booked with us.">
      <div className="relative mb-4">
        <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          type="search"
          className="field pl-10"
          placeholder="Search by name, phone or email…"
          value={query}
          onChange={(event) => {
            setPage(1);
            setQuery(event.target.value);
          }}
          aria-label="Search customers"
        />
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
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="skeleton h-12 w-full" />
          ))}
        </div>
      ) : (
        <>
          <TableWrap>
            <thead>
              <tr>
                <Th>Customer</Th>
                <Th>Address</Th>
                <Th>Orders</Th>
                <Th>Total spend</Th>
                <Th>Last order</Th>
                <Th>Joined</Th>
              </tr>
            </thead>
            <tbody>
              {!data || data.items.length === 0 ? (
                <EmptyRow colSpan={6} message="No customers yet." />
              ) : (
                data.items.map((customer) => (
                  <tr key={customer.id} className="transition hover:bg-paper-dim/60">
                    <Td>
                      <span className="block font-medium text-ink-900">{customer.name}</span>
                      <a href={`tel:${customer.phone}`} className="block text-[11px] text-ink-400 hover:text-saffron-700">
                        {customer.phone}
                      </a>
                      {customer.email ? <span className="block text-[11px] text-ink-400">{customer.email}</span> : null}
                    </Td>
                    <Td className="max-w-xs text-xs text-ink-500">
                      {[customer.addressLine, customer.pincode].filter(Boolean).join(", ") || "—"}
                    </Td>
                    <Td>{customer.ordersCount}</Td>
                    <Td className="font-semibold">{formatMoney(customer.totalSpend)}</Td>
                    <Td className="text-xs text-ink-500">
                      {customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleDateString("en-IN") : "—"}
                    </Td>
                    <Td className="text-xs text-ink-500">{new Date(customer.createdAt).toLocaleDateString("en-IN")}</Td>
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
