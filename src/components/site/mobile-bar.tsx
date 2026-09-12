"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/providers/cart";
import { useSite } from "@/components/providers/site";
import { buildWhatsappLink, renderTemplate } from "@/lib/whatsapp";
import { IconBook, IconCart, IconHome, IconScooter, IconWhatsapp } from "@/components/icons";

/** Thumb-reachable action bar — the primary navigation on phones. */
export function MobileActionBar() {
  const pathname = usePathname();
  const { count } = useCart();
  const { settings } = useSite();

  if (pathname.startsWith("/admin")) return null;

  const whatsappHref = buildWhatsappLink(
    settings.whatsappCountryCode,
    settings.whatsappNumber,
    renderTemplate(settings.whatsappDefaultMessage, { restaurant_name: settings.name }),
  );

  const item = (active: boolean) =>
    `flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold transition ${
      active ? "text-saffron-600" : "text-ink-500"
    }`;

  return (
    <nav
      aria-label="Quick actions"
      className="safe-bottom fixed inset-x-0 bottom-0 z-50 flex border-t border-ink-100 bg-paper/96 backdrop-blur-md lg:hidden"
    >
      <Link href="/" className={item(pathname === "/")}>
        <IconHome className="h-5 w-5" />
        Home
      </Link>
      <Link href="/menu" className={item(pathname.startsWith("/menu"))}>
        <IconBook className="h-5 w-5" />
        Menu
      </Link>
      <Link href="/cart" className={item(pathname.startsWith("/cart"))}>
        <span className="relative">
          <IconCart className="h-5 w-5" />
          {count > 0 ? (
            <span className="absolute -right-2 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-tandoor-500 px-1 text-[9px] font-bold text-white">
              {count > 99 ? "99+" : count}
            </span>
          ) : null}
        </span>
        Cart
      </Link>
      <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={item(false)}>
        <IconWhatsapp className="h-5 w-5 text-[#1c8c4c]" />
        WhatsApp
      </a>
      <Link href="/order" className={item(pathname.startsWith("/order"))}>
        <IconScooter className="h-5 w-5" />
        Order
      </Link>
    </nav>
  );
}
