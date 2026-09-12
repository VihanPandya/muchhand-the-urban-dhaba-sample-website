import Link from "next/link";
import { notFound } from "next/navigation";
import { NoAccess, requireAdminPage } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { formatMoney, toNumber } from "@/lib/money";
import { AdminCard, StatusBadge, TableWrap, Td, Th } from "@/components/admin/ui";
import { OrderStatusControl } from "@/components/admin/order-status-control";
import { getSettings } from "@/lib/settings";
import { buildCustomerWhatsappLink, renderTemplate } from "@/lib/whatsapp";
import { IconPhone, IconWhatsapp } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order" };

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminPage("orders.view");
  if (!admin) return <NoAccess what="orders" />;
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, customer: true, payments: { orderBy: { createdAt: "desc" } } },
  });
  if (!order) notFound();

  const settings = await getSettings();
  const whatsappHref = buildCustomerWhatsappLink(
    settings.whatsappCountryCode,
    order.phone,
    renderTemplate(
      "Hello {{name}}, this is {{restaurant}} about your order {{order_number}} ({{total}}).",
      {
        name: order.customerName,
        restaurant: settings.name,
        order_number: order.orderNumber,
        total: formatMoney(order.total),
      },
    ),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/orders" className="text-sm text-ink-400 transition hover:text-saffron-700">
            ← Back to orders
          </Link>
          <h1 className="mt-1 font-display text-2xl font-semibold">{order.orderNumber}</h1>
          <p className="text-sm text-ink-500">
            {order.createdAt.toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })} · {order.source.toLowerCase()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          <StatusBadge status={order.paymentStatus} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <AdminCard title="Items">
            <TableWrap>
              <thead>
                <tr>
                  <Th>Dish</Th>
                  <Th>Qty</Th>
                  <Th>Unit</Th>
                  <Th className="text-right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <Td>
                      <span className="block font-medium text-ink-900">{item.dishName}</span>
                      {item.variantName ? <span className="block text-xs text-ink-400">{item.variantName}</span> : null}
                      {Array.isArray(item.addOns) && item.addOns.length ? (
                        <span className="block text-xs text-ink-400">
                          + {(item.addOns as { name: string }[]).map((a) => a.name).join(", ")}
                        </span>
                      ) : null}
                      {item.notes ? <span className="block text-xs italic text-ink-400">“{item.notes}”</span> : null}
                    </Td>
                    <Td>{item.quantity}</Td>
                    <Td>{formatMoney(item.unitPrice)}</Td>
                    <Td className="text-right font-semibold">{formatMoney(item.lineTotal)}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>

            <dl className="mt-4 space-y-2 border-t border-ink-100 pt-4 text-sm">
              <Row label="Item total" value={formatMoney(order.subtotal)} />
              {toNumber(order.discountAmount) > 0 ? (
                <Row label={`Discount${order.couponCode ? ` · ${order.couponCode}` : ""}`} value={`− ${formatMoney(order.discountAmount)}`} />
              ) : null}
              <Row label="Taxes" value={formatMoney(order.taxAmount)} />
              <Row label="Delivery fee" value={formatMoney(order.deliveryFee)} />
              <div className="flex items-baseline justify-between border-t border-ink-100 pt-3">
                <dt className="font-display text-base font-semibold">Total</dt>
                <dd className="font-display text-xl font-semibold">{formatMoney(order.total)}</dd>
              </div>
            </dl>
          </AdminCard>

          {order.notes ? (
            <AdminCard title="Customer notes">
              <p className="text-sm text-ink-600">{order.notes}</p>
            </AdminCard>
          ) : null}

          <AdminCard title="Payments">
            {order.payments.length === 0 ? (
              <p className="text-sm text-ink-400">No payment records.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {order.payments.map((payment) => (
                  <li key={payment.id} className="flex items-center justify-between rounded-xl border border-ink-100 px-4 py-3">
                    <span>
                      <span className="block font-medium">{payment.provider}</span>
                      <span className="text-xs text-ink-400">
                        {payment.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                        {payment.reference ? ` · ${payment.reference}` : ""}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="font-semibold">{formatMoney(payment.amount)}</span>
                      <StatusBadge status={payment.status} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        </div>

        <div className="space-y-5">
          {admin.permissions.includes("orders.update") ? (
            <AdminCard title="Update status">
              <OrderStatusControl
                orderId={order.id}
                status={order.status}
                paymentStatus={order.paymentStatus}
                orderType={order.type}
              />
            </AdminCard>
          ) : null}

          <AdminCard title="Customer">
            <dl className="space-y-3 text-sm">
              <Detail label="Name" value={order.customerName} />
              <Detail label="Phone" value={order.phone} href={`tel:${order.phone}`} />
              {order.email ? <Detail label="Email" value={order.email} href={`mailto:${order.email}`} /> : null}
              <Detail label="Order type" value={order.type === "DELIVERY" ? "Delivery" : "Pickup"} />
              {order.addressLine ? (
                <Detail label="Address" value={[order.addressLine, order.landmark, order.pincode].filter(Boolean).join(", ")} />
              ) : null}
              {order.customer ? (
                <Detail
                  label="History"
                  value={`${order.customer.ordersCount} orders · ${formatMoney(order.customer.totalSpend)} lifetime`}
                />
              ) : null}
            </dl>
            <div className="mt-4 space-y-2">
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-whatsapp w-full">
                <IconWhatsapp className="h-4 w-4" /> Message the customer
              </a>
              <a href={`tel:${order.phone}`} className="btn btn-sm btn-outline w-full">
                <IconPhone className="h-4 w-4" /> Call {order.phone}
              </a>
              {order.customer ? (
                <Link href="/admin/customers" className="btn btn-sm btn-outline w-full">
                  Open customer list
                </Link>
              ) : null}
            </div>
          </AdminCard>
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

function Detail({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.12em] text-ink-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink-800">
        {href ? (
          <a href={href} className="hover:text-saffron-700">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
