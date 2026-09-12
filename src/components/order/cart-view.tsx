"use client";

import Image from "next/image";
import Link from "next/link";
import { cartLineTotal, useCart, type CartLine } from "@/components/providers/cart";
import { useSite } from "@/components/providers/site";
import { usePersistedState } from "@/lib/use-persisted-state";
import { formatMoney } from "@/lib/money";
import { OrderSummary } from "@/components/order/order-summary";
import { CouponField, useAppliedCoupon } from "@/components/order/coupon-field";
import { OrderTypeToggle } from "@/components/order/order-type-toggle";
import { EmptyState, VegMark } from "@/components/ui";
import { IconCart, IconMinus, IconPlus, IconTrash, IconWhatsapp } from "@/components/icons";

export function CartView() {
  const { lines, setQuantity, removeLine, clear, subtotal, hydrated } = useCart();
  const { settings } = useSite();
  const [orderType, setOrderType] = usePersistedState<"DELIVERY" | "PICKUP">(
    "mud_order_type",
    settings.deliveryEnabled ? "DELIVERY" : "PICKUP",
  );
  const { coupon, apply: applyCoupon, clear: clearCoupon } = useAppliedCoupon(subtotal);

  if (!hydrated) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-28 w-full" />
          ))}
        </div>
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Nothing here yet. Browse the menu and add a few dishes — the tandoor is already hot."
        icon={<IconCart className="h-10 w-10" />}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/menu" className="btn btn-primary">
              Browse the menu
            </Link>
            <Link href="/offers" className="btn btn-outline">
              See today&apos;s offers
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-4">
        <div className="card divide-y divide-ink-100">
          {lines.map((line) => (
            <CartRow
              key={line.key}
              line={line}
              onQuantity={(quantity) => setQuantity(line.key, quantity)}
              onRemove={() => removeLine(line.key)}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/menu" className="btn btn-outline btn-sm">
            Add more dishes
          </Link>
          <button type="button" onClick={clear} className="text-sm font-semibold text-ink-400 transition hover:text-tandoor-600">
            Clear cart
          </button>
        </div>
      </div>

      <div className="space-y-4 lg:sticky lg:top-28">
        <OrderTypeToggle value={orderType} onChange={setOrderType} />

        <div className="card p-5">
          <CouponField
            subtotal={subtotal}
            applied={coupon}
            onApply={applyCoupon}
            onClear={clearCoupon}
          />
        </div>

        <OrderSummary lines={lines} orderType={orderType} coupon={coupon}>
          <div className="space-y-2">
            <Link href="/checkout" className="btn btn-primary w-full">
              Proceed to checkout
            </Link>
            <Link href="/whatsapp-order" className="btn btn-whatsapp w-full">
              <IconWhatsapp className="h-5 w-5" /> Send this order on WhatsApp
            </Link>
          </div>
        </OrderSummary>
      </div>
    </div>
  );
}

function CartRow({
  line,
  onQuantity,
  onRemove,
}: {
  line: CartLine;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-4 p-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-ink-100">
        <Image src={line.imageUrl} alt="" fill sizes="80px" className="object-cover" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2">
              <VegMark isVeg={line.isVeg} />
              <Link href={`/dish/${line.slug}`} className="truncate font-semibold text-ink-900 hover:text-saffron-700">
                {line.name}
              </Link>
            </p>
            {line.variantName ? <p className="mt-0.5 text-xs text-ink-500">Portion: {line.variantName}</p> : null}
            {line.addOns.length ? (
              <p className="mt-0.5 text-xs text-ink-500">Add-ons: {line.addOns.map((a) => a.name).join(", ")}</p>
            ) : null}
            {line.notes ? <p className="mt-0.5 text-xs italic text-ink-400">“{line.notes}”</p> : null}
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 rounded-full p-2 text-ink-300 transition hover:bg-tandoor-500/10 hover:text-tandoor-600"
            aria-label={`Remove ${line.name} from cart`}
          >
            <IconTrash className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="inline-flex items-center rounded-full border-[1.5px] border-ink-200">
            <button
              type="button"
              onClick={() => onQuantity(line.quantity - 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-600 transition hover:bg-ink-900/5"
              aria-label={`Decrease quantity of ${line.name}`}
            >
              <IconMinus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-bold">{line.quantity}</span>
            <button
              type="button"
              onClick={() => onQuantity(line.quantity + 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-600 transition hover:bg-ink-900/5"
              aria-label={`Increase quantity of ${line.name}`}
            >
              <IconPlus className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="font-display text-lg font-semibold">{formatMoney(cartLineTotal(line))}</span>
        </div>
      </div>
    </div>
  );
}
