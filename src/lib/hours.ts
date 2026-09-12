/**
 * Opening-hours helpers. Pure functions with no database or server-only
 * imports, so the admin forms can use them in the browser too.
 */
import type { BusinessHours, RestaurantSettings } from "@prisma/client";

export const TIMEZONE = process.env.RESTAURANT_TIMEZONE || "Asia/Kolkata";

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Clock = { dayOfWeek: number; minutes: number; label: string };

export function restaurantClock(now = new Date()): Clock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  const hour = Number(get("hour")) % 24;
  const minute = Number(get("minute"));
  return {
    dayOfWeek: weekdayIndex < 0 ? now.getDay() : weekdayIndex,
    minutes: hour * 60 + minute,
    label: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
}

export function parseTime(value: string): number {
  const [h, m] = value.split(":").map((n) => Number(n));
  if (Number.isNaN(h)) return 0;
  return (h % 24) * 60 + (Number.isNaN(m) ? 0 : m);
}

export function formatTime(value: string): string {
  const minutes = parseTime(value);
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export type OpenStatus = {
  isOpen: boolean;
  /** True when the admin has forced the shutter down regardless of hours. */
  manualOverride: boolean;
  todayLabel: string;
  nextOpenLabel: string | null;
  message: string;
};

/**
 * Works out whether the kitchen is taking orders right now, honouring a
 * close time that runs past midnight and the admin's manual override.
 */
export function computeOpenStatus(
  settings: Pick<RestaurantSettings, "openState" | "closedMessage">,
  hours: BusinessHours[],
  now = new Date(),
): OpenStatus {
  const clock = restaurantClock(now);
  const byDay = new Map(hours.map((h) => [h.dayOfWeek, h]));
  const today = byDay.get(clock.dayOfWeek);
  const yesterday = byDay.get((clock.dayOfWeek + 6) % 7);

  const todayLabel =
    today && today.isOpen ? `${formatTime(today.openTime)} – ${formatTime(today.closeTime)}` : "Closed today";

  let openByHours = false;
  if (today?.isOpen) {
    const open = parseTime(today.openTime);
    const close = parseTime(today.closeTime);
    openByHours = close > open ? clock.minutes >= open && clock.minutes < close : clock.minutes >= open;
  }
  // A shift that started yesterday and runs past midnight.
  if (!openByHours && yesterday?.isOpen) {
    const open = parseTime(yesterday.openTime);
    const close = parseTime(yesterday.closeTime);
    if (close <= open && clock.minutes < close) openByHours = true;
  }

  let nextOpenLabel: string | null = null;
  if (!openByHours) {
    for (let offset = 0; offset < 8; offset++) {
      const day = byDay.get((clock.dayOfWeek + offset) % 7);
      if (!day?.isOpen) continue;
      const open = parseTime(day.openTime);
      if (offset === 0 && clock.minutes >= open) continue;
      nextOpenLabel =
        offset === 0
          ? `today at ${formatTime(day.openTime)}`
          : offset === 1
            ? `tomorrow at ${formatTime(day.openTime)}`
            : `${DAY_NAMES[day.dayOfWeek]} at ${formatTime(day.openTime)}`;
      break;
    }
  }

  const manualOverride = settings.openState !== "AUTO";
  const isOpen = settings.openState === "OPEN" ? true : settings.openState === "CLOSED" ? false : openByHours;

  return {
    isOpen,
    manualOverride,
    todayLabel,
    nextOpenLabel,
    message: isOpen
      ? "Open now"
      : nextOpenLabel
        ? `${settings.closedMessage} Online ordering reopens ${nextOpenLabel}.`
        : settings.closedMessage,
  };
}

