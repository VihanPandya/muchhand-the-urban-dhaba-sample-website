"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { DishDTO } from "@/lib/queries";
import { formatMoney } from "@/lib/money";
import { useCart } from "@/components/providers/cart";
import { useSite } from "@/components/providers/site";
import { useToast } from "@/components/providers/toast";
import { buildWhatsappLink, formatItemsForWhatsapp, renderTemplate, DEFAULT_ORDER_TEMPLATE } from "@/lib/whatsapp";
import { IconMinus, IconPlus, IconWhatsapp } from "@/components/icons";
import { SpiceMeter, VegMark } from "@/components/ui";

export function DishCustomiser({
  dish,
  onAdded,
  compact = false,
}: {
  dish: DishDTO;
  onAdded?: () => void;
  compact?: boolean;
}) {
  const { addLine } = useCart();
  const { settings, status } = useSite();
  const { toast } = useToast();

  const defaultVariant = dish.variants.find((v) => v.isDefault) ?? dish.variants[0] ?? null;
  const [variantId, setVariantId] = useState<string | null>(defaultVariant?.id ?? null);
  const [addOnIds, setAddOnIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  const variant = dish.variants.find((v) => v.id === variantId) ?? null;
  const unitPrice = variant ? variant.price : dish.effectivePrice;
  const selectedAddOns = useMemo(
    () => dish.addOns.filter((a) => addOnIds.includes(a.id)),
    [dish.addOns, addOnIds],
  );
  const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + a.price, 0);
  const lineTotal = Math.round((unitPrice + addOnsTotal) * quantity * 100) / 100;

  const toggleAddOn = (id: string) => {
    setAddOnIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  };

  const buildLine = () => ({
    dishId: dish.id,
    slug: dish.slug,
    name: dish.name,
    imageUrl: dish.imageUrl,
    isVeg: dish.isVeg,
    variantId: variant?.id ?? null,
    variantName: variant?.name ?? null,
    addOns: selectedAddOns.map((a) => ({ id: a.id, name: a.name, price: a.price })),
    unitPrice,
    quantity,
    notes: notes.trim() ? notes.trim() : null,
  });

  const handleAdd = () => {
    if (!dish.available) return;
    addLine(buildLine());
    toast(`${quantity} × ${dish.name} added to your order`, "success");
    onAdded?.();
  };

  const whatsappHref = buildWhatsappLink(
    settings.whatsappCountryCode,
    settings.whatsappNumber,
    renderTemplate(settings.whatsappOrderTemplate || DEFAULT_ORDER_TEMPLATE, {
      restaurant_name: settings.name,
      customer_name: "",
      items: formatItemsForWhatsapp([
        { name: dish.name, quantity, variantName: variant?.name, addOns: selectedAddOns, notes },
      ]),
      total: formatMoney(lineTotal),
      order_type: "Delivery",
      address: "",
      phone: "",
      order_number: "",
    }),
  );

  return (
    <div className="flex flex-col gap-5">
      {dish.variants.length > 0 ? (
        <fieldset>
          <legend className="label">Choose portion</legend>
          <div className="flex flex-wrap gap-2">
            {dish.variants.map((v) => (
              <label
                key={v.id}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border-[1.5px] px-3.5 py-2.5 text-sm font-semibold transition ${
                  variantId === v.id
                    ? "border-saffron-400 bg-saffron-50 text-saffron-700"
                    : "border-ink-200 hover:border-ink-300"
                }`}
              >
                <input
                  type="radio"
                  name={`variant-${dish.id}`}
                  className="sr-only"
                  checked={variantId === v.id}
                  onChange={() => setVariantId(v.id)}
                />
                <span>{v.name}</span>
                <span className="text-ink-400">{formatMoney(v.price)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {dish.addOns.length > 0 ? (
        <fieldset>
          <legend className="label">Add-ons</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {dish.addOns.map((addOn) => (
              <label
                key={addOn.id}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border-[1.5px] px-3.5 py-2.5 text-sm transition ${
                  addOnIds.includes(addOn.id)
                    ? "border-saffron-400 bg-saffron-50"
                    : "border-ink-200 hover:border-ink-300"
                }`}
              >
                <span className="flex items-center gap-2 font-medium">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--color-saffron-500)]"
                    checked={addOnIds.includes(addOn.id)}
                    onChange={() => toggleAddOn(addOn.id)}
                  />
                  {addOn.name}
                </span>
                <span className="text-ink-400">{addOn.price > 0 ? `+${formatMoney(addOn.price)}` : "Free"}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {!compact ? (
        <div>
          <label className="label" htmlFor={`notes-${dish.id}`}>
            Cooking instructions <span className="font-normal text-ink-400">(optional)</span>
          </label>
          <input
            id={`notes-${dish.id}`}
            type="text"
            className="field"
            maxLength={200}
            placeholder="Less spicy, no onion, extra gravy…"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink-100 pt-4">
        <div className="inline-flex items-center rounded-full border-[1.5px] border-ink-200">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-600 transition hover:bg-ink-900/5 disabled:opacity-40"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
          >
            <IconMinus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center text-sm font-bold" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(50, q + 1))}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-600 transition hover:bg-ink-900/5"
            aria-label="Increase quantity"
          >
            <IconPlus className="h-4 w-4" />
          </button>
        </div>
        <p className="text-right">
          <span className="block text-xs text-ink-400">Item total</span>
          <span className="font-display text-2xl font-semibold text-ink-900">{formatMoney(lineTotal)}</span>
        </p>
      </div>

      {!dish.available ? (
        <p className="rounded-xl bg-ink-100 px-4 py-3 text-sm text-ink-500">
          This dish is unavailable right now. Please pick something else — or ask us on WhatsApp.
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handleAdd}
          disabled={!dish.available || !settings.directOrderingEnabled}
          className="btn btn-primary flex-1"
        >
          Add to Cart · {formatMoney(lineTotal)}
        </button>
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp flex-1">
          <IconWhatsapp className="h-5 w-5" /> Order on WhatsApp
        </a>
      </div>

      {!status.isOpen ? (
        <p className="text-center text-xs text-ink-400">
          The kitchen is closed right now — you can still build your order and place it when we reopen.
        </p>
      ) : null}
    </div>
  );
}

export function DishQuickView({ dish, onClose }: { dish: DishDTO; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[75] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Customise ${dish.name}`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink-950/60 animate-[var(--animate-fade-in)]"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-paper shadow-[var(--shadow-lift)] animate-[var(--animate-slide-up)] sm:max-w-lg sm:rounded-3xl">
        <div className="relative h-44 w-full sm:h-52">
          <Image src={dish.imageUrl} alt={dish.name} fill sizes="(max-width: 640px) 100vw, 512px" className="object-cover" />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-paper/90 text-ink-800 shadow-sm transition hover:bg-paper"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="space-y-4 p-5 sm:p-6">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <VegMark isVeg={dish.isVeg} />
              <SpiceMeter level={dish.spiceLevel} />
              {dish.portionSize ? <span className="text-xs text-ink-400">· {dish.portionSize}</span> : null}
            </div>
            <h2 className="text-2xl">{dish.name}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{dish.description}</p>
          </div>
          <DishCustomiser dish={dish} onAdded={onClose} />
          <a href={`/dish/${dish.slug}`} className="block text-center text-sm font-semibold text-saffron-600 hover:underline">
            See full details, ingredients & allergens
          </a>
        </div>
      </div>
    </div>
  );
}
