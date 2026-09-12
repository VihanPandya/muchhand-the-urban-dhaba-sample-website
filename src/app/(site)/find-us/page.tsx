import type { Metadata } from "next";
import Link from "next/link";
import { getBusinessHours, getSettings, DAY_NAMES, formatTime } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { MapEmbed } from "@/components/site/map-embed";
import { ContactChannels } from "@/components/site/contact-channels";
import { Breadcrumbs } from "@/components/ui";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return pageMetadata({
    settings,
    title: "Find Us",
    description: `Directions, parking and opening hours for ${settings.name}, ${settings.address}.`,
    path: "/find-us",
  });
}

export default async function FindUsPage() {
  const [settings, hours] = await Promise.all([getSettings(), getBusinessHours()]);

  return (
    <div className="container-x py-10 md:py-14">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Find Us" }]} />

      <div className="mb-8 max-w-2xl">
        <p className="eyebrow mb-3">Location</p>
        <h1 className="text-4xl leading-tight md:text-5xl">Find us</h1>
        <p className="mt-3 text-ink-500 text-pretty md:text-lg">{settings.address}</p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        <MapEmbed
          address={settings.address}
          mapsUrl={settings.mapsUrl}
          embedUrl={settings.mapsEmbedUrl}
          latitude={settings.latitude}
          longitude={settings.longitude}
          className="h-[420px]"
        />

        <div className="space-y-4">
          <div className="card p-5">
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

          <div className="card p-5">
            <h2 className="mb-2 font-display text-base font-semibold">Getting here</h2>
            <ul className="space-y-2 text-sm leading-relaxed text-ink-500">
              <li>Free parking for cars and two-wheelers in front of the building.</li>
              <li>Nearest landmark: opposite the Jaguar showroom on SG Highway service road.</li>
              <li>Wheelchair accessible entrance at street level.</li>
              <li>Family seating on the upper floor.</li>
            </ul>
          </div>

          <div className="card p-5">
            <ContactChannels />
          </div>

          <Link href="/reserve" className="btn btn-primary w-full">
            Book a table
          </Link>
        </div>
      </div>
    </div>
  );
}
