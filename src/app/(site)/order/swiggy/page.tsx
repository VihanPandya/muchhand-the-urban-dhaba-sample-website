import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { AggregatorPage } from "@/components/site/aggregator-page";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return pageMetadata({
    settings,
    title: "Order on Swiggy",
    description: `Order ${settings.name} on Swiggy, or order directly from us for the best price.`,
    path: "/order/swiggy",
  });
}

export default async function SwiggyPage() {
  const settings = await getSettings();
  return (
    <AggregatorPage
      name="Swiggy"
      url={settings.swiggyUrl}
      accentClass="btn-swiggy"
      tagline="Find us on Swiggy with live tracking, Swiggy One benefits and instant refunds handled by the platform."
      bullets={[
        "Same kitchen, same recipes, same portions",
        "Swiggy One free delivery applies",
        "Live rider tracking in the Swiggy app",
        "Payment and support handled by Swiggy",
      ]}
      note="Ordering direct means no aggregator commission — we pass that back to you through coupons, larger portions on thalis and free delivery over ₹799."
      logo={
        <span className="inline-flex items-center gap-2 rounded-full bg-[#fc8019]/12 px-4 py-2 text-sm font-bold text-[#d9660c]">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#fc8019]" aria-hidden />
          Swiggy
        </span>
      }
    />
  );
}
