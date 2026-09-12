import type { Metadata } from "next";
import Link from "next/link";
import { getPublicOffers } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { OfferCard } from "@/components/site/offer-card";
import { Breadcrumbs, EmptyState } from "@/components/ui";
import { IconTag } from "@/components/icons";

export const revalidate = 120;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return pageMetadata({
    settings,
    title: "Offers & Coupons",
    description: `Running offers at ${settings.name} — first order discounts, family combos and weekend specials.`,
    path: "/offers",
  });
}

export default async function OffersPage() {
  const offers = await getPublicOffers();

  return (
    <div className="container-x py-10 md:py-14">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Offers" }]} />

      <div className="mb-10 max-w-2xl">
        <p className="eyebrow mb-3">Offers</p>
        <h1 className="text-4xl leading-tight md:text-5xl">Offers running right now</h1>
        <p className="mt-3 text-ink-500 text-pretty md:text-lg">
          These apply to direct orders on this website only — aggregator apps run their own promotions.
        </p>
      </div>

      {offers.length ? (
        <>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>

          <div className="mt-12 card p-6">
            <h2 className="font-display text-lg font-semibold">How to use a coupon</h2>
            <ol className="mt-3 space-y-2 text-sm text-ink-500">
              <li>1. Add dishes to your cart.</li>
              <li>2. Enter the code in the coupon box on the cart or checkout page.</li>
              <li>3. The discount applies instantly — you&apos;ll see it in the bill summary.</li>
            </ol>
            <p className="mt-4 text-xs text-ink-400">
              One coupon per order. Coupons can&apos;t be combined and may be withdrawn at any time.
            </p>
          </div>
        </>
      ) : (
        <EmptyState
          title="No offers running right now"
          description="Nothing active at the moment — we usually add something for weekends and festivals. Check back soon."
          icon={<IconTag className="h-10 w-10" />}
          action={
            <Link href="/menu" className="btn btn-primary">
              Browse the menu
            </Link>
          }
        />
      )}
    </div>
  );
}
