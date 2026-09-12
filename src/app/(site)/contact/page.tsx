import type { Metadata } from "next";
import Link from "next/link";
import { getBusinessHours, getSettings, DAY_NAMES, formatTime } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { ContactForm } from "@/components/forms/contact-form";
import { MapEmbed } from "@/components/site/map-embed";
import { ContactChannels } from "@/components/site/contact-channels";
import { Breadcrumbs } from "@/components/ui";
import { IconMail, IconMapPin, IconPhone } from "@/components/icons";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return pageMetadata({
    settings,
    title: "Contact Us",
    description: `Call, WhatsApp or email ${settings.name}. Address, opening hours and directions.`,
    path: "/contact",
  });
}

export default async function ContactPage() {
  const [settings, hours] = await Promise.all([getSettings(), getBusinessHours()]);

  return (
    <div className="container-x py-10 md:py-14">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />

      <div className="mb-10 max-w-2xl">
        <p className="eyebrow mb-3">Contact</p>
        <h1 className="text-4xl leading-tight md:text-5xl">Talk to us</h1>
        <p className="mt-3 text-ink-500 text-pretty md:text-lg">
          Questions about an order, a booking or a large party? The fastest answer is on WhatsApp.
        </p>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
        <div className="space-y-5">
          <div className="card space-y-4 p-6">
            <div className="flex gap-3">
              <IconMapPin className="mt-0.5 h-5 w-5 shrink-0 text-saffron-600" />
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-ink-400">Address</p>
                <p className="mt-0.5 leading-relaxed text-ink-800">{settings.address}</p>
                <Link href="/find-us" className="mt-1 inline-block text-sm font-semibold text-saffron-600 hover:underline">
                  Get directions
                </Link>
              </div>
            </div>

            <div className="flex gap-3">
              <IconPhone className="mt-0.5 h-5 w-5 shrink-0 text-saffron-600" />
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-ink-400">Phone</p>
                <a href={`tel:${settings.phone}`} className="mt-0.5 block font-medium text-ink-800 hover:text-saffron-700">
                  {settings.phone}
                </a>
              </div>
            </div>

            <div className="flex gap-3">
              <IconMail className="mt-0.5 h-5 w-5 shrink-0 text-saffron-600" />
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-ink-400">Email</p>
                <a href={`mailto:${settings.email}`} className="mt-0.5 block break-all font-medium text-ink-800 hover:text-saffron-700">
                  {settings.email}
                </a>
              </div>
            </div>

            <ContactChannels />
          </div>

          <div className="card p-6">
            <h2 className="mb-3 font-display text-base font-semibold">Opening hours</h2>
            <ul className="space-y-1.5 text-sm">
              {hours.map((hour) => (
                <li key={hour.dayOfWeek} className="flex justify-between gap-3 text-ink-600">
                  <span>{DAY_NAMES[hour.dayOfWeek]}</span>
                  <span className="font-medium">
                    {hour.isOpen ? `${formatTime(hour.openTime)} – ${formatTime(hour.closeTime)}` : "Closed"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <MapEmbed
            address={settings.address}
            mapsUrl={settings.mapsUrl}
            embedUrl={settings.mapsEmbedUrl}
            latitude={settings.latitude}
            longitude={settings.longitude}
            className="h-64"
          />
        </div>

        <div>
          <h2 className="mb-4 text-2xl">Send us a message</h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
