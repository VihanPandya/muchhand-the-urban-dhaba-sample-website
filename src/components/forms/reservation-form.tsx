"use client";

import { useState } from "react";
import { useSite } from "@/components/providers/site";
import { useToast } from "@/components/providers/toast";
import { buildWhatsappLink, renderTemplate, DEFAULT_RESERVATION_TEMPLATE } from "@/lib/whatsapp";
import { IconAlert, IconCheck, IconWhatsapp } from "@/components/icons";

const TIMES = [
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00",
];

export function ReservationForm() {
  const { settings } = useSite();
  const { toast } = useToast();
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    date: today,
    time: "20:00",
    guests: 2,
    specialRequest: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  const whatsappHref = buildWhatsappLink(
    settings.whatsappCountryCode,
    settings.whatsappNumber,
    renderTemplate(settings.whatsappReservationTemplate || DEFAULT_RESERVATION_TEMPLATE, {
      restaurant_name: settings.name,
      customer_name: form.name || "—",
      date: form.date,
      time: form.time,
      guests: form.guests,
      phone: form.phone || "—",
      special_request: form.specialRequest || "—",
    }),
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});
    setFormError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, guests: Number(form.guests), email: form.email || undefined }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        if (payload.fieldErrors) setErrors(payload.fieldErrors);
        setFormError(payload.error ?? "We couldn't save that booking. Please try again.");
        return;
      }
      setReference(payload.data.reference);
      toast("Table requested — we'll confirm shortly.", "success");
    } catch {
      setFormError("We couldn't reach the restaurant. Please try again, or book on WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  };

  if (reference) {
    return (
      <div className="card border-mint-500/30 bg-mint-500/8 p-8 text-center">
        <span className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-mint-600 text-white">
          <IconCheck className="h-7 w-7" />
        </span>
        <h2 className="text-2xl">Table requested</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">
          Your reference is <strong className="font-mono">{reference}</strong>. We&apos;ll confirm on{" "}
          {form.phone} shortly — usually within 15 minutes during opening hours.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
            <IconWhatsapp className="h-5 w-5" /> Confirm on WhatsApp
          </a>
          <button
            type="button"
            onClick={() => {
              setReference(null);
              setForm({ ...form, specialRequest: "" });
            }}
            className="btn btn-outline"
          >
            Book another table
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="card space-y-5 p-6 md:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="name"
          label="Name"
          required
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          error={errors.name}
          autoComplete="name"
          placeholder="Rahul Mehta"
        />
        <Field
          id="phone"
          label="Phone"
          required
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
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
        hint="optional"
        type="email"
        value={form.email}
        onChange={(v) => setForm({ ...form, email: v })}
        error={errors.email}
        autoComplete="email"
        placeholder="you@example.com"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          id="date"
          label="Date"
          required
          type="date"
          min={today}
          value={form.date}
          onChange={(v) => setForm({ ...form, date: v })}
          error={errors.date}
        />
        <div>
          <label className="label" htmlFor="time">
            Time <span className="text-tandoor-500">*</span>
          </label>
          <select
            id="time"
            className="field"
            value={form.time}
            onChange={(event) => setForm({ ...form, time: event.target.value })}
          >
            {TIMES.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="guests">
            Guests <span className="text-tandoor-500">*</span>
          </label>
          <select
            id="guests"
            className="field"
            value={form.guests}
            onChange={(event) => setForm({ ...form, guests: Number(event.target.value) })}
          >
            {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "guest" : "guests"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="specialRequest">
          Special request <span className="font-normal text-ink-400">(optional)</span>
        </label>
        <textarea
          id="specialRequest"
          className="field min-h-24"
          maxLength={400}
          value={form.specialRequest}
          onChange={(event) => setForm({ ...form, specialRequest: event.target.value })}
          placeholder="Birthday celebration, high chair needed, quiet corner…"
        />
        {errors.specialRequest ? <p className="mt-1.5 text-sm text-tandoor-600">{errors.specialRequest}</p> : null}
      </div>

      {formError ? (
        <p className="flex items-start gap-2 rounded-xl bg-tandoor-500/10 px-4 py-3 text-sm text-tandoor-700" role="alert">
          <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {formError}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="submit" className="btn btn-primary flex-1" disabled={submitting}>
          {submitting ? "Requesting…" : "Request a table"}
        </button>
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp flex-1">
          <IconWhatsapp className="h-5 w-5" /> Book on WhatsApp
        </a>
      </div>

      <p className="text-xs leading-relaxed text-ink-400">
        Reservations are held for 15 minutes past the booking time. For parties over 20, please call us directly at{" "}
        {settings.phone}.
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  required,
  value,
  onChange,
  ...props
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
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
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
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
