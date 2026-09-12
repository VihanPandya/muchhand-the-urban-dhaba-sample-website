import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMoney, toNumber } from "@/lib/money";
import { getSettings } from "@/lib/settings";
import { OrderStatusTracker } from "@/components/order/order-status-tracker";
import { Breadcrumbs } from "@/components/ui";
import { IconCheck, IconPhone, IconWhatsapp } from "@/components/icons";
import { buildWhatsappLink, renderTemplate } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order status",
  robots: { index: false, follow: false },
};

export default async function OrderStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const { orderNumber } = await params;
  const { placed } = await searchParams;

  const [order, settings] = await Promise.all([
    prisma.order.findUnique({ where: { orderNumber }, include: { items: true } }),
    getSettings(),
  ]);
  if (!order) notFound();

  const justPlaced = placed === "1";
  const whatsappHref = buildWhatsappLink(
    settings.whatsappCountryCode,
    settings.whatsappNumber,
    renderTemplate("Hi {{restaurant_name}}, I'd like to check on my order {{order_number}}.", {
      restaurant_name: settings.name,
      order_number: order.orderNumber,
    }),
  );

  return (
    <div className="container-x py-10 md:py-14">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: `Order ${order.orderNumber}` }]} />

      {justPlaced ? (
        <div className="card mb-8 flex items-start gap-4 border-mint-500/30 bg-mint-500/8 p-6">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mint-600 text-white">
            <IconCheck className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl">Order confirmed — thank you!</h1>
            <p className="mt-1 text-sm text-ink-600">
              We&apos;ve sent your order to the kitchen. Save this page to follow its progress, or ask us anything on
              WhatsApp.
            </p>
          </div>
        </div>
      ) : (
        <h1 className="mb-6 text-3xl md:text-4xl">Order {order.orderNumber}</h1>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <OrderStatusTracker orderNumber={order.orderNumber} initialStatus={order.status} orderType={order.type} />

          <div className="card p-5 md:p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">What you ordered</h2>
            <ul className="divide-y divide-ink-100">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                  <span>
                    <span className="block font-medium text-ink-800">
                      {item.quantity} × {item.dishName}
                    </span>
                    {item.variantName ? <span className="block text-xs text-ink-400">{item.variantName}</span> : null}
                    {Array.isArray(item.addOns) && item.addOns.length ? (
                      <span className="block text-xs text-ink-400">
                        {(item.addOns as { name: string }[]).map((a) => a.name).join(", ")}
                      </span>
                    ) : null}
                    {item.notes ? <span className="block text-xs italic text-ink-400">“{item.notes}”</span> : null}
                  </span>
                  <span className="shrink-0 font-semibold">{formatMoney(item.lineTotal)}</span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 border-t border-ink-100 pt-4 text-sm">
              <Row label="Item total" value={formatMoney(order.subtotal)} />
              {toNumber(order.discountAmount) > 0 ? (
                <Row label={`Discount${order.couponCode ? ` · ${order.couponCode}` : ""}`} value={`− ${formatMoney(order.discountAmount)}`} />
              ) : null}
              <Row label="Taxes" value={formatMoney(order.taxAmount)} />
              {order.type === "DELIVERY" ? (
                <Row label="Delivery fee" value={toNumber(order.deliveryFee) === 0 ? "FREE" : formatMoney(order.deliveryFee)} />
              ) : null}
              <div className="flex items-baseline justify-between border-t border-ink-100 pt-3">
                <dt className="font-display text-base font-semibold">Total</dt>
                <dd className="font-display text-xl font-semibold">{formatMoney(order.total)}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5 md:p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">Order details</h2>
            <dl className="space-y-3 text-sm">
              <Detail label="Order number" value={order.orderNumber} mono />
              <Detail label="Placed on" value={order.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} />
              <Detail label="Order type" value={order.type === "DELIVERY" ? "Delivery" : "Pickup"} />
              <Detail label="Payment" value={`${order.paymentMethod} · ${order.paymentStatus.toLowerCase()}`} />
              <Detail label="Name" value={order.customerName} />
              <Detail label="Phone" value={order.phone} />
              {order.addressLine ? (
                <Detail label="Address" value={[order.addressLine, order.landmark, order.pincode].filter(Boolean).join(", ")} />
              ) : null}
              {order.notes ? <Detail label="Notes" value={order.notes} /> : null}
            </dl>
          </div>

          <div className="card space-y-2 p-5">
            <h2 className="mb-2 font-display text-base font-semibold">Need to change something?</h2>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp w-full">
              <IconWhatsapp className="h-5 w-5" /> Message us
            </a>
            <a href={`tel:${settings.phone}`} className="btn btn-outline w-full">
              <IconPhone className="h-4 w-4" /> {settings.phone}
            </a>
            <Link href="/menu" className="btn btn-dark w-full">
              Order something else
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-semibold text-ink-800">{value}</dd>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.12em] text-ink-400">{label}</dt>
      <dd className={`mt-0.5 font-medium text-ink-800 ${mono ? "font-mono text-sm" : ""}`}>{value}</dd>
    </div>
  );
}
