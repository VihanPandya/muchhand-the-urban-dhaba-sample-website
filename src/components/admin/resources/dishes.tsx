"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type ListResponse } from "@/components/admin/api";
import { useToast } from "@/components/providers/toast";
import { formatMoney } from "@/lib/money";
import { AdminCard, AdminField, Alert, ConfirmButton, EmptyRow, Modal, Pagination, StatusBadge, TableWrap, Td, Th, Toggle } from "@/components/admin/ui";
import { ImageInput } from "@/components/admin/image-input";
import { IconEdit, IconPlus, IconSearch, IconTrash } from "@/components/icons";
import { VegMark } from "@/components/ui";

type Variant = { id?: string; name: string; price: number; isDefault: boolean; displayOrder: number };
type AddOn = { id?: string; name: string; price: number; active: boolean; displayOrder: number };

type DishRow = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  category?: { name: string };
  description: string;
  longDescription: string | null;
  price: number;
  discountPrice: number | null;
  imageUrl: string | null;
  isVeg: boolean;
  isJain: boolean;
  isVegan: boolean;
  isBestseller: boolean;
  isNew: boolean;
  isFeatured: boolean;
  spiceLevel: number;
  ingredients: string[];
  allergens: string[];
  portionSize: string | null;
  available: boolean;
  displayOrder: number;
  variants: Variant[];
  addOns: AddOn[];
};

const emptyForm = {
  name: "",
  slug: "",
  categoryId: "",
  description: "",
  longDescription: "",
  price: 0,
  discountPrice: null as number | null,
  imageUrl: "",
  isVeg: true,
  isJain: false,
  isVegan: false,
  isBestseller: false,
  isNew: false,
  isFeatured: false,
  spiceLevel: 0,
  ingredients: [] as string[],
  allergens: [] as string[],
  portionSize: "",
  available: true,
  displayOrder: 0,
  variants: [] as Variant[],
  addOns: [] as AddOn[],
};

