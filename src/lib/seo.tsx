import "server-only";
import type { Metadata } from "next";
import type { BusinessHours, RestaurantSettings } from "@prisma/client";
import { DAY_NAMES } from "@/lib/settings";

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function absoluteUrl(path = "/"): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pageMetadata(options: {
  settings: RestaurantSettings;
  title: string;
  description: string;
  path: string;
  image?: string | null;
  type?: "website" | "article";
}): Metadata {
  const { settings, title, description, path } = options;
  const image = options.image || settings.ogImage || "/images/og.webp";
  const url = absoluteUrl(path);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: settings.name,
      type: options.type ?? "website",
      locale: "en_IN",
      images: [{ url: absoluteUrl(image), width: 1200, height: 630, alt: settings.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl(image)],
    },
  };
}

/** schema.org Restaurant markup for rich results. */
export function restaurantJsonLd(settings: RestaurantSettings, hours: BusinessHours[]) {
  const sameAs = [settings.instagramUrl, settings.facebookUrl, settings.zomatoUrl, settings.swiggyUrl, settings.youtubeUrl].filter(
    (value): value is string => Boolean(value),
  );

  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": absoluteUrl("/#restaurant"),
    name: settings.name,
    description: settings.seoDescription || settings.tagline,
    url: siteUrl(),
    telephone: settings.phone,
    email: settings.email || undefined,
    image: absoluteUrl(settings.ogImage || "/images/og.webp"),
    logo: absoluteUrl(settings.logoUrl || "/logo.svg"),
    servesCuisine: settings.cuisines.length ? settings.cuisines : ["North Indian"],
    priceRange: settings.priceRange,
    currenciesAccepted: settings.currency,
    paymentAccepted: [
      settings.codEnabled ? "Cash" : null,
      settings.upiEnabled ? "UPI" : null,
      settings.onlinePaymentEnabled ? "Credit Card" : null,
    ]
      .filter(Boolean)
      .join(", "),
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address,
      addressCountry: "IN",
    },
    geo:
      settings.latitude && settings.longitude
        ? { "@type": "GeoCoordinates", latitude: settings.latitude, longitude: settings.longitude }
        : undefined,
    hasMap: settings.mapsUrl || undefined,
    sameAs,
    openingHoursSpecification: hours
      .filter((h) => h.isOpen)
      .map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${DAY_NAMES[h.dayOfWeek]}`,
        opens: h.openTime,
        closes: h.closeTime,
      })),
    acceptsReservations: true,
    potentialAction: {
      "@type": "OrderAction",
      target: { "@type": "EntryPoint", urlTemplate: absoluteUrl("/order"), inLanguage: "en-IN" },
    },
  };
}

export function menuJsonLd(
  settings: RestaurantSettings,
  categories: { name: string; dishes: { name: string; description: string; price: number; isVeg: boolean }[] }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: `${settings.name} Menu`,
    url: absoluteUrl("/menu"),
    hasMenuSection: categories.map((category) => ({
      "@type": "MenuSection",
      name: category.name,
      hasMenuItem: category.dishes.map((dish) => ({
        "@type": "MenuItem",
        name: dish.name,
        description: dish.description,
        suitableForDiet: dish.isVeg ? "https://schema.org/VegetarianDiet" : undefined,
        offers: { "@type": "Offer", price: dish.price, priceCurrency: "INR" },
      })),
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // Data comes from our own database, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
