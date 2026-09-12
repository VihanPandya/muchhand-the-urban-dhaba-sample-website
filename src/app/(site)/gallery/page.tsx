import type { Metadata } from "next";
import { getGallery } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { GalleryGrid } from "@/components/site/gallery-grid";
import { Breadcrumbs } from "@/components/ui";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return pageMetadata({
    settings,
    title: "Gallery",
    description: `Food, kitchen and ambience at ${settings.name}.`,
    path: "/gallery",
  });
}

export default async function GalleryPage() {
  const images = await getGallery();

  return (
    <div className="container-x py-10 md:py-14">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Gallery" }]} />
      <div className="mb-8 max-w-2xl">
        <p className="eyebrow mb-3">Gallery</p>
        <h1 className="text-4xl leading-tight md:text-5xl">Inside the dhaba</h1>
        <p className="mt-3 text-ink-500 text-pretty md:text-lg">
          The food, the tandoor, the room and the evenings we&apos;ve hosted.
        </p>
      </div>
      <GalleryGrid images={images} />
    </div>
  );
}