const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function DishesManager({ categories }: { categories: { id: string; name: string }[] }) {
  const { toast } = useToast();
  const [data, setData] = useState<ListResponse<DishRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({ page: String(page), perPage: "25" });
      if (query.trim()) params.set("q", query.trim());
      if (categoryId) params.set("categoryId", categoryId);
      setData(await api.get<ListResponse<DishRow>>(`/api/admin/dishes?${params}`));
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Could not load the menu.");
    } finally {
      setLoading(false);
    }
  }, [page, query, categoryId]);

  useEffect(() => {
    const timer = setTimeout(load, query ? 250 : 0);
    return () => clearTimeout(timer);
  }, [load, query]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const openCreate = () => {
    setForm({ ...emptyForm, categoryId: categories[0]?.id ?? "" });
    setEditingId(null);
    setFieldErrors({});
    setFormError(null);
    setOpen(true);
  };

  const openEdit = (dish: DishRow) => {
    setForm({
      name: dish.name,
      slug: dish.slug,
      categoryId: dish.categoryId,
      description: dish.description,
      longDescription: dish.longDescription ?? "",
      price: dish.price,
      discountPrice: dish.discountPrice,
      imageUrl: dish.imageUrl ?? "",
      isVeg: dish.isVeg,
      isJain: dish.isJain,
      isVegan: dish.isVegan,
      isBestseller: dish.isBestseller,
      isNew: dish.isNew,
      isFeatured: dish.isFeatured,
      spiceLevel: dish.spiceLevel,
      ingredients: dish.ingredients,
      allergens: dish.allergens,
      portionSize: dish.portionSize ?? "",
      available: dish.available,
      displayOrder: dish.displayOrder,
      variants: dish.variants.map((v, index) => ({
        name: v.name,
        price: v.price,
        isDefault: v.isDefault,
        displayOrder: v.displayOrder ?? index,
      })),
      addOns: dish.addOns.map((a, index) => ({
        name: a.name,
        price: a.price,
        active: a.active,
        displayOrder: a.displayOrder ?? index,
      })),
    });
    setEditingId(dish.id);
    setFieldErrors({});
    setFormError(null);
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setFieldErrors({});
    setFormError(null);
    try {
      const payload = {
        ...form,
        slug: form.slug || slugify(form.name),
        longDescription: form.longDescription || null,
        portionSize: form.portionSize || null,
        imageUrl: form.imageUrl || null,
        discountPrice: form.discountPrice === null || Number.isNaN(form.discountPrice) ? null : form.discountPrice,
      };
      if (editingId) {
        await api.put(`/api/admin/dishes/${editingId}`, payload);
        toast("Dish updated.", "success");
      } else {
        await api.post("/api/admin/dishes", payload);
        toast("Dish added to the menu.", "success");
      }
      setOpen(false);
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

  const remove = async (dish: DishRow) => {
    try {
      await api.del(`/api/admin/dishes/${dish.id}`);
      toast(`${dish.name} removed from the menu.`, "success");
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not delete that dish.", "error");
    }
  };

  const toggleAvailability = async (dish: DishRow) => {
    try {
      await api.put(`/api/admin/dishes/${dish.id}`, {
        ...dish,
        category: undefined,
        available: !dish.available,
        longDescription: dish.longDescription ?? null,
        portionSize: dish.portionSize ?? null,
        imageUrl: dish.imageUrl ?? null,
        variants: dish.variants.map((v, i) => ({ name: v.name, price: v.price, isDefault: v.isDefault, displayOrder: i })),
        addOns: dish.addOns.map((a, i) => ({ name: a.name, price: a.price, active: a.active, displayOrder: i })),
      });
      toast(`${dish.name} is now ${dish.available ? "unavailable" : "available"}.`, "success");
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not update availability.", "error");
    }
  };

  return (
    <AdminCard
      title="Dishes"
      description="Everything on the menu. Changes appear on the website within a minute."
      action={
        <button type="button" onClick={openCreate} className="btn btn-sm btn-primary" disabled={categories.length === 0}>
          <IconPlus className="h-4 w-4" /> Add dish
        </button>
      }
    >
      {categories.length === 0 ? (
        <Alert kind="info">Create a category first — every dish belongs to one.</Alert>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-52 flex-1">
          <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            className="field pl-10"
            placeholder="Search dishes…"
            value={query}
            onChange={(event) => {
              setPage(1);
              setQuery(event.target.value);
            }}
            aria-label="Search dishes"
          />
        </div>
        <select
          className="field w-auto"
          value={categoryId}
          onChange={(event) => {
            setPage(1);
            setCategoryId(event.target.value);
          }}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
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
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="skeleton h-14 w-full" />
          ))}
        </div>
      ) : (
        <>
          <TableWrap>
            <thead>
              <tr>
                <Th>Dish</Th>
                <Th>Category</Th>
                <Th>Price</Th>
                <Th>Tags</Th>
                <Th>Availability</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {!data || data.items.length === 0 ? (
                <EmptyRow colSpan={6} message="No dishes match that search." />
              ) : (
                data.items.map((dish) => (
                  <tr key={dish.id} className="transition hover:bg-paper-dim/60">
                    <Td>
                      <span className="flex items-center gap-3">
                        <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                          {dish.imageUrl ? <Image src={dish.imageUrl} alt="" fill sizes="44px" className="object-cover" /> : null}
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5">
                            <VegMark isVeg={dish.isVeg} />
                            <span className="truncate font-medium text-ink-900">{dish.name}</span>
                          </span>
                          <span className="block font-mono text-[11px] text-ink-400">/{dish.slug}</span>
                        </span>
                      </span>
                    </Td>
                    <Td>{dish.category?.name ?? "—"}</Td>
                    <Td>
                      <span className="font-semibold">{formatMoney(dish.discountPrice ?? dish.price)}</span>
                      {dish.discountPrice !== null ? (
                        <span className="ml-1 text-[11px] text-ink-400 line-through">{formatMoney(dish.price)}</span>
                      ) : null}
                    </Td>
                    <Td>
                      <span className="flex flex-wrap gap-1">
                        {dish.isBestseller ? <span className="chip bg-saffron-100 text-saffron-700">Bestseller</span> : null}
                        {dish.isNew ? <span className="chip bg-mint-500/12 text-mint-600">New</span> : null}
                        {dish.isFeatured ? <span className="chip bg-ink-100 text-ink-600">Featured</span> : null}
                      </span>
                    </Td>
                    <Td>
                      <button type="button" onClick={() => toggleAvailability(dish)} aria-label={`Toggle availability for ${dish.name}`}>
                        <StatusBadge status={dish.available ? "COMPLETED" : "CANCELLED"} />
                      </button>
                    </Td>
                    <Td className="text-right">
                      <span className="inline-flex items-center gap-1.5">
                        <button type="button" onClick={() => openEdit(dish)} className="btn btn-sm btn-outline" aria-label={`Edit ${dish.name}`}>
                          <IconEdit className="h-4 w-4" />
                        </button>
                        <ConfirmButton onConfirm={() => remove(dish)} label={`Delete ${dish.name}`} confirmLabel="Delete">
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

      {open ? (
        <Modal title={editingId ? "Edit dish" : "Add dish"} onClose={() => setOpen(false)} wide>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
            noValidate
            className="space-y-5"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label="Dish name" id="d-name" required error={fieldErrors.name}>
                <input
                  id="d-name"
                  className="field"
                  value={form.name}
                  onChange={(event) => {
                    const value = event.target.value;
                    setForm((current) => ({
                      ...current,
                      name: value,
                      slug: !current.slug || current.slug === slugify(current.name) ? slugify(value) : current.slug,
                    }));
                  }}
                />
              </AdminField>

              <AdminField label="URL slug" id="d-slug" required error={fieldErrors.slug} hint="lowercase-with-hyphens">
                <input id="d-slug" className="field" value={form.slug} onChange={(event) => set("slug", event.target.value)} />
              </AdminField>

              <AdminField label="Category" id="d-category" required error={fieldErrors.categoryId}>
                <select id="d-category" className="field" value={form.categoryId} onChange={(event) => set("categoryId", event.target.value)}>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </AdminField>

              <AdminField label="Portion size" id="d-portion" error={fieldErrors.portionSize} hint="e.g. Serves 2">
                <input id="d-portion" className="field" value={form.portionSize} onChange={(event) => set("portionSize", event.target.value)} />
              </AdminField>

              <AdminField label="Price (₹)" id="d-price" required error={fieldErrors.price}>
                <input
                  id="d-price"
                  type="number"
                  min={0}
                  step={1}
                  className="field"
                  value={form.price}
                  onChange={(event) => set("price", Number(event.target.value))}
                />
              </AdminField>

              <AdminField label="Discounted price (₹)" id="d-discount" error={fieldErrors.discountPrice} hint="leave blank for no discount">
                <input
                  id="d-discount"
                  type="number"
                  min={0}
                  step={1}
                  className="field"
                  value={form.discountPrice ?? ""}
                  onChange={(event) => set("discountPrice", event.target.value === "" ? null : Number(event.target.value))}
                />
              </AdminField>
            </div>

            <AdminField label="Short description" id="d-description" required error={fieldErrors.description}>
              <textarea
                id="d-description"
                className="field min-h-20"
                maxLength={300}
                value={form.description}
                onChange={(event) => set("description", event.target.value)}
              />
            </AdminField>

            <AdminField label="Full description" id="d-long" error={fieldErrors.longDescription} hint="shown on the dish page">
              <textarea
                id="d-long"
                className="field min-h-28"
                value={form.longDescription}
                onChange={(event) => set("longDescription", event.target.value)}
              />
            </AdminField>

            <ImageInput label="Dish photo" value={form.imageUrl} onChange={(url) => set("imageUrl", url)} id="d-image" />

            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label="Ingredients" id="d-ingredients" hint="comma separated">
                <input
                  id="d-ingredients"
                  className="field"
                  value={form.ingredients.join(", ")}
                  onChange={(event) =>
                    set(
                      "ingredients",
                      event.target.value.split(",").map((part) => part.trim()).filter(Boolean),
                    )
                  }
                />
              </AdminField>
              <AdminField label="Allergens" id="d-allergens" hint="comma separated">
                <input
                  id="d-allergens"
                  className="field"
                  value={form.allergens.join(", ")}
                  onChange={(event) =>
                    set(
                      "allergens",
                      event.target.value.split(",").map((part) => part.trim()).filter(Boolean),
                    )
                  }
                />
              </AdminField>
              <AdminField label="Spice level" id="d-spice" hint="0 none · 3 hot">
                <select id="d-spice" className="field" value={form.spiceLevel} onChange={(event) => set("spiceLevel", Number(event.target.value))}>
                  <option value={0}>Not spicy</option>
                  <option value={1}>Mild</option>
                  <option value={2}>Medium</option>
                  <option value={3}>Hot</option>
                </select>
              </AdminField>
              <AdminField label="Display order" id="d-order">
                <input
                  id="d-order"
                  type="number"
                  min={0}
                  className="field"
                  value={form.displayOrder}
                  onChange={(event) => set("displayOrder", Number(event.target.value))}
                />
              </AdminField>
            </div>

            <fieldset className="grid gap-3 rounded-xl border border-ink-100 p-4 sm:grid-cols-2">
              <legend className="px-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink-400">Labels</legend>
              <Toggle label="Vegetarian" checked={form.isVeg} onChange={(value) => set("isVeg", value)} />
              <Toggle label="Jain available" checked={form.isJain} onChange={(value) => set("isJain", value)} />
              <Toggle label="Vegan" checked={form.isVegan} onChange={(value) => set("isVegan", value)} />
              <Toggle label="Bestseller" checked={form.isBestseller} onChange={(value) => set("isBestseller", value)} />
              <Toggle label="New dish" checked={form.isNew} onChange={(value) => set("isNew", value)} />
              <Toggle label="Featured on home page" checked={form.isFeatured} onChange={(value) => set("isFeatured", value)} />
              <Toggle label="Available to order" checked={form.available} onChange={(value) => set("available", value)} />
            </fieldset>

            <Repeater
              title="Portions"
              hint="Half / Full, or flavour options. The first one is selected by default."
              items={form.variants}
              onAdd={() =>
                set("variants", [...form.variants, { name: "", price: form.price, isDefault: form.variants.length === 0, displayOrder: form.variants.length }])
              }
              onRemove={(index) => set("variants", form.variants.filter((_, i) => i !== index))}
              render={(variant, index) => (
                <>
                  <input
                    className="field flex-1"
                    placeholder="Half"
                    value={variant.name}
                    onChange={(event) => {
                      const next = [...form.variants];
                      next[index] = { ...variant, name: event.target.value };
                      set("variants", next);
                    }}
                    aria-label={`Portion ${index + 1} name`}
                  />
                  <input
                    type="number"
                    min={0}
                    className="field w-28"
                    value={variant.price}
                    onChange={(event) => {
                      const next = [...form.variants];
                      next[index] = { ...variant, price: Number(event.target.value) };
                      set("variants", next);
                    }}
                    aria-label={`Portion ${index + 1} price`}
                  />
                </>
              )}
            />

            <Repeater
              title="Add-ons"
              hint="Extras the customer can add, like extra cheese or extra gravy."
              items={form.addOns}
              onAdd={() => set("addOns", [...form.addOns, { name: "", price: 0, active: true, displayOrder: form.addOns.length }])}
              onRemove={(index) => set("addOns", form.addOns.filter((_, i) => i !== index))}
              render={(addOn, index) => (
                <>
                  <input
                    className="field flex-1"
                    placeholder="Extra cheese"
                    value={addOn.name}
                    onChange={(event) => {
                      const next = [...form.addOns];
                      next[index] = { ...addOn, name: event.target.value };
                      set("addOns", next);
                    }}
                    aria-label={`Add-on ${index + 1} name`}
                  />
                  <input
                    type="number"
                    min={0}
                    className="field w-28"
                    value={addOn.price}
                    onChange={(event) => {
                      const next = [...form.addOns];
                      next[index] = { ...addOn, price: Number(event.target.value) };
                      set("addOns", next);
                    }}
                    aria-label={`Add-on ${index + 1} price`}
                  />
                </>
              )}
            />

            {formError ? <Alert kind="error">{formError}</Alert> : null}

            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
                {saving ? "Saving…" : "Save dish"}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </AdminCard>
  );
}

function Repeater<T>({
  title,
  hint,
  items,
  onAdd,
  onRemove,
  render,
}: {
  title: string;
  hint: string;
  items: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  render: (item: T, index: number) => React.ReactNode;
}) {
  return (
    <fieldset className="rounded-xl border border-ink-100 p-4">
      <legend className="px-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink-400">{title}</legend>
      <p className="mb-3 text-xs text-ink-400">{hint}</p>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            {render(item, index)}
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="btn btn-sm btn-outline shrink-0"
              aria-label={`Remove ${title.toLowerCase()} ${index + 1}`}
            >
              <IconTrash className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={onAdd} className="btn btn-sm btn-outline mt-3">
        <IconPlus className="h-4 w-4" /> Add {title.toLowerCase().replace(/s$/, "")}
      </button>
    </fieldset>
  );
}
