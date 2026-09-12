import "server-only";
import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/money";

export type VariantDTO = { id: string; name: string; price: number; isDefault: boolean };
export type AddOnDTO = { id: string; name: string; price: number };

export type DishDTO = {
  id: string;
  slug: string;
  name: string;
  description: string;
  longDescription: string | null;
  price: number;
  discountPrice: number | null;
  effectivePrice: number;
  imageUrl: string;
  isVeg: boolean;
  isJain: boolean;
  isVegan: boolean;
  isBestseller: boolean;
  isNew: boolean;
  isFeatured: boolean;
  spiceLevel: number;
  ingredients: string[];
  allergens: string[];
  portionSize: string | null;
  available: boolean;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  variants: VariantDTO[];
  addOns: AddOnDTO[];
};

export type CategoryDTO = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string;
  dishCount: number;
};

export const PLACEHOLDER_IMAGE = "/images/placeholder.webp";

type DishWithRelations = Prisma.DishGetPayload<{
  include: { variants: true; addOns: true; category: true };
}>;

export function toDishDTO(dish: DishWithRelations): DishDTO {
  const price = toNumber(dish.price);
  const discountPrice = dish.discountPrice === null ? null : toNumber(dish.discountPrice);
  return {
    id: dish.id,
    slug: dish.slug,
    name: dish.name,
    description: dish.description,
    longDescription: dish.longDescription,
    price,
    discountPrice,
    effectivePrice: discountPrice ?? price,
    imageUrl: dish.imageUrl || PLACEHOLDER_IMAGE,
    isVeg: dish.isVeg,
    isJain: dish.isJain,
    isVegan: dish.isVegan,
    isBestseller: dish.isBestseller,
    isNew: dish.isNew,
    isFeatured: dish.isFeatured,
    spiceLevel: dish.spiceLevel,
    ingredients: dish.ingredients,
    allergens: dish.allergens,
    portionSize: dish.portionSize,
    available: dish.available,
    categoryId: dish.categoryId,
    categoryName: dish.category.name,
    categorySlug: dish.category.slug,
    variants: dish.variants
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((v) => ({ id: v.id, name: v.name, price: toNumber(v.price), isDefault: v.isDefault })),
    addOns: dish.addOns
      .filter((a) => a.active)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((a) => ({ id: a.id, name: a.name, price: toNumber(a.price) })),
  };
}

export const getMenu = cache(async (): Promise<{ categories: CategoryDTO[]; dishes: DishDTO[] }> => {
  const [categories, dishes] = await Promise.all([
    prisma.category.findMany({
      where: { active: true },
      orderBy: { displayOrder: "asc" },
      include: { _count: { select: { dishes: { where: { available: true } } } } },
    }),
    prisma.dish.findMany({
      where: { category: { active: true } },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      include: { variants: true, addOns: true, category: true },
    }),
  ]);

  return {
    categories: categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      imageUrl: c.imageUrl || PLACEHOLDER_IMAGE,
      dishCount: c._count.dishes,
    })),
    dishes: dishes.map(toDishDTO),
  };
});

export const getFeaturedDishes = cache(async (limit = 8): Promise<DishDTO[]> => {
  const dishes = await prisma.dish.findMany({
    where: { available: true, OR: [{ isFeatured: true }, { isBestseller: true }] },
    orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }],
    take: limit,
    include: { variants: true, addOns: true, category: true },
  });
  return dishes.map(toDishDTO);
});

export const getDishBySlug = cache(async (slug: string): Promise<DishDTO | null> => {
  const dish = await prisma.dish.findUnique({
    where: { slug },
    include: { variants: true, addOns: true, category: true },
  });
  return dish ? toDishDTO(dish) : null;
});

export const getRelatedDishes = cache(async (categoryId: string, excludeId: string): Promise<DishDTO[]> => {
  const dishes = await prisma.dish.findMany({
    where: { categoryId, available: true, NOT: { id: excludeId } },
    take: 4,
    orderBy: { displayOrder: "asc" },
    include: { variants: true, addOns: true, category: true },
  });
  return dishes.map(toDishDTO);
});

export type OfferDTO = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  type: "PERCENT" | "FIXED";
  value: number;
  minOrderValue: number;
  maxDiscount: number | null;
  badge: string | null;
  expiresAt: string | null;
};

export const getPublicOffers = cache(async (): Promise<OfferDTO[]> => {
  const now = new Date();
  const coupons = await prisma.coupon.findMany({
    where: {
      active: true,
      showOnSite: true,
      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
    },
    orderBy: { displayOrder: "asc" },
  });
  return coupons.map((c) => ({
    id: c.id,
    code: c.code,
    title: c.title,
    description: c.description,
    type: c.type,
    value: toNumber(c.value),
    minOrderValue: toNumber(c.minOrderValue),
    maxDiscount: c.maxDiscount === null ? null : toNumber(c.maxDiscount),
    badge: c.badge,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
  }));
});

export type TestimonialDTO = {
  id: string;
  name: string;
  rating: number;
  message: string;
  photoUrl: string | null;
  location: string | null;
};

export const getTestimonials = cache(async (): Promise<TestimonialDTO[]> => {
  const rows = await prisma.testimonial.findMany({
    where: { active: true },
    orderBy: { displayOrder: "asc" },
  });
  return rows.map((t) => ({
    id: t.id,
    name: t.name,
    rating: t.rating,
    message: t.message,
    photoUrl: t.photoUrl,
    location: t.location,
  }));
});

export type GalleryDTO = { id: string; url: string; caption: string | null; alt: string; category: string };

export const getGallery = cache(async (): Promise<GalleryDTO[]> => {
  const rows = await prisma.galleryImage.findMany({
    where: { active: true },
    orderBy: { displayOrder: "asc" },
  });
  return rows.map((g) => ({
    id: g.id,
    url: g.url,
    caption: g.caption,
    alt: g.alt || g.caption || "Muchhad The Urban Dhaba",
    category: g.category,
  }));
});

/** CMS block with a typed fallback so the site never renders an empty page. */
export const getContent = cache(async <T extends Record<string, unknown>>(key: string, fallback: T): Promise<T> => {
  const block = await prisma.contentBlock.findUnique({ where: { key } });
  if (!block) return fallback;
  return { ...fallback, ...(block.data as T) };
});
