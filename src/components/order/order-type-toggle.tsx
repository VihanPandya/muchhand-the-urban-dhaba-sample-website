"use client";

import { useSite } from "@/components/providers/site";
import { IconMapPin, IconScooter } from "@/components/icons";

export function OrderTypeToggle({
  value,
  onChange,
}: {
  value: "DELIVERY" | "PICKUP";
  onChange: (value: "DELIVERY" | "PICKUP") => void;
}) {
  const { settings } = useSite();

  const options = [
    { key: "DELIVERY" as const, label: "Delivery", hint: "To your door", icon: IconScooter, enabled: settings.deliveryEnabled },
    { key: "PICKUP" as const, label: "Pickup", hint: "Collect from us", icon: IconMapPin, enabled: settings.pickupEnabled },
  ];

  return (
    <fieldset className="card p-4">
      <legend className="sr-only">Order type</legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
          const Icon = option.icon;
          const active = value === option.key;
          return (
            <label
              key={option.key}
              className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border-[1.5px] px-3 py-3 text-center transition ${
                !option.enabled
                  ? "cursor-not-allowed border-ink-100 opacity-50"
                  : active
                    ? "border-saffron-400 bg-saffron-50"
                    : "border-ink-200 hover:border-ink-300"
              }`}
            >
              <input
                type="radio"
                name="order-type"
                className="sr-only"
                checked={active}
                disabled={!option.enabled}
                onChange={() => onChange(option.key)}
              />
              <Icon className={`h-5 w-5 ${active ? "text-saffron-600" : "text-ink-400"}`} />
              <span className="text-sm font-semibold text-ink-900">{option.label}</span>
              <span className="text-[11px] text-ink-400">{option.enabled ? option.hint : "Unavailable"}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
