import type { Metadata } from "next";
import Link from "next/link";
import { getTestimonials } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { TestimonialGrid } from "@/components/site/testimonials";
import { Breadcrumbs, EmptyState } from "@/components/ui";
import { IconStar } from "@/components/icons";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return pageMetadata({
    settings,
    title: "Reviews",
    description: `What guests say about ${settings.name}.`,
    path: "/reviews",
  });
}

export default async function ReviewsPage() {
  const [testimonials, settings] = await Promise.all([getTestimonials(), getSettings()]);
  const average =
    testimonials.length > 0
      ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
      : null;

  return (
    <div className="container-x py-10 md:py-14">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Reviews" }]} />

      <div className="mb-10 max-w-2xl">
        <p className="eyebrow mb-3">Guest reviews</p>
        <h1 className="text-4xl leading-tight md:text-5xl">What our guests say</h1>
        {average ? (
          <p className="mt-3 flex items-center gap-2 text-ink-500">
            <IconStar className="h-5 w-5 text-saffron-400" />
            <strong className="text-ink-900">{average}</strong> average from {testimonials.length} reviews
          </p>
        ) : null}
      </div>

      {testimonials.length ? (
        <TestimonialGrid testimonials={testimonials} />
      ) : (
        <EmptyState
          title="No reviews yet"
          description="We haven't published any reviews here yet. Order something and tell us what you think — we publish the honest ones too."
          action={
            <Link href="/menu" className="btn btn-primary">
              Browse the menu
            </Link>
          }
        />
      )}

      <div className="mt-14 card p-8 text-center">
        <h2 className="text-2xl">Eaten with us recently?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
          Leave us a review on Google, Zomato or Swiggy — it genuinely helps a small kitchen like ours.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {settings.googleBusinessUrl ? (
            <a href={settings.googleBusinessUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
              Review on Google
            </a>
          ) : null}
          {settings.zomatoUrl ? (
            <a href={settings.zomatoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-zomato">
              Review on Zomato
            </a>
          ) : null}
          {settings.swiggyUrl ? (
            <a href={settings.swiggyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-swiggy">
              Review on Swiggy
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
