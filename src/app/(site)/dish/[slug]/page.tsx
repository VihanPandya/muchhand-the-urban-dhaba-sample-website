import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDishBySlug, getMenu, getRelatedDishes } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { absoluteUrl, breadcrumbJsonLd, JsonLd, pageMetadata } from "@/lib/seo";
import { formatMoney } from "@/lib/money";
import { DishCustomiser } from "@/components/menu/dish-customiser";
import { DishCard } from "@/components/menu/dish-card";
import { OrderChannelsInline } from "@/components/site/order-channels-inline";
import { Breadcrumbs, SpiceMeter, Tag, VegMark } from "@/components/ui";

export const revalidate = 120;

export async function generateStaticParams() {
  const { dishes } = await getMenu();
  return dishes.map((dish) => ({ slug: dish.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [dish, settings] = await Promise.all([getDishBySlug(slug), getSettings()]);
  if (!dish) return { title: "Dish not found" };

  return pageMetadata({
    settings,
    title: dish.name,
    description: dish.description,
    path: `/dish/${dish.slug}`,
    image: dish.imageUrl,
    type: "article",
  });
}

export default async function DishPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dish = await getDishBySlug(slug);
  if (!dish) notFound();

  const related = await getRelatedDishes(dish.categoryId, dish.id);

  return (
    <div className="container-x py-8 md:py-12">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Menu", href: "/menu" },
          { label: dish.categoryName, href: `/menu/${dish.categorySlug}` },
          { label: dish.name },
        ]}
      />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MenuItem",
          name: dish.name,
          description: dish.longDescription || dish.description,
          image: absoluteUrl(dish.imageUrl),
          url: absoluteUrl(`/dish/${dish.slug}`),
          suitableForDiet: dish.isVegan
            ? "https://schema.org/VeganDiet"
            : dish.isVeg
              ? "https://schema.org/VegetarianDiet"
              : undefined,
          offers: {
            "@type": "Offer",
            price: dish.effectivePrice,
            priceCurrency: "INR",
            availability: dish.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          },
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Menu", path: "/menu" },
          { name: dish.categoryName, path: `/menu/${dish.categorySlug}` },
          { name: dish.name, path: `/dish/${dish.slug}` },
        ])}
      />

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] bg-ink-100">
            <Image
              src={dish.imageUrl}
              alt={dish.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              {dish.isBestseller ? <span className="chip bg-saffron-400 text-ink-900">Bestseller</span> : null}
              {dish.isNew ? <span className="chip bg-mint-600 text-white">New</span> : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {dish.ingredients.length ? (
              <div className="card p-5">
                <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-[0.14em] text-ink-500">
                  Ingredients
                </h2>
                <ul className="flex flex-wrap gap-1.5">
                  {dish.ingredients.map((item) => (
                    <li key={item}>
                      <Tag>{item}</Tag>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="card p-5">
              <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-[0.14em] text-ink-500">
                Allergens
              </h2>
              {dish.allergens.length ? (
                <ul className="flex flex-wrap gap-1.5">
                  {dish.allergens.map((item) => (
                    <li key={item}>
                      <Tag tone="tandoor">{item}</Tag>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-500">No declared allergens. Tell us about any allergy when ordering.</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <VegMark isVeg={dish.isVeg} />
            <span className="text-sm font-medium text-ink-500">{dish.isVeg ? "Vegetarian" : "Non-vegetarian"}</span>
            <SpiceMeter level={dish.spiceLevel} className="ml-1" />
            {dish.isJain ? <Tag tone="mint">Jain available</Tag> : null}
            {dish.isVegan ? <Tag tone="mint">Vegan</Tag> : null}
          </div>

          <h1 className="text-3xl leading-tight md:text-4xl">{dish.name}</h1>

          <div className="mt-3 flex flex-wrap items-baseline gap-3">
            <span className="font-display text-3xl font-semibold text-ink-900">{formatMoney(dish.effectivePrice)}</span>
            {dish.discountPrice !== null ? (
              <>
                <span className="text-lg text-ink-400 line-through">{formatMoney(dish.price)}</span>
                <Tag tone="tandoor">Save {formatMoney(dish.price - dish.discountPrice)}</Tag>
              </>
            ) : null}
            {dish.portionSize ? <span className="text-sm text-ink-400">· {dish.portionSize}</span> : null}
          </div>

          <div className="prose-dhaba mt-5">
            <p>{dish.longDescription || dish.description}</p>
          </div>

          <div className="mt-7 card p-5">
            <DishCustomiser dish={dish} />
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
              Prefer a delivery app?
            </p>
            <OrderChannelsInline />
          </div>
        </div>
      </div>

      {related.length ? (
        <section className="mt-16">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-2xl">More from {dish.categoryName}</h2>
            <Link href={`/menu/${dish.categorySlug}`} className="btn btn-outline btn-sm">
              See all
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <DishCard key={item.id} dish={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
