"use client";

import { useEffect, useState } from "react";
import { usePersistedState } from "@/lib/use-persisted-state";
import { useToast } from "@/components/providers/toast";
import type { AppliedCoupon } from "@/components/order/order-summary";
import { IconCheck, IconClose, IconTag } from "@/components/icons";

export function CouponField({
  subtotal,
  applied,
  onApply,
  onClear,
  phone,
}: {
  subtotal: number;
  applied: AppliedCoupon | null;
  onApply: (coupon: AppliedCoupon) => void;
  onClear: () => void;
  phone?: string;
}) {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = code.trim().toUpperCase();
    if (!value) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: value, subtotal, phone }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "That coupon didn't work.");
        return;
      }
      onApply({
        code: payload.data.code,
        title: payload.data.title,
        // The API returns the exact discount for this cart, so the summary
        // models it as a fixed amount and always matches what the server saves.
        type: "FIXED",
        value: payload.data.discount,
        maxDiscount: null,
        minOrderValue: 0,
      });
      toast(payload.data.message, "success");
      setCode("");
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  if (applied) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border-[1.5px] border-dashed border-mint-500 bg-mint-500/8 px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-mint-600">
          <IconCheck className="h-4 w-4" />
          {applied.code} applied
        </span>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 text-xs font-semibold text-ink-500 transition hover:text-tandoor-600"
        >
          <IconClose className="h-3.5 w-3.5" /> Remove
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={apply} noValidate>
      <label className="label" htmlFor="coupon">
        Have a coupon?
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <IconTag className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            id="coupon"
            className="field pl-10 font-mono uppercase tracking-wider"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="FIRST10"
            maxLength={20}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "coupon-error" : undefined}
          />
        </div>
        <button type="submit" className="btn btn-dark" disabled={busy || !code.trim()}>
          {busy ? "Checking…" : "Apply"}
        </button>
      </div>
      {error ? (
        <p id="coupon-error" className="mt-2 text-sm text-tandoor-600" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

/**
 * Keeps the applied coupon across cart → checkout and re-checks it with the
 * server whenever the cart total changes, so a coupon can never silently
 * become invalid between pages.
 */
export function useAppliedCoupon(subtotal: number, phone?: string) {
  const [code, setCode] = usePersistedState<string>("mud_coupon", "");
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!code || subtotal <= 0) {
      setCoupon(null);
      return;
    }
    (async () => {
      try {
        const response = await fetch("/api/coupons/validate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ code, subtotal, phone }),
        });
        const payload = await response.json();
        if (cancelled) return;
        if (!response.ok || !payload.ok) {
          setCoupon(null);
          return;
        }
        setCoupon({
          code: payload.data.code,
          title: payload.data.title,
          type: "FIXED",
          value: payload.data.discount,
          maxDiscount: null,
          minOrderValue: 0,
        });
      } catch {
        if (!cancelled) setCoupon(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, subtotal, phone]);

  return {
    coupon,
    code,
    apply: (applied: AppliedCoupon) => {
      setCode(applied.code);
      setCoupon(applied);
    },
    clear: () => {
      setCode("");
      setCoupon(null);
    },
  };
}
