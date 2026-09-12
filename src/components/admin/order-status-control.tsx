"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/components/admin/api";
import { useToast } from "@/components/providers/toast";
import { ORDER_STATUSES } from "@/components/admin/orders-table";
import { AdminField, Alert } from "@/components/admin/ui";

const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const;

export function OrderStatusControl({
  orderId,
  status,
  paymentStatus,
  orderType,
}: {
  orderId: string;
  status: string;
  paymentStatus: string;
  orderType: "DELIVERY" | "PICKUP";
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [nextStatus, setNextStatus] = useState(status);
  const [nextPayment, setNextPayment] = useState(paymentStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.put(`/api/admin/orders/${orderId}`, { status: nextStatus, paymentStatus: nextPayment });
      toast("Order updated.", "success");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update the order.");
    } finally {
      setSaving(false);
    }
  };

  const quickSteps =
    orderType === "DELIVERY"
      ? ["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "COMPLETED"]
      : ["CONFIRMED", "PREPARING", "READY", "COMPLETED"];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {quickSteps.map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => setNextStatus(step)}
            className={`chip border-[1.5px] transition ${
              nextStatus === step ? "border-saffron-400 bg-saffron-400 text-ink-900" : "border-ink-200 hover:border-ink-300"
            }`}
          >
            {step.replace(/_/g, " ").toLowerCase()}
          </button>
        ))}
      </div>

      <AdminField label="Order status" id="status">
        <select id="status" className="field" value={nextStatus} onChange={(event) => setNextStatus(event.target.value)}>
          {ORDER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {value.replace(/_/g, " ").toLowerCase()}
            </option>
          ))}
        </select>
      </AdminField>

      <AdminField label="Payment status" id="payment">
        <select id="payment" className="field" value={nextPayment} onChange={(event) => setNextPayment(event.target.value)}>
          {PAYMENT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {value.toLowerCase()}
            </option>
          ))}
        </select>
      </AdminField>

      {error ? <Alert kind="error">{error}</Alert> : null}

      <button
        type="button"
        onClick={save}
        className="btn btn-primary w-full"
        disabled={saving || (nextStatus === status && nextPayment === paymentStatus)}
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}
