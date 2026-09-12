import type { MetadataRoute } from "next";
import { getMenu } from "@/lib/queries";
import { siteUrl } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const { categories, dishes } = await getMenu();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/menu`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/order`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/offers`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/reserve`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/gallery`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/reviews`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/find-us`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/whatsapp-order`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/order/zomato`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/order/swiggy`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  return [
    ...staticPages,
    ...categories.map((category) => ({
      url: `${base}/menu/${category.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...dishes.map((dish) => ({
      url: `${base}/dish/${dish.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
