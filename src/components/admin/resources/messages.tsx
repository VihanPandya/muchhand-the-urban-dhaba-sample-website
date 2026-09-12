"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type ListResponse } from "@/components/admin/api";
import { useToast } from "@/components/providers/toast";
import { AdminCard, ConfirmButton, EmptyRow, Pagination, StatusBadge, TableWrap, Td, Th } from "@/components/admin/ui";
import { IconSearch, IconTrash } from "@/components/icons";

type MessageRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
};

export function MessagesManager() {
  const { toast } = useToast();
  const [data, setData] = useState<ListResponse<MessageRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), perPage: "25" });
      if (query.trim()) params.set("q", query.trim());
      if (status) params.set("status", status);
      setData(await api.get<ListResponse<MessageRow>>(`/api/admin/messages?${params}`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load messages.");
    } finally {
      setLoading(false);
    }
  }, [page, query, status]);

  useEffect(() => {
    const timer = setTimeout(load, query ? 250 : 0);
    return () => clearTimeout(timer);
  }, [load, query]);

  const setStatusFor = async (id: string, next: string) => {
    try {
      await api.put(`/api/admin/messages/${id}`, { status: next });
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not update that message.", "error");
    }
  };

  const remove = async (id: string) => {
    try {
      await api.del(`/api/admin/messages/${id}`);
      toast("Message deleted.", "success");
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not delete that message.", "error");
    }
  };

  return (
    <AdminCard title="Inbox" description="Messages sent through the contact form.">
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-52 flex-1">
          <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            className="field pl-10"
            placeholder="Search messages…"
            value={query}
            onChange={(event) => {
              setPage(1);
              setQuery(event.target.value);
            }}
            aria-label="Search messages"
          />
        </div>
        <select className="field w-auto" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
          <option value="">All</option>
          <option value="NEW">Unread</option>
          <option value="READ">Read</option>
          <option value="ARCHIVED">Archived</option>
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
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton h-20 w-full" />
          ))}
        </div>
      ) : (
        <>
          <TableWrap>
            <thead>
              <tr>
                <Th>From</Th>
                <Th>Message</Th>
                <Th>Received</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {!data || data.items.length === 0 ? (
                <EmptyRow colSpan={5} message="No messages here." />
              ) : (
                data.items.map((row) => (
                  <tr key={row.id} className="transition hover:bg-paper-dim/60">
                    <Td>
                      <span className="block font-medium text-ink-900">{row.name}</span>
                      <a href={`tel:${row.phone}`} className="block text-[11px] text-ink-400 hover:text-saffron-700">
                        {row.phone}
                      </a>
                      {row.email ? (
                        <a href={`mailto:${row.email}`} className="block text-[11px] text-ink-400 hover:text-saffron-700">
                          {row.email}
                        </a>
                      ) : null}
                    </Td>
                    <Td className="max-w-md">
                      <span className="block font-medium text-ink-800">{row.subject}</span>
                      <span className="block text-xs leading-relaxed text-ink-500">{row.message}</span>
                    </Td>
                    <Td className="text-xs text-ink-500">
                      {new Date(row.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </Td>
                    <Td>
                      <StatusBadge status={row.status} />
                    </Td>
                    <Td className="text-right">
                      <span className="inline-flex flex-wrap justify-end gap-1.5">
                        {row.status === "NEW" ? (
                          <button type="button" className="btn btn-sm btn-outline" onClick={() => setStatusFor(row.id, "READ")}>
                            Mark read
                          </button>
                        ) : null}
                        {row.status !== "ARCHIVED" ? (
                          <button type="button" className="btn btn-sm btn-outline" onClick={() => setStatusFor(row.id, "ARCHIVED")}>
                            Archive
                          </button>
                        ) : null}
                        <ConfirmButton onConfirm={() => remove(row.id)} label="Delete message" confirmLabel="Delete">
                          <IconTrash className="h-4 w-4" />
                        </ConfirmButton>
                      </span>
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
