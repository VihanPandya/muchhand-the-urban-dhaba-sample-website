"use client";

import { useEffect, useState } from "react";
import { IconCheck } from "@/components/icons";

const DELIVERY_STEPS = [
  { key: "NEW", label: "Order placed", hint: "We've received your order" },
  { key: "CONFIRMED", label: "Confirmed", hint: "The kitchen has accepted it" },
  { key: "PREPARING", label: "Preparing", hint: "Cooking to order" },
  { key: "OUT_FOR_DELIVERY", label: "Out for delivery", hint: "On the way to you" },
  { key: "COMPLETED", label: "Delivered", hint: "Enjoy your meal" },
];

const PICKUP_STEPS = [
  { key: "NEW", label: "Order placed", hint: "We've received your order" },
  { key: "CONFIRMED", label: "Confirmed", hint: "The kitchen has accepted it" },
  { key: "PREPARING", label: "Preparing", hint: "Cooking to order" },
  { key: "READY", label: "Ready for pickup", hint: "Collect from the counter" },
  { key: "COMPLETED", label: "Collected", hint: "Enjoy your meal" },
];

export function OrderStatusTracker({
  orderNumber,
  initialStatus,
  orderType,
}: {
  orderNumber: string;
  initialStatus: string;
  orderType: "DELIVERY" | "PICKUP";
}) {
  const [status, setStatus] = useState(initialStatus);
  const [checking, setChecking] = useState(false);
  const steps = orderType === "DELIVERY" ? DELIVERY_STEPS : PICKUP_STEPS;

  const refresh = async () => {
    setChecking(true);
    try {
      const response = await fetch(`/api/orders/${orderNumber}`, { cache: "no-store" });
      const payload = await response.json();
      if (response.ok && payload.ok) setStatus(payload.data.status);
    } catch {
      /* keep showing the last known status */
    } finally {
      setChecking(false);
    }
  };

  // Poll while the order is still live; stop once it is finished.
  useEffect(() => {
    if (status === "COMPLETED" || status === "CANCELLED") return;
    const timer = setInterval(refresh, 45_000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, orderNumber]);

  if (status === "CANCELLED") {
    return (
      <div className="card border-tandoor-500/30 bg-tandoor-500/8 p-6">
        <h2 className="text-xl text-tandoor-700">This order was cancelled</h2>
        <p className="mt-1 text-sm text-ink-600">
          If this wasn&apos;t expected, message us on WhatsApp and we&apos;ll sort it out right away.
        </p>
      </div>
    );
  }

  const currentIndex = Math.max(
    steps.findIndex((step) => step.key === status),
    status === "READY" || status === "OUT_FOR_DELIVERY" ? 3 : 0,
  );

  return (
    <div className="card p-5 md:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">Order progress</h2>
        <button
          type="button"
          onClick={refresh}
          className="text-xs font-semibold text-saffron-600 transition hover:underline disabled:opacity-50"
          disabled={checking}
        >
          {checking ? "Checking…" : "Refresh"}
        </button>
      </div>

      <ol className="space-y-0">
        {steps.map((step, index) => {
          const done = index <= currentIndex;
          const active = index === currentIndex;
          return (
            <li key={step.key} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full border-2 transition ${
                    done ? "border-mint-600 bg-mint-600 text-white" : "border-ink-200 bg-white text-ink-300"
                  } ${active ? "ring-4 ring-mint-500/20" : ""}`}
                >
                  {done ? <IconCheck className="h-4 w-4" /> : <span className="text-xs font-bold">{index + 1}</span>}
                </span>
                {index < steps.length - 1 ? (
                  <span className={`w-0.5 flex-1 ${index < currentIndex ? "bg-mint-600" : "bg-ink-200"}`} />
                ) : null}
              </div>
              <div className={`pb-6 ${index === steps.length - 1 ? "pb-0" : ""}`}>
                <p className={`font-semibold ${done ? "text-ink-900" : "text-ink-400"}`}>{step.label}</p>
                <p className="text-sm text-ink-400">{step.hint}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
