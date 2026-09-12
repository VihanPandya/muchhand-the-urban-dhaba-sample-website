"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/providers/cart";
import { useSite } from "@/components/providers/site";
import { buildWhatsappLink, renderTemplate } from "@/lib/whatsapp";
import {
  IconCart,
  IconClose,
  IconMapPin,
  IconMenu,
  IconPhone,
  IconWhatsapp,
} from "@/components/icons";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/about", label: "About" },
  { href: "/gallery", label: "Gallery" },
  { href: "/offers", label: "Offers" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { count } = useCart();
  const { settings, status } = useSite();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const whatsappHref = buildWhatsappLink(
    settings.whatsappCountryCode,
    settings.whatsappNumber,
    renderTemplate(settings.whatsappDefaultMessage, { restaurant_name: settings.name }),
  );

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-shadow duration-300 ${
          scrolled ? "shadow-[0_10px_30px_-24px_rgba(20,17,15,0.8)]" : ""
        }`}
      >
        <div className="hidden bg-ink-900 text-paper md:block">
          <div className="container-x flex items-center justify-between py-1.5 text-xs">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${status.isOpen ? "bg-mint-500" : "bg-tandoor-400"}`}
                  aria-hidden
                />
                {status.isOpen ? `Open now · ${status.todayLabel}` : "Closed right now"}
              </span>
              <span className="text-ink-300">{settings.address.split(",").slice(0, 2).join(", ")}</span>
            </div>
            <div className="flex items-center gap-4">
              <a href={`tel:${settings.phone}`} className="transition hover:text-saffron-300">
                {settings.phone}
              </a>
              {settings.zomatoUrl ? (
                <a href={settings.zomatoUrl} target="_blank" rel="noopener noreferrer" className="transition hover:text-saffron-300">
                  Zomato
                </a>
              ) : null}
              {settings.swiggyUrl ? (
                <a href={settings.swiggyUrl} target="_blank" rel="noopener noreferrer" className="transition hover:text-saffron-300">
                  Swiggy
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="border-b border-ink-100/70 bg-paper/92 backdrop-blur-md">
          <div className="container-x flex h-16 items-center justify-between gap-4 md:h-20">
            <Link href="/" className="flex items-center gap-2.5" aria-label={`${settings.name} — home`}>
              <Image
                src={settings.logoUrl || "/logo.svg"}
                alt=""
                width={44}
                height={44}
                className="h-10 w-10 rounded-full md:h-11 md:w-11"
                priority
              />
              <span className="flex flex-col leading-none">
                <span className="font-display text-lg font-semibold tracking-tight text-ink-900 md:text-xl">
                  Muchhad
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-saffron-600">
                  The Urban Dhaba
                </span>
              </span>
            </Link>

            <nav aria-label="Main" className="hidden lg:block">
              <ul className="flex items-center gap-1">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      className={`relative rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                        isActive(item.href)
                          ? "text-saffron-700"
                          : "text-ink-600 hover:bg-ink-900/5 hover:text-ink-900"
                      }`}
                    >
                      {item.label}
                      {isActive(item.href) ? (
                        <span className="absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-saffron-400" aria-hidden />
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex items-center gap-1.5 md:gap-2">
              <a
                href={`tel:${settings.phone}`}
                className="hidden h-10 w-10 items-center justify-center rounded-full text-ink-600 transition hover:bg-ink-900/5 hover:text-ink-900 md:inline-flex"
                aria-label={`Call ${settings.name}`}
              >
                <IconPhone className="h-[18px] w-[18px]" />
              </a>
              <Link
                href="/find-us"
                className="hidden h-10 w-10 items-center justify-center rounded-full text-ink-600 transition hover:bg-ink-900/5 hover:text-ink-900 md:inline-flex"
                aria-label="Find us"
              >
                <IconMapPin className="h-[18px] w-[18px]" />
              </Link>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden h-10 w-10 items-center justify-center rounded-full text-[#1c8c4c] transition hover:bg-[#25d366]/12 md:inline-flex"
                aria-label="Chat with us on WhatsApp"
              >
                <IconWhatsapp className="h-[19px] w-[19px]" />
              </a>

              <Link
                href="/cart"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-700 transition hover:bg-ink-900/5"
                aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
              >
                <IconCart className="h-[19px] w-[19px]" />
                {count > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-tandoor-500 px-1 text-[10px] font-bold text-white animate-[var(--animate-pop)]">
                    {count > 99 ? "99+" : count}
                  </span>
                ) : null}
              </Link>

              <Link href="/order" className="btn btn-primary btn-sm ml-1 hidden sm:inline-flex md:btn">
                Order Now
              </Link>

              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-800 transition hover:bg-ink-900/5 lg:hidden"
                aria-label="Open menu"
                aria-expanded={open}
                aria-controls="mobile-menu"
              >
                <IconMenu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Site menu">
          <button
            type="button"
            className="absolute inset-0 bg-ink-950/60 animate-[var(--animate-fade-in)]"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <div
            id="mobile-menu"
            className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-paper shadow-[var(--shadow-lift)] animate-[var(--animate-fade-in)]"
          >
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
              <span className="font-display text-lg font-semibold">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-ink-900/5"
                aria-label="Close menu"
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>

            <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-3 py-3">
              <ul className="space-y-0.5">
                {[...NAV, { href: "/order", label: "Order Online" }, { href: "/reserve", label: "Book a Table" }].map(
                  (item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center justify-between rounded-xl px-4 py-3 text-base font-semibold transition ${
                          isActive(item.href) ? "bg-saffron-50 text-saffron-700" : "text-ink-800 hover:bg-ink-900/5"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>

              <div className="mt-5 space-y-2 border-t border-ink-100 pt-5">
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp w-full">
                  <IconWhatsapp className="h-5 w-5" /> Order on WhatsApp
                </a>
                {settings.zomatoUrl ? (
                  <a href={settings.zomatoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-zomato w-full">
                    Order on Zomato
                  </a>
                ) : null}
                {settings.swiggyUrl ? (
                  <a href={settings.swiggyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-swiggy w-full">
                    Order on Swiggy
                  </a>
                ) : null}
                <a href={`tel:${settings.phone}`} className="btn btn-outline w-full">
                  <IconPhone className="h-4 w-4" /> {settings.phone}
                </a>
              </div>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
