import Link from "next/link";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/ui";
import { IconAlert, IconArrowRight, IconCheck } from "@/components/icons";

/**
 * Shared layout for the Zomato and Swiggy landing pages. Both are plain
 * outbound links to the restaurant's official listing — there is no API
 * integration, and we never scrape either platform.
 */
export function AggregatorPage({
  name,
  url,
  accentClass,
  tagline,
  bullets,
  note,
  logo,
}: {
  name: string;
  url: string | null;
  accentClass: string;
  tagline: string;
  bullets: string[];
  note: string;
  logo: ReactNode;
}) {
  return (
    <div className="container-x py-10 md:py-14">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Order Online", href: "/order" }, { label: name }]}
      />

      <div className="grid items-start gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="mb-5">{logo}</div>
          <h1 className="text-4xl leading-tight md:text-5xl">Order on {name}</h1>
          <p className="mt-3 max-w-xl text-ink-500 text-pretty md:text-lg">{tagline}</p>

          <ul className="mt-7 space-y-2.5">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2.5 text-sm text-ink-600">
                <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-mint-600" />
                {bullet}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            {url ? (
              <a href={url} target="_blank" rel="noopener noreferrer" className={`btn btn-lg ${accentClass}`}>
                Open {name} <IconArrowRight className="h-4 w-4" />
              </a>
            ) : (
              <span className="btn btn-outline btn-lg cursor-not-allowed opacity-70">
                {name} link not configured yet
              </span>
            )}
            <Link href="/menu" className="btn btn-outline btn-lg">
              Order directly instead
            </Link>
          </div>

          {!url ? (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-saffron-50 px-4 py-3 text-sm text-saffron-700">
              <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
              The restaurant&apos;s {name} link hasn&apos;t been added yet. An admin can add it under{" "}
              <strong>Admin → Integrations</strong>, and this page will start linking straight through.
            </p>
          ) : null}
        </div>

        <aside className="card p-6">
          <h2 className="font-display text-lg font-semibold">Ordering directly is cheaper</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">{note}</p>
          <div className="mt-5 space-y-2">
            <Link href="/menu" className="btn btn-primary w-full">
              Order directly
            </Link>
            <Link href="/offers" className="btn btn-outline w-full">
              See our offers
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
