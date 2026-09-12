"use client";

import { useState } from "react";
import { useToast } from "@/components/providers/toast";
import { IconAlert, IconCheck } from "@/components/icons";

export function ContactForm() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", phone: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});
    setFormError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, email: form.email || undefined }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        if (payload.fieldErrors) setErrors(payload.fieldErrors);
        setFormError(payload.error ?? "We couldn't send that message. Please try again.");
        return;
      }
      setSent(true);
      toast("Message sent — we'll get back to you soon.", "success");
    } catch {
      setFormError("We couldn't reach the restaurant. Please try again, or call us.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="card border-mint-500/30 bg-mint-500/8 p-8 text-center">
        <span className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-mint-600 text-white">
          <IconCheck className="h-7 w-7" />
        </span>
        <h2 className="text-2xl">Message sent</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">
          Thanks for writing in. We read everything and usually reply within a few hours during opening time.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setForm({ name: "", phone: "", email: "", subject: "", message: "" });
          }}
          className="btn btn-outline mt-6"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="card space-y-4 p-6 md:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="c-name">
            Name <span className="text-tandoor-500">*</span>
          </label>
          <input
            id="c-name"
            className="field"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoComplete="name"
            aria-invalid={errors.name ? true : undefined}
          />
          {errors.name ? <p className="mt-1.5 text-sm text-tandoor-600">{errors.name}</p> : null}
        </div>
        <div>
          <label className="label" htmlFor="c-phone">
            Phone <span className="text-tandoor-500">*</span>
          </label>
          <input
            id="c-phone"
            className="field"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            inputMode="numeric"
            maxLength={10}
            autoComplete="tel-national"
            aria-invalid={errors.phone ? true : undefined}
          />
          {errors.phone ? <p className="mt-1.5 text-sm text-tandoor-600">{errors.phone}</p> : null}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="c-email">
          Email <span className="font-normal text-ink-400">(optional)</span>
        </label>
        <input
          id="c-email"
          type="email"
          className="field"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          autoComplete="email"
          aria-invalid={errors.email ? true : undefined}
        />
        {errors.email ? <p className="mt-1.5 text-sm text-tandoor-600">{errors.email}</p> : null}
      </div>

      <div>
        <label className="label" htmlFor="c-subject">
          Subject <span className="text-tandoor-500">*</span>
        </label>
        <input
          id="c-subject"
          className="field"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          placeholder="Bulk catering, feedback, lost item…"
          aria-invalid={errors.subject ? true : undefined}
        />
        {errors.subject ? <p className="mt-1.5 text-sm text-tandoor-600">{errors.subject}</p> : null}
      </div>

      <div>
        <label className="label" htmlFor="c-message">
          Message <span className="text-tandoor-500">*</span>
        </label>
        <textarea
          id="c-message"
          className="field min-h-32"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          maxLength={2000}
          aria-invalid={errors.message ? true : undefined}
        />
        {errors.message ? <p className="mt-1.5 text-sm text-tandoor-600">{errors.message}</p> : null}
      </div>

      {formError ? (
        <p className="flex items-start gap-2 rounded-xl bg-tandoor-500/10 px-4 py-3 text-sm text-tandoor-700" role="alert">
          <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {formError}
        </p>
      ) : null}

      <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
        {submitting ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
