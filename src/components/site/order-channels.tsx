"use client";

import Link from "next/link";
import { useSite } from "@/components/providers/site";
import { buildWhatsappLink, renderTemplate } from "@/lib/whatsapp";
import { IconArrowRight, IconScooter, IconWhatsapp } from "@/components/icons";

/**
 * The four ways to order. Zomato and Swiggy are official restaurant links
 * configured in the admin panel — there is no API integration behind them.
 */
export function OrderChannels({ variant = "full" }: { variant?: "full" | "compact" }) {
  const { settings } = useSite();
  const whatsappHref = buildWhatsappLink(
    settings.whatsappCountryCode,
    settings.whatsappNumber,
    renderTemplate(settings.whatsappDefaultMessage, { restaurant_name: settings.name }),
  );

  const cards = [
    {
      key: "direct",
      title: "Order Directly",
      subtitle: "Order directly from us",
      description: "Best prices, our own riders, and every offer on this page applies.",
      cta: "Order Now",
      href: "/menu",
      external: false,
      className: "btn-primary",
      accent: "from-saffron-400/18 to-transparent",
      badge: "Best value",
      disabled: !settings.directOrderingEnabled,
    },
    {
      key: "zomato",
      title: "Zomato",
      subtitle: "Order through Zomato",
      description: "Use your Zomato Gold, credits and saved addresses.",
      cta: "Order on Zomato",
      href: settings.zomatoUrl ?? "/order/zomato",
      external: Boolean(settings.zomatoUrl),
      className: "btn-zomato",
      accent: "from-[#e23744]/14 to-transparent",
      badge: null,
      disabled: false,
    },
    {
      key: "swiggy",
      title: "Swiggy",
      subtitle: "Order through Swiggy",
      description: "Track your order live with Swiggy One benefits.",
      cta: "Order on Swiggy",
      href: settings.swiggyUrl ?? "/order/swiggy",
      external: Boolean(settings.swiggyUrl),
      className: "btn-swiggy",
      accent: "from-[#fc8019]/16 to-transparent",
      badge: null,
      disabled: false,
    },
  ];

  return (
    <div className={variant === "full" ? "grid gap-5 md:grid-cols-3" : "grid gap-4 sm:grid-cols-3"}>
      {cards.map((card) => (
        <div key={card.key} className="card relative flex flex-col overflow-hidden p-6">
          <div className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${card.accent}`} aria-hidden />
          <div className="relative">
            {card.badge ? <span className="chip mb-3 bg-saffron-100 text-saffron-700">{card.badge}</span> : null}
            <h3 className="font-display text-xl">{card.title}</h3>
            <p className="mt-1 text-sm font-medium text-ink-500">{card.subtitle}</p>
            {variant === "full" ? <p className="mt-3 text-sm leading-relaxed text-ink-500">{card.description}</p> : null}
          </div>
          <div className="relative mt-5 pt-1">
            {card.disabled ? (
              <span className="btn btn-outline w-full cursor-not-allowed opacity-60">Currently unavailable</span>
            ) : card.external ? (
              <a href={card.href} target="_blank" rel="noopener noreferrer" className={`btn ${card.className} w-full`}>
                {card.cta}
                <IconArrowRight className="h-4 w-4" />
              </a>
            ) : (
              <Link href={card.href} className={`btn ${card.className} w-full`}>
                {card.cta}
                <IconArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      ))}

      <div className="card relative flex flex-col justify-between gap-5 overflow-hidden bg-ink-900 p-6 text-paper md:col-span-3 md:flex-row md:items-center">
        <div className="flex items-start gap-4">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#25d366]/15 text-[#25d366]">
            <IconWhatsapp className="h-6 w-6" />
          </span>
          <div>
            <h3 className="font-display text-xl text-paper">Order via WhatsApp</h3>
            <p className="mt-1 max-w-xl text-sm text-ink-300">
              Build your cart here and we&apos;ll write the message for you — items, quantities, add-ons and total, all
              pre-filled. Tap send and we&apos;ll confirm on chat.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Link href="/whatsapp-order" className="btn btn-ghost-light">
            <IconScooter className="h-4 w-4" /> Build a WhatsApp order
          </Link>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
            <IconWhatsapp className="h-5 w-5" /> Chat now
          </a>
        </div>
      </div>
    </div>
  );
}
