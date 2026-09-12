import "server-only";
import { cache } from "react";
import type { BusinessHours, RestaurantSettings } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/money";
import { computeOpenStatus, type OpenStatus } from "@/lib/hours";

export {
  DAY_NAMES,
  TIMEZONE,
  restaurantClock,
  parseTime,
  formatTime,
  computeOpenStatus,
  type OpenStatus,
} from "@/lib/hours";

/** Cached per request so a page render hits the settings row once. */
export const getSettings = cache(async (): Promise<RestaurantSettings> => {
  const existing = await prisma.restaurantSettings.findUnique({ where: { id: "default" } });
  if (existing) return existing;
  return prisma.restaurantSettings.create({ data: { id: "default" } });
});

export const getBusinessHours = cache(async (): Promise<BusinessHours[]> => {
  const rows = await prisma.businessHours.findMany({ orderBy: { dayOfWeek: "asc" } });
  if (rows.length === 7) return rows;
  // Self-heal a partially seeded install.
  const existing = new Map(rows.map((r) => [r.dayOfWeek, r]));
  const created: BusinessHours[] = [];
  for (let day = 0; day < 7; day++) {
    created.push(
      existing.get(day) ??
        (await prisma.businessHours.create({
          data: { dayOfWeek: day, isOpen: true, openTime: "11:00", closeTime: "23:30" },
        })),
    );
  }
  return created;
});

export async function getOpenStatus(): Promise<OpenStatus> {
  const [settings, hours] = await Promise.all([getSettings(), getBusinessHours()]);
  return computeOpenStatus(settings, hours, new Date());
}

/** Everything the client bundle is allowed to know about the restaurant. */
export type PublicSettings = {
  name: string;
  tagline: string;
  logoUrl: string | null;
  address: string;
  phone: string;
  email: string;
  whatsappNumber: string;
  whatsappCountryCode: string;
  whatsappDefaultMessage: string;
  whatsappOrderTemplate: string;
  whatsappReservationTemplate: string;
  zomatoUrl: string | null;
  swiggyUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  googleBusinessUrl: string | null;
  mapsUrl: string | null;
  mapsEmbedUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  directOrderingEnabled: boolean;
  minOrderValue: number;
  deliveryFee: number;
  freeDeliveryThreshold: number | null;
  taxPercent: number;
  codEnabled: boolean;
  upiEnabled: boolean;
  onlinePaymentEnabled: boolean;
  upiId: string | null;
  priceRange: string;
  cuisines: string[];
};

export function toPublicSettings(s: RestaurantSettings): PublicSettings {
  return {
    name: s.name,
    tagline: s.tagline,
    logoUrl: s.logoUrl,
    address: s.address,
    phone: s.phone,
    email: s.email,
    whatsappNumber: s.whatsappNumber,
    whatsappCountryCode: s.whatsappCountryCode,
    whatsappDefaultMessage: s.whatsappDefaultMessage,
    whatsappOrderTemplate: s.whatsappOrderTemplate,
    whatsappReservationTemplate: s.whatsappReservationTemplate,
    zomatoUrl: s.zomatoUrl,
    swiggyUrl: s.swiggyUrl,
    instagramUrl: s.instagramUrl,
    facebookUrl: s.facebookUrl,
    youtubeUrl: s.youtubeUrl,
    googleBusinessUrl: s.googleBusinessUrl,
    mapsUrl: s.mapsUrl,
    mapsEmbedUrl: s.mapsEmbedUrl,
    latitude: s.latitude,
    longitude: s.longitude,
    deliveryEnabled: s.deliveryEnabled,
    pickupEnabled: s.pickupEnabled,
    directOrderingEnabled: s.directOrderingEnabled,
    minOrderValue: toNumber(s.minOrderValue),
    deliveryFee: toNumber(s.deliveryFee),
    freeDeliveryThreshold: s.freeDeliveryThreshold === null ? null : toNumber(s.freeDeliveryThreshold),
    taxPercent: toNumber(s.taxPercent),
    codEnabled: s.codEnabled,
    upiEnabled: s.upiEnabled,
    onlinePaymentEnabled: s.onlinePaymentEnabled,
    upiId: s.upiId,
    priceRange: s.priceRange,
    cuisines: s.cuisines,
  };
}

export async function getPublicSettings(): Promise<PublicSettings> {
  return toPublicSettings(await getSettings());
}
