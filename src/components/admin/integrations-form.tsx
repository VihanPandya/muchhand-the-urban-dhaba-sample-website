"use client";

import { useState } from "react";
import { api, ApiError } from "@/components/admin/api";
import { useToast } from "@/components/providers/toast";
import { AdminCard, AdminField, Alert } from "@/components/admin/ui";
import { buildWhatsappLink, renderTemplate, TEMPLATE_VARIABLES, DEFAULT_ORDER_TEMPLATE, DEFAULT_RESERVATION_TEMPLATE } from "@/lib/whatsapp";
import { IconCheck, IconAlert, IconWhatsapp } from "@/components/icons";

type Shape = Record<string, unknown>;

/**
 * Integrations are link-based by design: Zomato and Swiggy do not offer public
 * ordering APIs to restaurants, so we send customers to the official listing.
 * If credentials ever become available, the server-side integration slots in
 * behind these same settings without touching the rest of the site.
 */
export function IntegrationsForm({ initial }: { initial: Shape }) {
  const { toast } = useToast();
  const [form, setForm] = useState<Shape>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }));
  const str = (key: string) => String(form[key] ?? "");

  const save = async () => {
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      await api.put("/api/admin/settings", {
        whatsappNumber: str("whatsappNumber"),
        whatsappCountryCode: str("whatsappCountryCode"),
        whatsappDefaultMessage: str("whatsappDefaultMessage"),
        whatsappOrderTemplate: str("whatsappOrderTemplate"),
        whatsappReservationTemplate: str("whatsappReservationTemplate"),
        zomatoUrl: str("zomatoUrl") || null,
        swiggyUrl: str("swiggyUrl") || null,
        instagramUrl: str("instagramUrl") || null,
        facebookUrl: str("facebookUrl") || null,
        youtubeUrl: str("youtubeUrl") || null,
        googleBusinessUrl: str("googleBusinessUrl") || null,
        mapsUrl: str("mapsUrl") || null,
        mapsEmbedUrl: str("mapsEmbedUrl") || null,
      });
      toast("Integrations saved.", "success");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.fieldErrors) setFieldErrors(err.fieldErrors);
      } else {
        setError("Could not save the integration settings.");
      }
    } finally {
      setSaving(false);
    }
  };

  const previewLink = buildWhatsappLink(
    str("whatsappCountryCode"),
    str("whatsappNumber"),
    renderTemplate(str("whatsappOrderTemplate") || DEFAULT_ORDER_TEMPLATE, {
      restaurant_name: String(initial.name ?? "Your restaurant"),
      customer_name: "Rahul",
      items: "1 × Paneer Tikka\n2 × Garlic Naan\n1 × Dal Makhani",
      total: "₹899",
      order_type: "Delivery",
      address: "12, Silver Oak Residency, Gota",
      phone: "9825012345",
      order_number: "MUD-260912-1234",
    }),
  );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
      className="space-y-5"
      noValidate
    >
      <AdminCard
        title="WhatsApp ordering"
        description="The number every WhatsApp button on the website sends to, and the message templates it fills in."
      >
        <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
          <AdminField label="Country code" id="i-cc" error={fieldErrors.whatsappCountryCode}>
            <input id="i-cc" className="field" value={str("whatsappCountryCode")} onChange={(event) => set("whatsappCountryCode", event.target.value)} placeholder="91" />
          </AdminField>
          <AdminField label="WhatsApp business number" id="i-wa" error={fieldErrors.whatsappNumber} hint="digits only, without the country code">
            <input id="i-wa" className="field" value={str("whatsappNumber")} onChange={(event) => set("whatsappNumber", event.target.value)} placeholder="7600334353" />
          </AdminField>
        </div>

        <div className="mt-4 space-y-4">
          <AdminField label="Default message" id="i-default" hint="used by the floating button and header icon">
            <textarea id="i-default" className="field min-h-16" value={str("whatsappDefaultMessage")} onChange={(event) => set("whatsappDefaultMessage", event.target.value)} />
          </AdminField>

          <AdminField label="Order message template" id="i-order">
            <textarea
              id="i-order"
              className="field min-h-40 font-mono text-xs"
              value={str("whatsappOrderTemplate")}
              onChange={(event) => set("whatsappOrderTemplate", event.target.value)}
              placeholder={DEFAULT_ORDER_TEMPLATE}
            />
          </AdminField>
          <VariableHelp variables={TEMPLATE_VARIABLES.order} />

          <AdminField label="Reservation message template" id="i-reservation">
            <textarea
              id="i-reservation"
              className="field min-h-32 font-mono text-xs"
              value={str("whatsappReservationTemplate")}
              onChange={(event) => set("whatsappReservationTemplate", event.target.value)}
              placeholder={DEFAULT_RESERVATION_TEMPLATE}
            />
          </AdminField>
          <VariableHelp variables={TEMPLATE_VARIABLES.reservation} />

          <div className="rounded-xl border border-ink-100 bg-paper-dim p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-400">Preview</p>
            <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-[#e5ddd5] p-4 font-sans text-sm text-ink-800">
              {renderTemplate(str("whatsappOrderTemplate") || DEFAULT_ORDER_TEMPLATE, {
                restaurant_name: String(initial.name ?? "Your restaurant"),
                customer_name: "Rahul",
                items: "1 × Paneer Tikka\n2 × Garlic Naan\n1 × Dal Makhani",
                total: "₹899",
                order_type: "Delivery",
                address: "12, Silver Oak Residency, Gota",
                phone: "9825012345",
                order_number: "MUD-260912-1234",
              })}
            </pre>
            <a href={previewLink} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-sm mt-3">
              <IconWhatsapp className="h-4 w-4" /> Test this message
            </a>
          </div>
        </div>
      </AdminCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <AdminCard title="Zomato">
          <ConnectionBadge connected={Boolean(str("zomatoUrl"))} />
          <AdminField label="Zomato restaurant URL" id="i-zomato" error={fieldErrors.zomatoUrl} hint="the public listing customers should land on">
            <input
              id="i-zomato"
              type="url"
              className="field"
              value={str("zomatoUrl")}
              onChange={(event) => set("zomatoUrl", event.target.value)}
              placeholder="https://www.zomato.com/…"
            />
          </AdminField>
          <p className="mt-3 text-xs leading-relaxed text-ink-400">
            Zomato does not publish an ordering API for restaurants, so this is a direct link to your official listing.
            We never scrape Zomato. If API credentials become available to you, the server-side integration can be added
            behind this same setting.
          </p>
        </AdminCard>

        <AdminCard title="Swiggy">
          <ConnectionBadge connected={Boolean(str("swiggyUrl"))} />
          <AdminField label="Swiggy restaurant URL" id="i-swiggy" error={fieldErrors.swiggyUrl}>
            <input
              id="i-swiggy"
              type="url"
              className="field"
              value={str("swiggyUrl")}
              onChange={(event) => set("swiggyUrl", event.target.value)}
              placeholder="https://www.swiggy.com/restaurants/…"
            />
          </AdminField>
          <p className="mt-3 text-xs leading-relaxed text-ink-400">
            Same as Zomato: a configurable official link, not an API integration, and never a scraper.
          </p>
        </AdminCard>
      </div>

      <AdminCard title="Maps & social" description="Used in the footer, the contact page and structured data for search engines.">
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Google Maps link" id="i-maps" error={fieldErrors.mapsUrl} hint="used by the Get Directions button">
            <input id="i-maps" type="url" className="field" value={str("mapsUrl")} onChange={(event) => set("mapsUrl", event.target.value)} />
          </AdminField>
          <AdminField label="Google Maps embed URL" id="i-embed" hint="optional — leave blank to build one from the address">
            <input id="i-embed" type="url" className="field" value={str("mapsEmbedUrl")} onChange={(event) => set("mapsEmbedUrl", event.target.value)} />
          </AdminField>
          <AdminField label="Instagram" id="i-instagram" error={fieldErrors.instagramUrl}>
            <input id="i-instagram" type="url" className="field" value={str("instagramUrl")} onChange={(event) => set("instagramUrl", event.target.value)} />
          </AdminField>
          <AdminField label="Facebook" id="i-facebook" error={fieldErrors.facebookUrl}>
            <input id="i-facebook" type="url" className="field" value={str("facebookUrl")} onChange={(event) => set("facebookUrl", event.target.value)} />
          </AdminField>
          <AdminField label="YouTube" id="i-youtube" error={fieldErrors.youtubeUrl}>
            <input id="i-youtube" type="url" className="field" value={str("youtubeUrl")} onChange={(event) => set("youtubeUrl", event.target.value)} />
          </AdminField>
          <AdminField label="Google Business profile" id="i-google" error={fieldErrors.googleBusinessUrl}>
            <input id="i-google" type="url" className="field" value={str("googleBusinessUrl")} onChange={(event) => set("googleBusinessUrl", event.target.value)} />
          </AdminField>
        </div>
      </AdminCard>

      <AdminCard title="Payment gateway">
        <p className="text-sm leading-relaxed text-ink-500">
          Razorpay (or any other gateway) is configured through environment variables — <code className="font-mono text-xs">RAZORPAY_KEY_ID</code> and{" "}
          <code className="font-mono text-xs">RAZORPAY_KEY_SECRET</code>. Keys are never stored in the database and never
          reach the browser. Once they are set, switch on <strong>Online payment</strong> in Settings.
        </p>
      </AdminCard>

      {error ? <Alert kind="error">{error}</Alert> : null}

      <div className="sticky bottom-4 z-10 flex justify-end">
        <button type="submit" className="btn btn-primary shadow-[var(--shadow-lift)]" disabled={saving}>
          {saving ? "Saving…" : "Save integrations"}
        </button>
      </div>
    </form>
  );
}

function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <p
      className={`mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
        connected ? "bg-mint-500/12 text-mint-600" : "bg-ink-100 text-ink-500"
      }`}
    >
      {connected ? <IconCheck className="h-3.5 w-3.5" /> : <IconAlert className="h-3.5 w-3.5" />}
      {connected ? "Connected" : "Not connected"}
    </p>
  );
}

function VariableHelp({ variables }: { variables: readonly string[] }) {
  return (
    <p className="flex flex-wrap items-center gap-1.5 text-xs text-ink-400">
      Variables:
      {variables.map((variable) => (
        <code key={variable} className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[11px] text-ink-600">
          {`{{${variable}}}`}
        </code>
      ))}
    </p>
  );
}
