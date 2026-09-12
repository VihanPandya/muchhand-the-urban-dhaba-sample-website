import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { getFeaturedDishes } from "@/lib/queries";
import { OrderChannels } from "@/components/site/order-channels";
import { DishCard } from "@/components/menu/dish-card";
import { Breadcrumbs, SectionHeading } from "@/components/ui";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return pageMetadata({
    settings,
    title: "Order Online",
    description:
      "Order directly from us, or through Zomato, Swiggy and WhatsApp. Delivery and pickup available across Ahmedabad.",
    path: "/order",
  });
}

export default async function OrderPage() {
  const featured = await getFeaturedDishes(4);

  return (
    <div className="container-x py-10 md:py-14">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Order Online" }]} />

      <div className="mb-10 max-w-2xl">
        <p className="eyebrow mb-3">Order online</p>
        <h1 className="text-4xl leading-tight md:text-5xl">How would you like to order?</h1>
        <p className="mt-3 text-ink-500 text-pretty md:text-lg">
          Ordering directly from us is the cheapest for you and the best for us — no aggregator commission, and every
          coupon on this site works. Prefer an app? Those work too.
        </p>
      </div>

      <OrderChannels />

      <section className="mt-16">
        <SectionHeading align="left" eyebrow="Start here" title="Popular right now" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((dish) => (
            <DishCard key={dish.id} dish={dish} />
          ))}
        </div>
        <div className="mt-6">
          <Link href="/menu" className="btn btn-outline">
            See the full menu
          </Link>
        </div>
      </section>

      <section className="mt-16 grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Delivery & pickup",
            body: "We deliver across Gota, Bopal, Thaltej, Science City and Chandkheda. Pickup is ready in about 20 minutes.",
          },
          {
            title: "Payments",
            body: "Cash on delivery and UPI are live. Card and netbanking switch on as soon as the payment gateway keys are added in the admin panel.",
          },
          {
            title: "Something wrong?",
            body: "Message us on WhatsApp with your order number. We remake or refund — no arguments, no forms.",
          },
        ].map((item) => (
          <div key={item.title} className="card p-5">
            <h2 className="font-display text-base font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">{item.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
