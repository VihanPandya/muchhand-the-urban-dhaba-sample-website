"use client";

import { useState } from "react";
import { api, ApiError } from "@/components/admin/api";
import { useToast } from "@/components/providers/toast";
import { AdminCard, AdminField, Alert, Toggle } from "@/components/admin/ui";
import { ImageInput } from "@/components/admin/image-input";
import { DAY_NAMES } from "@/lib/hours";

export type SettingsShape = Record<string, unknown>;
export type HoursShape = { dayOfWeek: number; isOpen: boolean; openTime: string; closeTime: string }[];

export function SettingsForm({ initial, hours: initialHours }: { initial: SettingsShape; hours: HoursShape }) {
  const { toast } = useToast();
  const [form, setForm] = useState<SettingsShape>(initial);
  const [hours, setHours] = useState<HoursShape>(initialHours);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }));
  const str = (key: string) => String(form[key] ?? "");
  const num = (key: string) => (form[key] === null || form[key] === undefined ? "" : Number(form[key]));
  const bool = (key: string) => Boolean(form[key]);

  const save = async () => {
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      await api.put("/api/admin/settings", {
        name: str("name"),
        tagline: str("tagline"),
        logoUrl: str("logoUrl") || null,
        about: str("about") || null,
        cuisines: Array.isArray(form.cuisines) ? form.cuisines : [],
        priceRange: str("priceRange"),
        address: str("address"),
        latitude: form.latitude === "" || form.latitude === null ? null : Number(form.latitude),
        longitude: form.longitude === "" || form.longitude === null ? null : Number(form.longitude),
        phone: str("phone"),
        email: str("email"),
        deliveryEnabled: bool("deliveryEnabled"),
        pickupEnabled: bool("pickupEnabled"),
        directOrderingEnabled: bool("directOrderingEnabled"),
        minOrderValue: Number(form.minOrderValue ?? 0),
        deliveryFee: Number(form.deliveryFee ?? 0),
        freeDeliveryThreshold:
          form.freeDeliveryThreshold === "" || form.freeDeliveryThreshold === null ? null : Number(form.freeDeliveryThreshold),
        taxPercent: Number(form.taxPercent ?? 0),
        codEnabled: bool("codEnabled"),
        upiEnabled: bool("upiEnabled"),
        onlinePaymentEnabled: bool("onlinePaymentEnabled"),
        paymentProvider: str("paymentProvider"),
        upiId: str("upiId") || null,
        openState: str("openState") || "AUTO",
        closedMessage: str("closedMessage"),
        notifyEmail: str("notifyEmail") || null,
        notifyOnNewOrder: bool("notifyOnNewOrder"),
        notifyOnReservation: bool("notifyOnReservation"),
        notifyOnContact: bool("notifyOnContact"),
        seoTitle: str("seoTitle") || null,
        seoDescription: str("seoDescription") || null,
        ogImage: str("ogImage") || null,
        businessHours: hours,
      });
      toast("Settings saved.", "success");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.fieldErrors) setFieldErrors(err.fieldErrors);
      } else {
        setError("Could not save settings.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
      className="space-y-5"
      noValidate
    >
      <AdminCard title="Restaurant information" description="Shown across the website, in search results and on WhatsApp messages.">
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Restaurant name" id="s-name" required error={fieldErrors.name}>
            <input id="s-name" className="field" value={str("name")} onChange={(event) => set("name", event.target.value)} />
          </AdminField>
          <AdminField label="Tagline" id="s-tagline" error={fieldErrors.tagline}>
            <input id="s-tagline" className="field" value={str("tagline")} onChange={(event) => set("tagline", event.target.value)} />
          </AdminField>
          <div className="sm:col-span-2">
            <ImageInput label="Logo" id="s-logo" value={str("logoUrl")} onChange={(url) => set("logoUrl", url)} />
          </div>
          <AdminField label="Phone" id="s-phone" error={fieldErrors.phone}>
            <input id="s-phone" className="field" value={str("phone")} onChange={(event) => set("phone", event.target.value)} />
          </AdminField>
          <AdminField label="Email" id="s-email" error={fieldErrors.email}>
            <input id="s-email" type="email" className="field" value={str("email")} onChange={(event) => set("email", event.target.value)} />
          </AdminField>
          <div className="sm:col-span-2">
            <AdminField label="Address" id="s-address" error={fieldErrors.address}>
              <textarea id="s-address" className="field min-h-20" value={str("address")} onChange={(event) => set("address", event.target.value)} />
            </AdminField>
          </div>
          <AdminField label="Latitude" id="s-lat" error={fieldErrors.latitude} hint="for the map pin">
            <input
              id="s-lat"
              type="number"
              step="0.000001"
              className="field"
              value={num("latitude")}
              onChange={(event) => set("latitude", event.target.value === "" ? null : Number(event.target.value))}
            />
          </AdminField>
          <AdminField label="Longitude" id="s-lng" error={fieldErrors.longitude}>
            <input
              id="s-lng"
              type="number"
              step="0.000001"
              className="field"
              value={num("longitude")}
              onChange={(event) => set("longitude", event.target.value === "" ? null : Number(event.target.value))}
            />
          </AdminField>
          <AdminField label="Cuisines" id="s-cuisines" hint="comma separated — used in search results">
            <input
              id="s-cuisines"
              className="field"
              value={Array.isArray(form.cuisines) ? (form.cuisines as string[]).join(", ") : ""}
              onChange={(event) =>
                set("cuisines", event.target.value.split(",").map((part) => part.trim()).filter(Boolean))
              }
            />
          </AdminField>
          <AdminField label="Price range" id="s-price" hint="₹, ₹₹ or ₹₹₹">
            <input id="s-price" className="field" value={str("priceRange")} onChange={(event) => set("priceRange", event.target.value)} />
          </AdminField>
          <div className="sm:col-span-2">
            <AdminField label="Short about text" id="s-about">
              <textarea id="s-about" className="field min-h-24" value={str("about")} onChange={(event) => set("about", event.target.value)} />
            </AdminField>
          </div>
        </div>
      </AdminCard>

      <AdminCard title="Business hours" description="Online ordering follows these hours unless you override it below.">
        <div className="space-y-2">
          {hours.map((hour, index) => (
            <div key={hour.dayOfWeek} className="flex flex-wrap items-center gap-3 rounded-xl border border-ink-100 px-4 py-3">
              <span className="w-24 shrink-0 text-sm font-medium text-ink-800">{DAY_NAMES[hour.dayOfWeek]}</span>
              <Toggle
                label={hour.isOpen ? "Open" : "Closed"}
                checked={hour.isOpen}
                onChange={(value) => {
                  const next = [...hours];
                  next[index] = { ...hour, isOpen: value };
                  setHours(next);
                }}
              />
              <span className="flex items-center gap-2">
                <input
                  type="time"
                  className="field w-32 py-1.5"
                  value={hour.openTime}
                  disabled={!hour.isOpen}
                  onChange={(event) => {
                    const next = [...hours];
                    next[index] = { ...hour, openTime: event.target.value };
                    setHours(next);
                  }}
                  aria-label={`${DAY_NAMES[hour.dayOfWeek]} opening time`}
                />
                <span className="text-ink-400">to</span>
                <input
                  type="time"
                  className="field w-32 py-1.5"
                  value={hour.closeTime}
                  disabled={!hour.isOpen}
                  onChange={(event) => {
                    const next = [...hours];
                    next[index] = { ...hour, closeTime: event.target.value };
                    setHours(next);
                  }}
                  aria-label={`${DAY_NAMES[hour.dayOfWeek]} closing time`}
                />
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 border-t border-ink-100 pt-5 sm:grid-cols-2">
          <AdminField label="Open / closed override" id="s-open" hint="Auto follows the hours above">
            <select id="s-open" className="field" value={str("openState")} onChange={(event) => set("openState", event.target.value)}>
              <option value="AUTO">Auto (follow business hours)</option>
              <option value="OPEN">Force open</option>
              <option value="CLOSED">Force closed</option>
            </select>
          </AdminField>
          <AdminField label="Closed message" id="s-closed">
            <input id="s-closed" className="field" value={str("closedMessage")} onChange={(event) => set("closedMessage", event.target.value)} />
          </AdminField>
        </div>
      </AdminCard>

      <AdminCard title="Ordering" description="What customers can do, and what it costs them.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Toggle label="Direct ordering enabled" hint="Turn off to pause the website cart" checked={bool("directOrderingEnabled")} onChange={(value) => set("directOrderingEnabled", value)} />
          <Toggle label="Delivery enabled" checked={bool("deliveryEnabled")} onChange={(value) => set("deliveryEnabled", value)} />
          <Toggle label="Pickup enabled" checked={bool("pickupEnabled")} onChange={(value) => set("pickupEnabled", value)} />
          <div />
          <AdminField label="Minimum order value (₹)" id="s-min" error={fieldErrors.minOrderValue}>
            <input id="s-min" type="number" min={0} className="field" value={num("minOrderValue")} onChange={(event) => set("minOrderValue", Number(event.target.value))} />
          </AdminField>
          <AdminField label="Delivery fee (₹)" id="s-fee" error={fieldErrors.deliveryFee}>
            <input id="s-fee" type="number" min={0} className="field" value={num("deliveryFee")} onChange={(event) => set("deliveryFee", Number(event.target.value))} />
          </AdminField>
          <AdminField label="Free delivery above (₹)" id="s-free" hint="leave blank to always charge">
            <input
              id="s-free"
              type="number"
              min={0}
              className="field"
              value={num("freeDeliveryThreshold")}
              onChange={(event) => set("freeDeliveryThreshold", event.target.value === "" ? null : Number(event.target.value))}
            />
          </AdminField>
          <AdminField label="Tax percent" id="s-tax" error={fieldErrors.taxPercent}>
            <input id="s-tax" type="number" min={0} max={50} step={0.5} className="field" value={num("taxPercent")} onChange={(event) => set("taxPercent", Number(event.target.value))} />
          </AdminField>
        </div>
      </AdminCard>

      <AdminCard
        title="Payments"
        description="Payment gateway keys live in environment variables and are never exposed to the browser."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Toggle label="Cash on delivery" checked={bool("codEnabled")} onChange={(value) => set("codEnabled", value)} />
          <Toggle label="UPI" checked={bool("upiEnabled")} onChange={(value) => set("upiEnabled", value)} />
          <Toggle
            label="Online payment"
            hint="Needs gateway keys in the environment"
            checked={bool("onlinePaymentEnabled")}
            onChange={(value) => set("onlinePaymentEnabled", value)}
          />
          <div />
          <AdminField label="Payment provider" id="s-provider" hint="e.g. razorpay">
            <input id="s-provider" className="field" value={str("paymentProvider")} onChange={(event) => set("paymentProvider", event.target.value)} />
          </AdminField>
          <AdminField label="UPI ID" id="s-upi" hint="shown to customers who choose UPI">
            <input id="s-upi" className="field" value={str("upiId")} onChange={(event) => set("upiId", event.target.value)} />
          </AdminField>
        </div>
      </AdminCard>

      <AdminCard title="Notifications" description="Where new orders, reservations and enquiries get announced.">
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Notification email" id="s-notify" hint="needs EMAIL_API_KEY to be set">
            <input id="s-notify" type="email" className="field" value={str("notifyEmail")} onChange={(event) => set("notifyEmail", event.target.value)} />
          </AdminField>
          <div />
          <Toggle label="Notify on new order" checked={bool("notifyOnNewOrder")} onChange={(value) => set("notifyOnNewOrder", value)} />
          <Toggle label="Notify on new reservation" checked={bool("notifyOnReservation")} onChange={(value) => set("notifyOnReservation", value)} />
          <Toggle label="Notify on contact form" checked={bool("notifyOnContact")} onChange={(value) => set("notifyOnContact", value)} />
        </div>
      </AdminCard>

      <AdminCard title="SEO" description="Defaults for the title, description and social preview image.">
        <div className="space-y-4">
          <AdminField label="SEO title" id="s-seo-title">
            <input id="s-seo-title" className="field" value={str("seoTitle")} onChange={(event) => set("seoTitle", event.target.value)} />
          </AdminField>
          <AdminField label="Meta description" id="s-seo-desc" hint="around 155 characters">
            <textarea id="s-seo-desc" className="field min-h-20" value={str("seoDescription")} onChange={(event) => set("seoDescription", event.target.value)} />
          </AdminField>
          <ImageInput label="Social preview image" id="s-og" value={str("ogImage")} onChange={(url) => set("ogImage", url)} />
        </div>
      </AdminCard>

      {error ? <Alert kind="error">{error}</Alert> : null}

      <div className="sticky bottom-4 z-10 flex justify-end">
        <button type="submit" className="btn btn-primary shadow-[var(--shadow-lift)]" disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
