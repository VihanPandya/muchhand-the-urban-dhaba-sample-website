"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError, type ListResponse } from "@/components/admin/api";
import { useToast } from "@/components/providers/toast";
import { AdminCard, EmptyRow, Modal, Pagination, StatusBadge, TableWrap, Td, Th, AdminField, Alert } from "@/components/admin/ui";
import { IconSearch } from "@/components/icons";

type ReservationRow = {
  id: string;
  reference: string;
  name: string;
  phone: string;
  email: string | null;
  date: string;
  time: string;
  guests: number;
  specialRequest: string | null;
  adminNote: string | null;
  status: string;
  createdAt: string;
};

const RANGES = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "week", label: "This week" },
  { key: "upcoming", label: "Upcoming" },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function ReservationsManager({ canUpdate }: { canUpdate: boolean }) {
  const { toast } = useToast();
  const [data, setData] = useState<ListResponse<ReservationRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [range, setRange] = useState<RangeKey>("upcoming");
  const [editing, setEditing] = useState<ReservationRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({ page: String(page), perPage: "50" });
      if (query.trim()) params.set("q", query.trim());
      if (status) params.set("status", status);
      setData(await api.get<ListResponse<ReservationRow>>(`/api/admin/reservations?${params}`));
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Could not load reservations.");
    } finally {
      setLoading(false);
    }
  }, [page, query, status]);

  useEffect(() => {
    const timer = setTimeout(load, query ? 250 : 0);
    return () => clearTimeout(timer);
  }, [load, query]);

  const rows = useMemo(() => {
    if (!data) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = dayKey(today);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return data.items.filter((row) => {
      const key = row.date.slice(0, 10);
      switch (range) {
        case "today":
          return key === todayKey;
        case "tomorrow":
          return key === dayKey(tomorrow);
        case "week":
          return key >= todayKey && key <= dayKey(weekEnd);
        case "upcoming":
          return key >= todayKey;
        default:
          return true;
      }
    });
  }, [data, range]);

  const update = async (id: string, payload: Record<string, unknown>, message: string) => {
    try {
      await api.put(`/api/admin/reservations/${id}`, payload);
      toast(message, "success");
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not update that reservation.", "error");
    }
  };

  return (
    <AdminCard
      title="Reservations"
      description="Table bookings from the website and WhatsApp."
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
            placeholder="Search name, phone or reference…"
            value={query}
            onChange={(event) => {
              setPage(1);
              setQuery(event.target.value);
            }}
            aria-label="Search reservations"
          />
        </div>
        <select className="field w-auto" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {["PENDING", "CONFIRMED", "REJECTED", "COMPLETED", "CANCELLED"].map((value) => (
            <option key={value} value={value}>
              {value.toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Date range">
        {RANGES.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setRange(option.key)}
            aria-pressed={range === option.key}
            className={`chip transition ${range === option.key ? "bg-ink-900 text-paper" : "bg-ink-100 text-ink-600 hover:bg-ink-200/60"}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loadError ? (
        <div className="rounded-xl bg-tandoor-500/10 px-4 py-6 text-center text-sm text-tandoor-700">
          {loadError}
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
                <Th>Guest</Th>
                <Th>When</Th>
                <Th>Guests</Th>
                <Th>Request</Th>
                <Th>Status</Th>
                {canUpdate ? <Th className="text-right">Actions</Th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <EmptyRow colSpan={canUpdate ? 6 : 5} message="No reservations in this range." />
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-paper-dim/60">
                    <Td>
                      <span className="block font-medium text-ink-900">{row.name}</span>
                      <a href={`tel:${row.phone}`} className="text-[11px] text-ink-400 hover:text-saffron-700">
                        {row.phone}
                      </a>
                      <span className="block font-mono text-[10px] text-ink-300">{row.reference}</span>
                    </Td>
                    <Td>
                      <span className="block font-medium">{row.date.slice(0, 10)}</span>
                      <span className="text-[11px] text-ink-400">{row.time}</span>
                    </Td>
                    <Td>{row.guests}</Td>
                    <Td className="max-w-xs">
                      {row.specialRequest ? <span className="text-xs italic text-ink-500">“{row.specialRequest}”</span> : <span className="text-xs text-ink-300">—</span>}
                      {row.adminNote ? <span className="mt-1 block text-xs text-saffron-700">Note: {row.adminNote}</span> : null}
                    </Td>
                    <Td>
                      <StatusBadge status={row.status} />
                    </Td>
                    {canUpdate ? (
                      <Td className="text-right">
                        <span className="inline-flex flex-wrap justify-end gap-1.5">
                          {row.status === "PENDING" ? (
                            <>
                              <button
                                type="button"
                                className="btn btn-sm bg-mint-600 text-white hover:bg-mint-500"
                                onClick={() => update(row.id, { status: "CONFIRMED" }, "Reservation confirmed.")}
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline"
                                onClick={() => update(row.id, { status: "REJECTED" }, "Reservation rejected.")}
                              >
                                Reject
                              </button>
                            </>
                          ) : null}
                          {row.status === "CONFIRMED" ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline"
                              onClick={() => update(row.id, { status: "COMPLETED" }, "Marked as completed.")}
                            >
                              Completed
                            </button>
                          ) : null}
                          <button type="button" className="btn btn-sm btn-outline" onClick={() => setEditing(row)}>
                            Reschedule
                          </button>
                          {row.status !== "CANCELLED" ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline"
                              onClick={() => update(row.id, { status: "CANCELLED" }, "Reservation cancelled.")}
                            >
                              Cancel
                            </button>
                          ) : null}
                        </span>
                      </Td>
                    ) : null}
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

      {editing ? (
        <RescheduleModal
          reservation={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      ) : null}
    </AdminCard>
  );
}

function RescheduleModal({
  reservation,
  onClose,
  onSaved,
}: {
  reservation: ReservationRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [date, setDate] = useState(reservation.date.slice(0, 10));
  const [time, setTime] = useState(reservation.time);
  const [guests, setGuests] = useState(reservation.guests);
  const [note, setNote] = useState(reservation.adminNote ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.put(`/api/admin/reservations/${reservation.id}`, { date, time, guests, adminNote: note });
      toast("Reservation updated.", "success");
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update that reservation.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Reschedule · ${reservation.name}`} onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
        className="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <AdminField label="Date" id="r-date">
            <input id="r-date" type="date" className="field" value={date} onChange={(event) => setDate(event.target.value)} />
          </AdminField>
          <AdminField label="Time" id="r-time">
            <input id="r-time" type="time" className="field" value={time} onChange={(event) => setTime(event.target.value)} />
          </AdminField>
          <AdminField label="Guests" id="r-guests">
            <input
              id="r-guests"
              type="number"
              min={1}
              max={40}
              className="field"
              value={guests}
              onChange={(event) => setGuests(Number(event.target.value))}
            />
          </AdminField>
        </div>
        <AdminField label="Internal note" id="r-note" hint="only visible to the team">
          <textarea id="r-note" className="field min-h-20" value={note} onChange={(event) => setNote(event.target.value)} />
        </AdminField>

        {error ? <Alert kind="error">{error}</Alert> : null}

        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
