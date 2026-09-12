"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/providers/cart";
import { useSite } from "@/components/providers/site";
import { useToast } from "@/components/providers/toast";
import { usePersistedState } from "@/lib/use-persisted-state";
import { formatMoney } from "@/lib/money";
import { OrderSummary, useOrderTotals } from "@/components/order/order-summary";
import { CouponField, useAppliedCoupon } from "@/components/order/coupon-field";
import { OrderTypeToggle } from "@/components/order/order-type-toggle";
import { EmptyState, VegMark } from "@/components/ui";
import { IconAlert, IconCart, IconWhatsapp } from "@/components/icons";
import { buildWhatsappLink, formatItemsForWhatsapp, renderTemplate, DEFAULT_ORDER_TEMPLATE } from "@/lib/whatsapp";

type PaymentMethod = "COD" | "UPI" | "ONLINE";
type FieldErrors = Record<string, string>;

export function CheckoutForm() {
  const router = useRouter();
  const { lines, subtotal, clear, hydrated } = useCart();
  const { settings, status } = useSite();
  const { toast } = useToast();

  const [orderType, setOrderType] = usePersistedState<"DELIVERY" | "PICKUP">(
    "mud_order_type",
    settings.deliveryEnabled ? "DELIVERY" : "PICKUP",
  );
  const [form, setForm] = usePersistedState("mud_checkout", {
    customerName: "",
    phone: "",
    email: "",
    addressLine: "",
    landmark: "",
    pincode: "",
    notes: "",
  });
  const paymentOptions: { key: PaymentMethod; label: string; hint: string; enabled: boolean }[] = [
    { key: "COD", label: "Cash on Delivery", hint: "Pay when the food arrives", enabled: settings.codEnabled },
    { key: "UPI", label: "UPI", hint: settings.upiId ? `Pay to ${settings.upiId}` : "Pay by UPI", enabled: settings.upiEnabled },
    { key: "ONLINE", label: "Online payment", hint: "Card / netbanking", enabled: settings.onlinePaymentEnabled },
  ];
  const firstEnabled = paymentOptions.find((option) => option.enabled)?.key ?? "COD";
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(firstEnabled);

  const { coupon, apply: applyCoupon, clear: clearCoupon } = useAppliedCoupon(subtotal, form.phone);
  const totals = useOrderTotals(lines, orderType, coupon);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: event.target.value });

  if (!hydrated) {
    return <div className="skeleton h-80 w-full" />;
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        title="There's nothing to check out"
        description="Your cart is empty. Add a few dishes and we'll get the tandoor going."
        icon={<IconCart className="h-10 w-10" />}
        action={
          <Link href="/menu" className="btn btn-primary">
            Browse the menu
          </Link>
        }
      />
    );
  }

  const whatsappHref = buildWhatsappLink(
    settings.whatsappCountryCode,
    settings.whatsappNumber,
    renderTemplate(settings.whatsappOrderTemplate || DEFAULT_ORDER_TEMPLATE, {
      restaurant_name: settings.name,
      customer_name: form.customerName,
      items: formatItemsForWhatsapp(
        lines.map((l) => ({
          name: l.name,
          quantity: l.quantity,
          variantName: l.variantName,
          addOns: l.addOns,
          notes: l.notes,
        })),
      ),
      total: formatMoney(totals.total),
      order_type: orderType === "DELIVERY" ? "Delivery" : "Pickup",
      address: orderType === "DELIVERY" ? [form.addressLine, form.landmark, form.pincode].filter(Boolean).join(", ") : "Pickup",
      phone: form.phone,
      order_number: "",
    }),
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    if (!status.isOpen) {
      setFormError(
        status.nextOpenLabel
          ? `We're closed right now — online ordering reopens ${status.nextOpenLabel}. You can still send this order on WhatsApp.`
          : "We're closed right now. You can still send this order on WhatsApp.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName,
          phone: form.phone,
          email: form.email || undefined,
          type: orderType,
          addressLine: orderType === "DELIVERY" ? form.addressLine : undefined,
          landmark: orderType === "DELIVERY" ? form.landmark : undefined,
          pincode: orderType === "DELIVERY" ? form.pincode : undefined,
          notes: form.notes || undefined,
          couponCode: coupon?.code,
          paymentMethod,
          items: lines.map((line) => ({
            dishId: line.dishId,
            variantId: line.variantId,
            addOnIds: line.addOns.map((a) => a.id),
            quantity: line.quantity,
            notes: line.notes,
          })),
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        if (payload.fieldErrors) setErrors(payload.fieldErrors);
        setFormError(payload.error ?? "We couldn't place that order. Please try again.");
        return;
      }

      clear();
      clearCoupon();
      toast("Order placed! We're firing up the tandoor.", "success");
      router.push(`/order-status/${payload.data.orderNumber}?placed=1`);
    } catch {
      setFormError("We couldn't reach the kitchen. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-5">
        <OrderTypeToggle value={orderType} onChange={setOrderType} />

        <fieldset className="card space-y-4 p-5 md:p-6">
          <legend className="sr-only">Customer information</legend>
          <h2 className="font-display text-lg font-semibold">Your details</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="customerName"
              label="Full name"
              required
              value={form.customerName}
              onChange={update("customerName")}
              error={errors.customerName}
              autoComplete="name"
              placeholder="Rahul Mehta"
            />
            <Field
              id="phone"
              label="Mobile number"
              required
              value={form.phone}
              onChange={update("phone")}
              error={errors.phone}
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel-national"
              placeholder="98250 12345"
            />
          </div>

          <Field
            id="email"
            label="Email"
            hint="optional — for your receipt"
            type="email"
            value={form.email}
            onChange={update("email")}
            error={errors.email}
            autoComplete="email"
            placeholder="you@example.com"
          />

          {orderType === "DELIVERY" ? (
            <>
              <Field
                id="addressLine"
                label="Delivery address"
                required
                value={form.addressLine}
                onChange={update("addressLine")}
                error={errors.addressLine}
                autoComplete="street-address"
                placeholder="Flat / house, building, street, area"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="landmark"
                  label="Landmark"
                  hint="optional"
                  value={form.landmark}
                  onChange={update("landmark")}
                  error={errors.landmark}
                  placeholder="Near Jaguar showroom"
                />
                <Field
                  id="pincode"
                  label="Pincode"
                  required
                  value={form.pincode}
                  onChange={update("pincode")}
                  error={errors.pincode}
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="postal-code"
                  placeholder="382481"
                />
              </div>
            </>
          ) : (
            <p className="rounded-xl bg-saffron-50 px-4 py-3 text-sm text-saffron-700">
              Pickup from <strong>{settings.address}</strong>. We&apos;ll message you when it&apos;s ready.
            </p>
          )}

          <div>
            <label className="label" htmlFor="notes">
              Notes for the kitchen <span className="font-normal text-ink-400">(optional)</span>
            </label>
            <textarea
              id="notes"
              className="field min-h-20"
              maxLength={300}
              value={form.notes}
              onChange={update("notes")}
              placeholder="Ring the bell twice, less spicy overall, extra napkins…"
            />
          </div>
        </fieldset>

        <fieldset className="card space-y-3 p-5 md:p-6">
          <legend className="sr-only">Payment method</legend>
          <h2 className="font-display text-lg font-semibold">Payment</h2>
          <div className="grid gap-2 sm:grid-cols-3">
            {paymentOptions.map((option) => (
              <label
                key={option.key}
                className={`flex cursor-pointer flex-col gap-0.5 rounded-xl border-[1.5px] px-4 py-3 transition ${
                  !option.enabled
                    ? "cursor-not-allowed border-ink-100 opacity-50"
                    : paymentMethod === option.key
                      ? "border-saffron-400 bg-saffron-50"
                      : "border-ink-200 hover:border-ink-300"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  className="sr-only"
                  checked={paymentMethod === option.key}
                  disabled={!option.enabled}
                  onChange={() => setPaymentMethod(option.key)}
                />
                <span className="text-sm font-semibold text-ink-900">{option.label}</span>
                <span className="text-[11px] text-ink-400">{option.enabled ? option.hint : "Not enabled"}</span>
              </label>
            ))}
          </div>
          {paymentMethod === "ONLINE" ? (
            <p className="rounded-xl bg-ink-100 px-4 py-3 text-xs text-ink-500">
              Online payment runs through the gateway configured in the admin panel. Until live keys are added, the order
              is saved as <strong>payment pending</strong> and our team will send a payment link.
            </p>
          ) : null}
          {paymentMethod === "UPI" && settings.upiId ? (
            <p className="rounded-xl bg-ink-100 px-4 py-3 text-xs text-ink-500">
              Pay to <strong className="font-mono">{settings.upiId}</strong> after placing the order — we&apos;ll confirm
              on WhatsApp.
            </p>
          ) : null}
        </fieldset>

        <div className="card p-5">
          <h2 className="mb-3 font-display text-lg font-semibold">Your items</h2>
          <ul className="divide-y divide-ink-100">
            {lines.map((line) => (
              <li key={line.key} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                <span className="flex min-w-0 items-start gap-2">
                  <VegMark isVeg={line.isVeg} className="mt-0.5" />
                  <span className="min-w-0">
                    <span className="block font-medium text-ink-800">
                      {line.quantity} × {line.name}
                    </span>
                    {line.variantName || line.addOns.length ? (
                      <span className="block text-xs text-ink-400">
                        {[line.variantName, ...line.addOns.map((a) => a.name)].filter(Boolean).join(", ")}
                      </span>
                    ) : null}
                  </span>
                </span>
                <span className="shrink-0 font-semibold">
                  {formatMoney((line.unitPrice + line.addOns.reduce((s, a) => s + a.price, 0)) * line.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <Link href="/cart" className="mt-3 inline-block text-sm font-semibold text-saffron-600 hover:underline">
            Edit cart
          </Link>
        </div>
      </div>

      <div className="space-y-4 lg:sticky lg:top-28">
        <div className="card p-5">
          <CouponField
            subtotal={subtotal}
            applied={coupon}
            onApply={applyCoupon}
            onClear={clearCoupon}
            phone={form.phone}
          />
        </div>

        <OrderSummary lines={lines} orderType={orderType} coupon={coupon}>
          <div className="space-y-2">
            {formError ? (
              <p className="flex items-start gap-2 rounded-xl bg-tandoor-500/10 px-3.5 py-3 text-sm text-tandoor-700" role="alert">
                <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
                {formError}
              </p>
            ) : null}
            <button
              type="submit"
              className="btn btn-primary w-full btn-lg"
              disabled={submitting || !totals.meetsMinimum || !settings.directOrderingEnabled}
            >
              {submitting ? "Placing your order…" : `Place order · ${formatMoney(totals.total)}`}
            </button>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp w-full">
              <IconWhatsapp className="h-5 w-5" /> Send on WhatsApp instead
            </a>
            <p className="pt-1 text-center text-[11px] leading-relaxed text-ink-400">
              By placing this order you agree to our cancellation policy. We&apos;ll call you on {form.phone || "your number"} if
              anything is unavailable.
            </p>
          </div>
        </OrderSummary>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  required,
  ...props
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
        {required ? <span className="text-tandoor-500"> *</span> : null}
        {hint ? <span className="font-normal text-ink-400"> — {hint}</span> : null}
      </label>
      <input
        id={id}
        name={id}
        className="field"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        required={required}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-tandoor-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
