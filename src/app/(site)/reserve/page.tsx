import type { Metadata } from "next";
import Image from "next/image";
import { getBusinessHours, getSettings, DAY_NAMES, formatTime } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { ReservationForm } from "@/components/forms/reservation-form";
import { Breadcrumbs } from "@/components/ui";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return pageMetadata({
    settings,
    title: "Book a Table",
    description: `Reserve a table at ${settings.name}. Confirmed on WhatsApp within minutes.`,
    path: "/reserve",
  });
}

export default async function ReservePage() {
  const [settings, hours] = await Promise.all([getSettings(), getBusinessHours()]);

  return (
    <div className="container-x py-10 md:py-14">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Book a Table" }]} />

      <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
        <div>
          <p className="eyebrow mb-3">Reservations</p>
          <h1 className="text-4xl leading-tight md:text-5xl">Book your table</h1>
          <p className="mt-3 max-w-xl text-ink-500 text-pretty md:text-lg">
            Tell us when you&apos;re coming and how many you are. We&apos;ll confirm on WhatsApp — usually within fifteen
            minutes.
          </p>

          <div className="mt-8">
            <ReservationForm />
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-28">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)]">
            <Image
              src="/images/about-dining.webp"
              alt="Our dining room"
              fill
              sizes="(max-width: 1024px) 100vw, 380px"
              className="object-cover"
            />
          </div>

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
            <h2 className="mb-2 font-display text-base font-semibold">Good to know</h2>
            <ul className="space-y-2 text-sm leading-relaxed text-ink-500">
              <li>Tables are held for 15 minutes past the booking time.</li>
              <li>Weekends fill up after 7:30pm — book ahead.</li>
              <li>Jain, vegan and no-onion-no-garlic requests are welcome; tell us in the notes.</li>
              <li>Parties above 20: call {settings.phone}.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
