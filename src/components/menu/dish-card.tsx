"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { DishDTO } from "@/lib/queries";
import { formatMoney } from "@/lib/money";
import { useCart } from "@/components/providers/cart";
import { useSite } from "@/components/providers/site";
import { useToast } from "@/components/providers/toast";
import { buildWhatsappLink, formatItemsForWhatsapp, renderTemplate, DEFAULT_ORDER_TEMPLATE } from "@/lib/whatsapp";
import { IconPlus, IconWhatsapp } from "@/components/icons";
import { SpiceMeter, VegMark } from "@/components/ui";
import { DishQuickView } from "@/components/menu/dish-customiser";

export function DishCard({ dish, priority = false }: { dish: DishDTO; priority?: boolean }) {
  const [open, setOpen] = useState(false);
  const { addLine } = useCart();
  const { settings } = useSite();
  const { toast } = useToast();

  const needsChoices = dish.variants.length > 0 || dish.addOns.length > 0;

  const handleAdd = () => {
    if (!dish.available) return;
    if (needsChoices) {
      setOpen(true);
      return;
    }
    addLine({
      dishId: dish.id,
      slug: dish.slug,
      name: dish.name,
      imageUrl: dish.imageUrl,
      isVeg: dish.isVeg,
      variantId: null,
      variantName: null,
      addOns: [],
      unitPrice: dish.effectivePrice,
      quantity: 1,
      notes: null,
    });
    toast(`${dish.name} added to your order`, "success");
  };

  const whatsappHref = buildWhatsappLink(
    settings.whatsappCountryCode,
    settings.whatsappNumber,
    renderTemplate(settings.whatsappOrderTemplate || DEFAULT_ORDER_TEMPLATE, {
      restaurant_name: settings.name,
      customer_name: "",
      items: formatItemsForWhatsapp([{ name: dish.name, quantity: 1 }]),
      total: formatMoney(dish.effectivePrice),
      order_type: "Delivery",
      address: "",
      phone: "",
      order_number: "",
    }),
  );

  return (
    <>
      <article className="card group relative flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
        <Link href={`/dish/${dish.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-ink-100">
          <Image
            src={dish.imageUrl}
            alt={dish.name}
            fill
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
            className="object-cover transition duration-500 group-hover:scale-[1.06]"
            priority={priority}
            loading={priority ? undefined : "lazy"}
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {dish.isBestseller ? (
              <span className="chip bg-saffron-400 text-ink-900 shadow-sm">Bestseller</span>
            ) : null}
            {dish.isNew ? <span className="chip bg-mint-600 text-white shadow-sm">New</span> : null}
            {dish.discountPrice !== null ? (
              <span className="chip bg-tandoor-500 text-white shadow-sm">
                Save {formatMoney(dish.price - dish.discountPrice)}
              </span>
            ) : null}
          </div>
          {!dish.available ? (
            <div className="absolute inset-0 flex items-center justify-center bg-ink-950/65">
              <span className="chip bg-paper text-ink-800">Currently unavailable</span>
            </div>
          ) : null}
        </Link>

        <div className="flex flex-1 flex-col p-4">
          <div className="mb-1.5 flex items-center gap-2">
            <VegMark isVeg={dish.isVeg} />
            <SpiceMeter level={dish.spiceLevel} />
            {dish.isJain ? <span className="chip bg-mint-500/12 px-2 py-0.5 text-[10px] text-mint-600">Jain</span> : null}
            {dish.isVegan ? <span className="chip bg-mint-500/12 px-2 py-0.5 text-[10px] text-mint-600">Vegan</span> : null}
          </div>

          <h3 className="font-display text-lg leading-snug">
            <Link href={`/dish/${dish.slug}`} className="transition hover:text-saffron-700">
              {dish.name}
            </Link>
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-500">{dish.description}</p>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-xl font-semibold text-ink-900">{formatMoney(dish.effectivePrice)}</span>
            {dish.discountPrice !== null ? (
              <span className="text-sm text-ink-400 line-through">{formatMoney(dish.price)}</span>
            ) : null}
            {dish.portionSize ? <span className="ml-auto text-xs text-ink-400">{dish.portionSize}</span> : null}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!dish.available}
              className="btn btn-primary btn-sm flex-1"
              aria-label={needsChoices ? `Customise and add ${dish.name}` : `Add ${dish.name} to order`}
            >
              <IconPlus className="h-4 w-4" />
              {needsChoices ? "Customise" : "Add to Order"}
            </button>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp btn-sm px-3"
              aria-label={`Order ${dish.name} on WhatsApp`}
            >
              <IconWhatsapp className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">WhatsApp</span>
            </a>
          </div>
        </div>
      </article>

      {open ? <DishQuickView dish={dish} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

export function DishCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-[4/3] rounded-none" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-4/5" />
        <div className="skeleton h-9 w-full rounded-full" />
      </div>
    </div>
  );
}
