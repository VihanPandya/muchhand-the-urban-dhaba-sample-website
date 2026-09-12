"use client";

import { useState, type ReactNode } from "react";
import { IconAlert, IconCheck, IconClose } from "@/components/icons";

export function AdminCard({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-ink-100 bg-white shadow-[var(--shadow-soft)] ${className}`}>
      {title || action ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <div>
            {title ? <h2 className="font-display text-base font-semibold text-ink-900">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-sm text-ink-500">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "saffron" | "mint" | "tandoor";
  icon?: ReactNode;
}) {
  const tones = {
    default: "bg-white",
    saffron: "bg-saffron-50",
    mint: "bg-mint-500/8",
    tandoor: "bg-tandoor-500/8",
  } as const;

  return (
    <div className={`rounded-2xl border border-ink-100 p-5 shadow-[var(--shadow-soft)] ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-400">{label}</p>
        {icon ? <span className="text-ink-300">{icon}</span> : null}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold text-ink-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-400">{hint}</p> : null}
    </div>
  );
}

const STATUS_TONES: Record<string, string> = {
  NEW: "bg-saffron-100 text-saffron-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PREPARING: "bg-saffron-100 text-saffron-700",
  READY: "bg-mint-500/15 text-mint-600",
  OUT_FOR_DELIVERY: "bg-mint-500/15 text-mint-600",
  COMPLETED: "bg-mint-500/15 text-mint-600",
  CANCELLED: "bg-tandoor-500/12 text-tandoor-600",
  REJECTED: "bg-tandoor-500/12 text-tandoor-600",
  PENDING: "bg-saffron-100 text-saffron-700",
  PAID: "bg-mint-500/15 text-mint-600",
  FAILED: "bg-tandoor-500/12 text-tandoor-600",
  REFUNDED: "bg-ink-100 text-ink-600",
  READ: "bg-ink-100 text-ink-600",
  ARCHIVED: "bg-ink-100 text-ink-500",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`chip ${STATUS_TONES[status] ?? "bg-ink-100 text-ink-600"}`}>
      {status.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
          checked ? "bg-mint-600" : "bg-ink-200"
        }`}
      >
        <span className="sr-only">{label}</span>
        <span
          className={`h-5 w-5 rounded-full bg-white shadow transition ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`}
        />
      </button>
      <span>
        <span className="block text-sm font-medium text-ink-800">{label}</span>
        {hint ? <span className="block text-xs text-ink-400">{hint}</span> : null}
      </span>
    </label>
  );
}

export function AdminField({
  label,
  id,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
        {required ? <span className="text-tandoor-500"> *</span> : null}
        {hint ? <span className="font-normal text-ink-400"> — {hint}</span> : null}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-sm text-tandoor-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Alert({ kind, children }: { kind: "error" | "success" | "info"; children: ReactNode }) {
  const tones = {
    error: "bg-tandoor-500/10 text-tandoor-700",
    success: "bg-mint-500/12 text-mint-600",
    info: "bg-saffron-50 text-saffron-700",
  } as const;
  return (
    <p className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${tones[kind]}`} role={kind === "error" ? "alert" : "status"}>
      {kind === "error" ? <IconAlert className="mt-0.5 h-4 w-4 shrink-0" /> : <IconCheck className="mt-0.5 h-4 w-4 shrink-0" />}
      <span>{children}</span>
    </p>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 bg-ink-950/55" onClick={onClose} aria-label="Close" />
      <div
        className={`relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-paper shadow-[var(--shadow-lift)] animate-[var(--animate-slide-up)] sm:rounded-3xl ${
          wide ? "sm:max-w-3xl" : "sm:max-w-lg"
        }`}
      >
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-ink-100 bg-paper px-5 py-4">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-500 transition hover:bg-ink-900/5"
            aria-label="Close"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmButton({
  onConfirm,
  label,
  confirmLabel = "Are you sure?",
  className = "btn btn-sm btn-outline",
  children,
}: {
  onConfirm: () => void;
  label: string;
  confirmLabel?: string;
  className?: string;
  children: ReactNode;
}) {
  const [armed, setArmed] = useState(false);

  if (armed) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <button
          type="button"
          className="btn btn-sm bg-tandoor-600 text-white hover:bg-tandoor-700"
          onClick={() => {
            setArmed(false);
            onConfirm();
          }}
        >
          {confirmLabel}
        </button>
        <button type="button" className="btn btn-sm btn-outline" onClick={() => setArmed(false)}>
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button type="button" className={className} onClick={() => setArmed(true)} aria-label={label}>
      {children}
    </button>
  );
}

export function Pagination({
  page,
  pages,
  total,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  onPage: (page: number) => void;
}) {
  if (pages <= 1) return <p className="text-xs text-ink-400">{total} total</p>;
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-ink-400">
        Page {page} of {pages} · {total} total
      </p>
      <div className="flex gap-2">
        <button type="button" className="btn btn-sm btn-outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        <button type="button" className="btn btn-sm btn-outline" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <th className={`border-b border-ink-100 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.1em] text-ink-400 ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`border-b border-ink-100 px-3 py-3 align-top text-ink-700 ${className}`}>{children}</td>;
}

export function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-12 text-center text-sm text-ink-400">
        {message}
      </td>
    </tr>
  );
}
