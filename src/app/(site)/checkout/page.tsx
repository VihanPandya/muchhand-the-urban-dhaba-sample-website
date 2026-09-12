import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { CheckoutForm } from "@/components/order/checkout-form";
import { Breadcrumbs } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    ...pageMetadata({
      settings,
      title: "Checkout",
      description: "Complete your order — delivery or pickup, with cash, UPI or online payment.",
      path: "/checkout",
    }),
    robots: { index: false, follow: false },
  };
}

export default function CheckoutPage() {
  return (
    <div className="container-x py-10 md:py-14">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Cart", href: "/cart" }, { label: "Checkout" }]} />
      <h1 className="mb-2 text-3xl md:text-4xl">Checkout</h1>
      <p className="mb-8 text-ink-500">Two minutes and the kitchen gets going.</p>
      <CheckoutForm />
    </div>
  );
}
