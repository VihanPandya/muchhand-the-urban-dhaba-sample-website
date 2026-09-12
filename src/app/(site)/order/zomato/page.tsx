import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { AggregatorPage } from "@/components/site/aggregator-page";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return pageMetadata({
    settings,
    title: "Order on Zomato",
    description: `Order ${settings.name} on Zomato, or order directly from us for the best price.`,
    path: "/order/zomato",
  });
}

export default async function ZomatoPage() {
  const settings = await getSettings();
  return (
    <AggregatorPage
      name="Zomato"
      url={settings.zomatoUrl}
      accentClass="btn-zomato"
      tagline="Our full menu is listed on Zomato with live delivery tracking, Zomato Gold and your saved addresses."
      bullets={[
        "Same kitchen, same recipes, same portions",
        "Use Zomato Gold, credits and pro discounts",
        "Live order tracking inside the Zomato app",
        "Payment handled entirely by Zomato",
      ]}
      note="Aggregators charge a commission on every order, so direct orders let us keep prices lower and give you coupons like FIRST10 and WEEKEND15 that apps don't carry."
      logo={
        <span className="inline-flex items-center gap-2 rounded-full bg-[#e23744]/10 px-4 py-2 text-sm font-bold text-[#e23744]">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#e23744]" aria-hidden />
          Zomato
        </span>
      }
    />
  );
}
