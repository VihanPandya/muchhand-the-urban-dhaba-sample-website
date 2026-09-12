import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getMenu } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { breadcrumbJsonLd, JsonLd, pageMetadata } from "@/lib/seo";
import { MenuBrowser } from "@/components/menu/menu-browser";
import { Breadcrumbs } from "@/components/ui";

export const revalidate = 120;

export async function generateStaticParams() {
  const { categories } = await getMenu();
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const [{ categories }, settings] = await Promise.all([getMenu(), getSettings()]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) return { title: "Category not found" };

  return pageMetadata({
    settings,
    title: category.name,
    description: category.description || `${category.name} at ${settings.name}. ${category.dishCount} dishes to order online.`,
    path: `/menu/${category.slug}`,
    image: category.imageUrl,
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const { categories, dishes } = await getMenu();
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  return (
    <div>
      <div className="relative isolate overflow-hidden bg-ink-900">
        <Image src={category.imageUrl} alt="" fill sizes="100vw" className="object-cover opacity-55" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/95 to-ink-950/45" aria-hidden />
        <div className="container-x relative py-16 md:py-20">
          <p className="eyebrow mb-3 text-saffron-300">{category.dishCount} dishes</p>
          <h1 className="max-w-2xl text-4xl text-paper text-balance md:text-5xl">{category.name}</h1>
          {category.description ? (
            <p className="mt-3 max-w-xl text-ink-200 text-pretty md:text-lg">{category.description}</p>
          ) : null}
        </div>
      </div>

      <div className="container-x py-10 md:py-14">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Menu", href: "/menu" }, { label: category.name }]}
        />
        <JsonLd
          data={breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Menu", path: "/menu" },
            { name: category.name, path: `/menu/${category.slug}` },
          ])}
        />
        <MenuBrowser categories={categories} dishes={dishes} initialCategory={category.slug} />
      </div>
    </div>
  );
}
