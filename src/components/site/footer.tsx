import Image from "next/image";
import Link from "next/link";
import type { PublicSettings } from "@/lib/settings";
import { DAY_NAMES, formatTime } from "@/lib/settings";
import { buildWhatsappLink, renderTemplate } from "@/lib/whatsapp";
import { IconFacebook, IconGoogle, IconInstagram, IconMail, IconMapPin, IconPhone, IconWhatsapp } from "@/components/icons";

type Hours = { dayOfWeek: number; isOpen: boolean; openTime: string; closeTime: string }[];

export function SiteFooter({ settings, hours }: { settings: PublicSettings; hours: Hours }) {
  const whatsappHref = buildWhatsappLink(
    settings.whatsappCountryCode,
    settings.whatsappNumber,
    renderTemplate(settings.whatsappDefaultMessage, { restaurant_name: settings.name }),
  );
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-20 bg-ink-900 text-ink-200">
      <div className="hairline-gold" aria-hidden />
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5 lg:gap-8">
        <div className="lg:col-span-1">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src={settings.logoUrl || "/logo.svg"} alt="" width={44} height={44} className="h-11 w-11 rounded-full" />
            <span className="flex flex-col leading-none">
              <span className="font-display text-lg font-semibold text-paper">Muchhad</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-saffron-400">
                The Urban Dhaba
              </span>
            </span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-ink-300">{settings.tagline}</p>
          <div className="mt-5 flex items-center gap-2">
            {settings.instagramUrl ? (
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/8 transition hover:bg-saffron-400 hover:text-ink-900"
                aria-label="Instagram"
              >
                <IconInstagram className="h-[18px] w-[18px]" />
              </a>
            ) : null}
            {settings.facebookUrl ? (
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/8 transition hover:bg-saffron-400 hover:text-ink-900"
                aria-label="Facebook"
              >
                <IconFacebook className="h-[18px] w-[18px]" />
              </a>
            ) : null}
            {settings.googleBusinessUrl ? (
              <a
                href={settings.googleBusinessUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/8 transition hover:bg-saffron-400 hover:text-ink-900"
                aria-label="Google Business profile"
              >
                <IconGoogle className="h-[18px] w-[18px]" />
              </a>
            ) : null}
          </div>
        </div>

        <FooterColumn
          title="Restaurant"
          links={[
            { href: "/about", label: "About" },
            { href: "/menu", label: "Menu" },
            { href: "/gallery", label: "Gallery" },
            { href: "/contact", label: "Contact" },
          ]}
        />

        <FooterColumn
          title="Quick Links"
          links={[
            { href: "/order", label: "Order Online" },
            { href: "/offers", label: "Offers" },
            { href: "/reserve", label: "Reservations" },
            { href: "/reviews", label: "Reviews" },
          ]}
        />

        <div>
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.16em] text-paper">Order</h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              {settings.zomatoUrl ? (
                <a href={settings.zomatoUrl} target="_blank" rel="noopener noreferrer" className="transition hover:text-saffron-300">
                  Order on Zomato
                </a>
              ) : (
                <Link href="/order/zomato" className="transition hover:text-saffron-300">
                  Zomato
                </Link>
              )}
            </li>
            <li>
              {settings.swiggyUrl ? (
                <a href={settings.swiggyUrl} target="_blank" rel="noopener noreferrer" className="transition hover:text-saffron-300">
                  Order on Swiggy
                </a>
              ) : (
                <Link href="/order/swiggy" className="transition hover:text-saffron-300">
                  Swiggy
                </Link>
              )}
            </li>
            <li>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="transition hover:text-saffron-300">
                Order on WhatsApp
              </a>
            </li>
            <li>
              <Link href="/menu" className="transition hover:text-saffron-300">
                Direct Order
              </Link>
            </li>
          </ul>

          <h3 className="mb-3 mt-7 font-display text-sm font-semibold uppercase tracking-[0.16em] text-paper">Hours</h3>
          <ul className="space-y-1 text-xs text-ink-300">
            {hours.map((hour) => (
              <li key={hour.dayOfWeek} className="flex justify-between gap-3">
                <span>{DAY_NAMES[hour.dayOfWeek]?.slice(0, 3)}</span>
                <span>{hour.isOpen ? `${formatTime(hour.openTime)} – ${formatTime(hour.closeTime)}` : "Closed"}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.16em] text-paper">Contact</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2.5">
              <IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-saffron-400" />
              <span className="leading-relaxed">{settings.address}</span>
            </li>
            <li className="flex gap-2.5">
              <IconPhone className="mt-0.5 h-4 w-4 shrink-0 text-saffron-400" />
              <a href={`tel:${settings.phone}`} className="transition hover:text-saffron-300">
                {settings.phone}
              </a>
            </li>
            <li className="flex gap-2.5">
              <IconWhatsapp className="mt-0.5 h-4 w-4 shrink-0 text-saffron-400" />
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="transition hover:text-saffron-300">
                WhatsApp us
              </a>
            </li>
            <li className="flex gap-2.5">
              <IconMail className="mt-0.5 h-4 w-4 shrink-0 text-saffron-400" />
              <a href={`mailto:${settings.email}`} className="break-all transition hover:text-saffron-300">
                {settings.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/8">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-xs text-ink-400 md:flex-row">
          <p>
            © {year} {settings.name}. All rights reserved.
          </p>
          <p className="flex items-center gap-3">
            <Link href="/find-us" className="transition hover:text-saffron-300">
              Find Us
            </Link>
            <span aria-hidden>·</span>
            <Link href="/contact" className="transition hover:text-saffron-300">
              Support
            </Link>
            <span aria-hidden>·</span>
            <Link href="/admin" className="transition hover:text-saffron-300">
              Admin
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.16em] text-paper">{title}</h3>
      <ul className="space-y-2.5 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="transition hover:text-saffron-300">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
