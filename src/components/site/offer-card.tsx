"use client";

import Link from "next/link";
import { useState } from "react";
import type { OfferDTO } from "@/lib/queries";
import { formatMoney } from "@/lib/money";
import { useToast } from "@/components/providers/toast";
import { IconCheck, IconTag } from "@/components/icons";

export function OfferCard({ offer }: { offer: OfferDTO }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const headline = offer.type === "PERCENT" ? `${offer.value}% OFF` : `${formatMoney(offer.value)} OFF`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(offer.code);
      setCopied(true);
      toast(`Coupon ${offer.code} copied — apply it at checkout.`, "success");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast(`Use coupon code ${offer.code} at checkout.`, "info");
    }
  };

  return (
    <article className="card relative flex h-full flex-col overflow-hidden p-6">
      <span
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-saffron-100"
        aria-hidden
      />
      <div className="relative">
        {offer.badge ? <span className="chip mb-3 bg-tandoor-500/10 text-tandoor-600">{offer.badge}</span> : null}
        <p className="font-display text-3xl font-semibold text-ink-900">{headline}</p>
        <h3 className="mt-1 text-lg">{offer.title}</h3>
        {offer.description ? <p className="mt-2 text-sm leading-relaxed text-ink-500">{offer.description}</p> : null}
      </div>

      <dl className="relative mt-4 space-y-1 text-xs text-ink-400">
        {offer.minOrderValue > 0 ? (
          <div className="flex gap-1">
            <dt>Minimum order</dt>
            <dd className="font-semibold text-ink-600">{formatMoney(offer.minOrderValue)}</dd>
          </div>
        ) : null}
        {offer.maxDiscount !== null ? (
          <div className="flex gap-1">
            <dt>Maximum discount</dt>
            <dd className="font-semibold text-ink-600">{formatMoney(offer.maxDiscount)}</dd>
          </div>
        ) : null}
        {offer.expiresAt ? (
          <div className="flex gap-1">
            <dt>Valid till</dt>
            <dd className="font-semibold text-ink-600">
              {new Date(offer.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="relative mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-2 rounded-xl border-[1.5px] border-dashed border-saffron-400 bg-saffron-50 px-3.5 py-2 font-mono text-sm font-bold tracking-wider text-saffron-700 transition hover:bg-saffron-100"
          aria-label={`Copy coupon code ${offer.code}`}
        >
          {copied ? <IconCheck className="h-4 w-4" /> : <IconTag className="h-4 w-4" />}
          {offer.code}
        </button>
        <Link href="/menu" className="btn btn-outline btn-sm">
          Use this offer
        </Link>
      </div>
    </article>
  );
}
