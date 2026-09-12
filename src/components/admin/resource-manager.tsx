"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { api, ApiError, type ListResponse } from "@/components/admin/api";
import { useToast } from "@/components/providers/toast";
import { AdminCard, AdminField, Alert, ConfirmButton, EmptyRow, Modal, Pagination, TableWrap, Td, Th, Toggle } from "@/components/admin/ui";
import { ImageInput } from "@/components/admin/image-input";
import { IconEdit, IconPlus, IconSearch, IconTrash } from "@/components/icons";

export type FieldSpec = {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "switch" | "image" | "tags" | "date" | "email" | "password";
  hint?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  half?: boolean;
  /** Derive this field from another one (used for slugs). */
  derivedFrom?: string;
};

export type ColumnSpec<T> = {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  className?: string;
};

export type ResourceManagerProps<T> = {
  resource: string;
  title: string;
  description?: string;
  columns: ColumnSpec<T>[];
  fields: FieldSpec[];
  emptyMessage: string;
  defaults: Record<string, unknown>;
  toForm?: (row: T) => Record<string, unknown>;
  toPayload?: (form: Record<string, unknown>) => Record<string, unknown>;
  canWrite?: boolean;
  filters?: { name: string; label: string; options: { value: string; label: string }[] }[];
  wideForm?: boolean;
  singularLabel?: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ResourceManager<T extends { id: string }>({
  resource,
  title,
  description,
  columns,
  fields,
  emptyMessage,
  defaults,
  toForm,
  toPayload,
  canWrite = true,
  filters = [],
  wideForm = false,
  singularLabel = "item",
}: ResourceManagerProps<T>) {
  const { toast } = useToast();
  const [data, setData] = useState<ListResponse<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const [editing, setEditing] = useState<T | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>(defaults);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({ page: String(page), perPage: "25" });
      if (query.trim()) params.set("q", query.trim());
      for (const [key, value] of Object.entries(filterValues)) {
        if (value) params.set(key, value);
      }
      setData(await api.get<ListResponse<T>>(`/api/admin/${resource}?${params}`));
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : `Could not load ${title.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  }, [resource, page, query, filterValues, title]);

  useEffect(() => {
    const timer = setTimeout(load, query ? 250 : 0);
    return () => clearTimeout(timer);
  }, [load, query]);

  const openCreate = () => {
    setForm({ ...defaults });
    setFieldErrors({});
    setFormError(null);
    setEditing(null);
    setCreating(true);
  };

  const openEdit = (row: T) => {
    setForm(toForm ? toForm(row) : ({ ...(row as unknown as Record<string, unknown>) }));
    setFieldErrors({});
    setFormError(null);
    setCreating(false);
    setEditing(row);
  };

  const close = () => {
    setCreating(false);
    setEditing(null);
  };

  const setValue = (name: string, value: unknown) => {
    setForm((current) => {
      const next = { ...current, [name]: value };
      // Keep slugs in step with the name until the slug is edited by hand.
      for (const field of fields) {
        if (field.derivedFrom === name && typeof value === "string") {
          const previousSource = String(current[name] ?? "");
          const currentSlug = String(current[field.name] ?? "");
          if (!currentSlug || currentSlug === slugify(previousSource)) {
            next[field.name] = slugify(value);
          }
        }
      }
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setFieldErrors({});
    setFormError(null);
    try {
      const payload = toPayload ? toPayload(form) : form;
      if (editing) {
        await api.put(`/api/admin/${resource}/${editing.id}`, payload);
        toast(`${singularLabel} updated.`, "success");
      } else {
        await api.post(`/api/admin/${resource}`, payload);
        toast(`${singularLabel} created.`, "success");
      }
      close();
      load();
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
        if (err.fieldErrors) setFieldErrors(err.fieldErrors);
      } else {
        setFormError("Something went wrong while saving.");
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: T) => {
    try {
      await api.del(`/api/admin/${resource}/${row.id}`);
      toast(`${singularLabel} deleted.`, "success");
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not delete that.", "error");
    }
  };

  return (
    <AdminCard
      title={title}
      description={description}
      action={
        canWrite ? (
          <button type="button" onClick={openCreate} className="btn btn-sm btn-primary">
            <IconPlus className="h-4 w-4" /> Add {singularLabel.toLowerCase()}
          </button>
        ) : null
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-52 flex-1">
          <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            className="field pl-10"
            placeholder={`Search ${title.toLowerCase()}…`}
            value={query}
            onChange={(event) => {
              setPage(1);
              setQuery(event.target.value);
            }}
            aria-label={`Search ${title}`}
          />
        </div>
        {filters.map((filter) => (
          <select
            key={filter.name}
            className="field w-auto"
            value={filterValues[filter.name] ?? ""}
            onChange={(event) => {
              setPage(1);
              setFilterValues((current) => ({ ...current, [filter.name]: event.target.value }));
            }}
            aria-label={filter.label}
          >
            <option value="">{filter.label}</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
                {columns.map((column) => (
                  <Th key={column.key} className={column.className}>
                    {column.label}
                  </Th>
                ))}
                {canWrite ? <Th className="text-right">Actions</Th> : null}
              </tr>
            </thead>
            <tbody>
              {!data || data.items.length === 0 ? (
                <EmptyRow colSpan={columns.length + (canWrite ? 1 : 0)} message={emptyMessage} />
              ) : (
                data.items.map((row) => (
                  <tr key={row.id} className="transition hover:bg-paper-dim/60">
                    {columns.map((column) => (
                      <Td key={column.key} className={column.className}>
                        {column.render(row)}
                      </Td>
                    ))}
                    {canWrite ? (
                      <Td className="text-right">
                        <span className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className="btn btn-sm btn-outline"
                            aria-label="Edit"
                          >
                            <IconEdit className="h-4 w-4" />
                          </button>
                          <ConfirmButton onConfirm={() => remove(row)} label="Delete" confirmLabel="Delete">
                            <IconTrash className="h-4 w-4" />
                          </ConfirmButton>
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

      {creating || editing ? (
        <Modal title={editing ? `Edit ${singularLabel.toLowerCase()}` : `Add ${singularLabel.toLowerCase()}`} onClose={close} wide={wideForm}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
            noValidate
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.name} className={field.half ? "" : "sm:col-span-2"}>
                  <FieldControl
                    field={field}
                    value={form[field.name]}
                    error={fieldErrors[field.name]}
                    onChange={(value) => setValue(field.name, value)}
                  />
                </div>
              ))}
            </div>

            {formError ? <Alert kind="error">{formError}</Alert> : null}

            <div className="flex gap-2 pt-2">
              <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
              <button type="button" className="btn btn-outline" onClick={close}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </AdminCard>
  );
}

function FieldControl({
  field,
  value,
  error,
  onChange,
}: {
  field: FieldSpec;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
}) {
  const id = `field-${field.name}`;

  if (field.type === "switch") {
    return (
      <div className="pt-1">
        <Toggle label={field.label} hint={field.hint} checked={Boolean(value)} onChange={onChange} />
        {error ? <p className="mt-1 text-sm text-tandoor-600">{error}</p> : null}
      </div>
    );
  }

  if (field.type === "image") {
    return <ImageInput id={id} label={field.label} value={String(value ?? "")} onChange={onChange} />;
  }

  return (
    <AdminField label={field.label} id={id} error={error} hint={field.hint} required={field.required}>
      {field.type === "textarea" ? (
        <textarea
          id={id}
          className="field min-h-24"
          value={String(value ?? "")}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : field.type === "select" ? (
        <select id={id} className="field" value={String(value ?? "")} onChange={(event) => onChange(event.target.value)}>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : field.type === "tags" ? (
        <input
          id={id}
          className="field"
          value={Array.isArray(value) ? (value as string[]).join(", ") : String(value ?? "")}
          placeholder={field.placeholder}
          onChange={(event) =>
            onChange(
              event.target.value
                .split(",")
                .map((part) => part.trim())
                .filter(Boolean),
            )
          }
        />
      ) : field.type === "number" ? (
        <input
          id={id}
          type="number"
          className="field"
          value={value === null || value === undefined || value === "" ? "" : Number(value)}
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
        />
      ) : (
        <input
          id={id}
          type={field.type === "email" ? "email" : field.type === "password" ? "password" : field.type === "date" ? "date" : "text"}
          className="field"
          value={String(value ?? "")}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </AdminField>
  );
}
