import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { WhatsappOrderBuilder } from "@/components/order/whatsapp-order-builder";
import { Breadcrumbs } from "@/components/ui";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return pageMetadata({
    settings,
    title: "Order on WhatsApp",
    description: "Build your order here and we'll write the WhatsApp message for you — items, add-ons and total included.",
    path: "/whatsapp-order",
  });
}

export default function WhatsappOrderPage() {
  return (
    <div className="container-x py-10 md:py-14">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Order Online", href: "/order" }, { label: "WhatsApp" }]}
      />
      <div className="mb-8 max-w-2xl">
        <p className="eyebrow mb-3">WhatsApp ordering</p>
        <h1 className="text-4xl leading-tight md:text-5xl">Send your order on WhatsApp</h1>
        <p className="mt-3 text-ink-500 text-pretty md:text-lg">
          Add dishes to your cart, fill in a couple of details, and we&apos;ll compose the message for you. Nothing is sent
          until you press the button.
        </p>
      </div>
      <WhatsappOrderBuilder />
    </div>
  );
}
