import type { Metadata } from "next";
import Link from "next/link";
import { getMenu } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { JsonLd, menuJsonLd, pageMetadata } from "@/lib/seo";
import { MenuBrowser } from "@/components/menu/menu-browser";
import { OrderChannelsInline } from "@/components/site/order-channels-inline";
import { Breadcrumbs } from "@/components/ui";

export const revalidate = 120;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return pageMetadata({
    settings,
    title: "Menu",
    description:
      "Browse the full menu — tandoor starters, Punjabi mains, Amritsari kulcha, biryani, desserts and drinks. Filter by vegetarian, Jain, vegan or spice level.",
    path: "/menu",
  });
}

export default async function MenuPage() {
  const [{ categories, dishes }, settings] = await Promise.all([getMenu(), getSettings()]);

  return (
    <div className="container-x py-10 md:py-14">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Menu" }]} />

      <JsonLd
        data={menuJsonLd(
          settings,
          categories.map((category) => ({
            name: category.name,
            dishes: dishes
              .filter((d) => d.categorySlug === category.slug)
              .map((d) => ({ name: d.name, description: d.description, price: d.effectivePrice, isVeg: d.isVeg })),
          })),
        )}
      />

      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow mb-3">{dishes.length} dishes · {categories.length} sections</p>
          <h1 className="text-4xl leading-tight md:text-5xl">Our Menu</h1>
          <p className="mt-3 text-ink-500 text-pretty md:text-lg">
            Everything is cooked to order. Tell us how spicy you like it, and we&apos;ll cook it that way.
          </p>
        </div>
        <OrderChannelsInline />
      </div>

      <MenuBrowser categories={categories} dishes={dishes} />

      <div className="mt-14 rounded-[var(--radius-card)] bg-ink-900 px-6 py-10 text-center text-paper md:px-12">
        <h2 className="text-2xl text-paper md:text-3xl">Ready to eat?</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-ink-300">
          Add dishes to your cart and check out in under a minute — or send the whole order to us on WhatsApp.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/cart" className="btn btn-primary">
            Review cart
          </Link>
          <Link href="/whatsapp-order" className="btn btn-ghost-light">
            Order on WhatsApp
          </Link>
        </div>
      </div>
    </div>
  );
}
