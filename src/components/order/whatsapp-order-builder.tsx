"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/providers/cart";
import { useSite } from "@/components/providers/site";
import { usePersistedState } from "@/lib/use-persisted-state";
import { formatMoney } from "@/lib/money";
import { useOrderTotals } from "@/components/order/order-summary";
import { OrderTypeToggle } from "@/components/order/order-type-toggle";
import { EmptyState } from "@/components/ui";
import { IconCart, IconWhatsapp } from "@/components/icons";
import { buildWhatsappLink, formatItemsForWhatsapp, renderTemplate, DEFAULT_ORDER_TEMPLATE } from "@/lib/whatsapp";

export function WhatsappOrderBuilder() {
  const { lines, hydrated } = useCart();
  const { settings } = useSite();
  const [orderType, setOrderType] = usePersistedState<"DELIVERY" | "PICKUP">(
    "mud_order_type",
    settings.deliveryEnabled ? "DELIVERY" : "PICKUP",
  );
  const [details, setDetails] = usePersistedState("mud_whatsapp_details", { name: "", address: "", phone: "" });
  const [copied, setCopied] = useState(false);
  const totals = useOrderTotals(lines, orderType, null);

  if (!hydrated) return <div className="skeleton h-72 w-full" />;

  if (lines.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Add a few dishes first — then we'll turn them into a ready-to-send WhatsApp message."
        icon={<IconCart className="h-10 w-10" />}
        action={
          <Link href="/menu" className="btn btn-primary">
            Browse the menu
          </Link>
        }
      />
    );
  }

  const message = renderTemplate(settings.whatsappOrderTemplate || DEFAULT_ORDER_TEMPLATE, {
    restaurant_name: settings.name,
    customer_name: details.name || "—",
    items: formatItemsForWhatsapp(
      lines.map((line) => ({
        name: line.name,
        quantity: line.quantity,
        variantName: line.variantName,
        addOns: line.addOns,
        notes: line.notes,
      })),
    ),
    total: formatMoney(totals.total),
    order_type: orderType === "DELIVERY" ? "Delivery" : "Pickup",
    address: orderType === "DELIVERY" ? details.address || "—" : "Pickup from the restaurant",
    phone: details.phone || "—",
    order_number: "",
  });

  const href = buildWhatsappLink(settings.whatsappCountryCode, settings.whatsappNumber, message);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard blocked — the message is visible on screen anyway */
    }
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <div className="space-y-5">
        <OrderTypeToggle value={orderType} onChange={setOrderType} />

        <div className="card space-y-4 p-5 md:p-6">
          <h2 className="font-display text-lg font-semibold">Your details</h2>
          <div>
            <label className="label" htmlFor="wa-name">
              Name
            </label>
            <input
              id="wa-name"
              className="field"
              value={details.name}
              onChange={(event) => setDetails({ ...details, name: event.target.value })}
              placeholder="Rahul Mehta"
              autoComplete="name"
            />
          </div>
          <div>
            <label className="label" htmlFor="wa-phone">
              Your number
            </label>
            <input
              id="wa-phone"
              className="field"
              value={details.phone}
              onChange={(event) => setDetails({ ...details, phone: event.target.value })}
              placeholder="98250 12345"
              inputMode="numeric"
              autoComplete="tel-national"
            />
          </div>
          {orderType === "DELIVERY" ? (
            <div>
              <label className="label" htmlFor="wa-address">
                Delivery address
              </label>
              <textarea
                id="wa-address"
                className="field min-h-20"
                value={details.address}
                onChange={(event) => setDetails({ ...details, address: event.target.value })}
                placeholder="Flat, building, area, landmark, pincode"
                autoComplete="street-address"
              />
            </div>
          ) : null}
        </div>

        <div className="card p-5">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-base font-semibold">Order total</span>
            <span className="font-display text-2xl font-semibold">{formatMoney(totals.total)}</span>
          </div>
          <p className="mt-1 text-xs text-ink-400">
            Includes {settings.taxPercent}% taxes{orderType === "DELIVERY" && totals.deliveryFee > 0 ? " and delivery" : ""}. We&apos;ll
            confirm the final amount on chat.
          </p>
        </div>
      </div>

      <div className="space-y-4 lg:sticky lg:top-28">
        <div className="card overflow-hidden">
          <div className="border-b border-ink-100 bg-[#075e54] px-5 py-3 text-sm font-semibold text-white">
            Message preview
          </div>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words bg-[#e5ddd5] p-5 font-sans text-sm leading-relaxed text-ink-800">
            {message}
          </pre>
        </div>

        <div className="space-y-2">
          <a href={href} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-lg w-full">
            <IconWhatsapp className="h-5 w-5" /> Send on WhatsApp
          </a>
          <button type="button" onClick={copy} className="btn btn-outline w-full">
            {copied ? "Message copied" : "Copy message"}
          </button>
          <Link href="/checkout" className="btn btn-dark w-full">
            Or check out on the website
          </Link>
        </div>

        <p className="text-center text-xs text-ink-400">
          Sends to {settings.whatsappNumber ? `+${settings.whatsappCountryCode} ${settings.whatsappNumber}` : "our WhatsApp number"}.
        </p>
      </div>
    </div>
  );
}
