"use client";

import Link from "next/link";
import { useSite } from "@/components/providers/site";
import { IconClock } from "@/components/icons";

/**
 * Restaurant-closed mode: ordering is paused but the menu, gallery and the
 * aggregator links stay available.
 */
export function ClosedBanner() {
  const { settings, status } = useSite();
  if (status.isOpen) return null;

  return (
    <div className="border-b border-tandoor-500/20 bg-tandoor-500/8">
      <div className="container-x flex flex-col items-start gap-3 py-3 text-sm md:flex-row md:items-center md:justify-between">
        <p className="flex items-start gap-2 text-tandoor-700">
          <IconClock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong className="font-semibold">We&apos;re currently closed.</strong>{" "}
            {status.nextOpenLabel ? `Online ordering reopens ${status.nextOpenLabel}.` : status.message}{" "}
            You can still browse the menu and book a table.
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/menu" className="btn btn-outline btn-sm">
            View Menu
          </Link>
          {settings.zomatoUrl ? (
            <a href={settings.zomatoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-zomato btn-sm">
              Zomato
            </a>
          ) : null}
          {settings.swiggyUrl ? (
            <a href={settings.swiggyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-swiggy btn-sm">
              Swiggy
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
