import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { CartView } from "@/components/order/cart-view";
import { Breadcrumbs } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    ...pageMetadata({ settings, title: "Your cart", description: "Review your order before checkout.", path: "/cart" }),
    robots: { index: false, follow: true },
  };
}

export default function CartPage() {
  return (
    <div className="container-x py-10 md:py-14">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Menu", href: "/menu" }, { label: "Cart" }]} />
      <h1 className="mb-8 text-3xl md:text-4xl">Your order</h1>
      <CartView />
    </div>
  );
}
