import "server-only";
import { revalidatePath } from "next/cache";
import type { ZodType } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Permission } from "@/lib/permissions";
import {
  categoryInputSchema,
  couponInputSchema,
  dishInputSchema,
  galleryInputSchema,
  messageUpdateSchema,
  orderStatusSchema,
  reservationUpdateSchema,
  testimonialInputSchema,
  adminInputSchema,
} from "@/lib/validation";
import { hashPassword } from "@/lib/auth";
import { AppError } from "@/lib/errors";

/* eslint-disable @typescript-eslint/no-explicit-any */

type Delegate = {
  findMany: (args: any) => Promise<any[]>;
  count: (args: any) => Promise<number>;
  findUnique: (args: any) => Promise<any>;
  create: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
};

export type ResourceConfig = {
  permission: Permission;
  writePermission?: Permission;
  delegate: () => Delegate;
  createSchema: ZodType | null;
  updateSchema: ZodType | null;
  include?: Record<string, unknown>;
  listInclude?: Record<string, unknown>;
  orderBy?: unknown;
  searchFields?: string[];
  filterFields?: string[];
  /** Maps validated input onto Prisma data. */
  toData?: (input: any, mode: "create" | "update") => Promise<any> | any;
  /** Full override when nested writes are involved. */
  create?: (input: any) => Promise<any>;
  update?: (id: string, input: any) => Promise<any>;
  beforeDelete?: (id: string) => Promise<void>;
  revalidate?: string[];
};

const nullableText = (value: unknown): string | null =>
  value === "" || value === undefined || value === null ? null : String(value);
const nullableNumber = (value: unknown): number | null =>
  value === "" || value === undefined || value === null ? null : Number(value);

async function writeDishRelations(dishId: string, input: any) {
  const variants = input.variants ?? [];
  const addOns = input.addOns ?? [];

  await prisma.dishVariant.deleteMany({ where: { dishId } });
  if (variants.length) {
    await prisma.dishVariant.createMany({
      data: variants.map((v: any, index: number) => ({
        dishId,
        name: v.name,
        price: v.price,
        isDefault: v.isDefault ?? index === 0,
        displayOrder: v.displayOrder ?? index,
      })),
    });
  }

  await prisma.addOn.deleteMany({ where: { dishId } });
  if (addOns.length) {
    await prisma.addOn.createMany({
      data: addOns.map((a: any, index: number) => ({
        dishId,
        name: a.name,
        price: a.price,
        active: a.active ?? true,
        displayOrder: a.displayOrder ?? index,
      })),
    });
  }
}

function dishScalars(input: any): Prisma.DishUncheckedCreateInput {
  return {
    name: input.name,
    slug: input.slug,
    categoryId: input.categoryId,
    description: input.description,
    longDescription: nullableText(input.longDescription),
    price: input.price,
    discountPrice: nullableNumber(input.discountPrice),
    imageUrl: nullableText(input.imageUrl),
    isVeg: input.isVeg,
    isJain: input.isJain,
    isVegan: input.isVegan,
    isBestseller: input.isBestseller,
    isNew: input.isNew,
    isFeatured: input.isFeatured,
    spiceLevel: input.spiceLevel,
    ingredients: input.ingredients,
    allergens: input.allergens,
    portionSize: nullableText(input.portionSize),
    available: input.available,
    displayOrder: input.displayOrder,
  };
}

export const RESOURCES: Record<string, ResourceConfig> = {
  dishes: {
    permission: "menu.manage",
    delegate: () => prisma.dish,
    createSchema: dishInputSchema,
    updateSchema: dishInputSchema,
    include: { variants: true, addOns: true, category: true },
    listInclude: { category: true, variants: true, addOns: true },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    searchFields: ["name", "slug", "description"],
    filterFields: ["categoryId"],
    create: async (input) => {
      const dish = await prisma.dish.create({ data: dishScalars(input) });
      await writeDishRelations(dish.id, input);
      return prisma.dish.findUnique({ where: { id: dish.id }, include: { variants: true, addOns: true } });
    },
    update: async (id, input) => {
      await prisma.dish.update({ where: { id }, data: dishScalars(input) });
      await writeDishRelations(id, input);
      return prisma.dish.findUnique({ where: { id }, include: { variants: true, addOns: true } });
    },
    revalidate: ["/", "/menu"],
  },

  categories: {
    permission: "categories.manage",
    delegate: () => prisma.category,
    createSchema: categoryInputSchema,
    updateSchema: categoryInputSchema,
    listInclude: { _count: { select: { dishes: true } } },
    orderBy: { displayOrder: "asc" },
    searchFields: ["name", "slug"],
    toData: (input) => ({
      name: input.name,
      slug: input.slug,
      description: nullableText(input.description),
      imageUrl: nullableText(input.imageUrl),
      displayOrder: input.displayOrder,
      active: input.active,
    }),
    beforeDelete: async (id) => {
      const dishes = await prisma.dish.count({ where: { categoryId: id } });
      if (dishes > 0) {
        throw new AppError(
          `This category still has ${dishes} dish${dishes === 1 ? "" : "es"}. Move or delete them first.`,
          409,
        );
      }
    },
    revalidate: ["/", "/menu"],
  },

  coupons: {
    permission: "coupons.manage",
    delegate: () => prisma.coupon,
    createSchema: couponInputSchema,
    updateSchema: couponInputSchema,
    orderBy: { displayOrder: "asc" },
    searchFields: ["code", "title"],
    toData: (input) => ({
      code: input.code.toUpperCase(),
      title: input.title,
      description: nullableText(input.description),
      type: input.type,
      value: input.value,
      maxDiscount: input.maxDiscount ?? null,
      minOrderValue: input.minOrderValue,
      usageLimit: input.usageLimit ?? null,
      perCustomerLimit: input.perCustomerLimit ?? null,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      active: input.active,
      showOnSite: input.showOnSite,
      badge: nullableText(input.badge),
      displayOrder: input.displayOrder,
    }),
    revalidate: ["/", "/offers"],
  },

  testimonials: {
    permission: "testimonials.manage",
    delegate: () => prisma.testimonial,
    createSchema: testimonialInputSchema,
    updateSchema: testimonialInputSchema,
    orderBy: { displayOrder: "asc" },
    searchFields: ["name", "message"],
    toData: (input) => ({
      name: input.name,
      rating: input.rating,
      message: input.message,
      photoUrl: nullableText(input.photoUrl),
      location: nullableText(input.location),
      active: input.active,
      displayOrder: input.displayOrder,
    }),
    revalidate: ["/", "/reviews", "/about"],
  },

  gallery: {
    permission: "gallery.manage",
    delegate: () => prisma.galleryImage,
    createSchema: galleryInputSchema,
    updateSchema: galleryInputSchema,
    orderBy: { displayOrder: "asc" },
    searchFields: ["caption", "category"],
    filterFields: ["category"],
    toData: (input) => ({
      url: input.url,
      caption: nullableText(input.caption),
      alt: nullableText(input.alt),
      category: input.category,
      displayOrder: input.displayOrder,
      active: input.active,
    }),
    revalidate: ["/", "/gallery"],
  },

  orders: {
    permission: "orders.view",
    writePermission: "orders.update",
    delegate: () => prisma.order,
    createSchema: null,
    updateSchema: orderStatusSchema,
    include: { items: true, customer: true, payments: true },
    listInclude: { items: { select: { id: true } } },
    orderBy: { createdAt: "desc" },
    searchFields: ["orderNumber", "customerName", "phone"],
    filterFields: ["status", "type", "paymentStatus"],
    update: async (id, input) => {
      const order = await prisma.order.update({
        where: { id },
        data: {
          status: input.status,
          ...(input.paymentStatus ? { paymentStatus: input.paymentStatus } : {}),
        },
      });
      if (input.paymentStatus) {
        await prisma.payment.updateMany({ where: { orderId: id }, data: { status: input.paymentStatus } });
      }
      return order;
    },
  },

  reservations: {
    permission: "reservations.view",
    writePermission: "reservations.update",
    delegate: () => prisma.reservation,
    createSchema: null,
    updateSchema: reservationUpdateSchema,
    orderBy: [{ date: "asc" }, { time: "asc" }],
    searchFields: ["name", "phone", "reference"],
    filterFields: ["status"],
    toData: (input) => ({
      ...(input.status ? { status: input.status } : {}),
      ...(input.date ? { date: new Date(`${input.date}T00:00:00.000Z`) } : {}),
      ...(input.time ? { time: input.time } : {}),
      ...(input.guests ? { guests: input.guests } : {}),
      ...(input.adminNote !== undefined ? { adminNote: nullableText(input.adminNote) } : {}),
    }),
  },

  customers: {
    permission: "customers.view",
    delegate: () => prisma.customer,
    createSchema: null,
    updateSchema: null,
    orderBy: { createdAt: "desc" },
    searchFields: ["name", "phone", "email"],
    listInclude: { _count: { select: { orders: true, reservations: true } } },
  },

  messages: {
    permission: "messages.view",
    delegate: () => prisma.contactMessage,
    createSchema: null,
    updateSchema: messageUpdateSchema,
    toData: (input) => ({ status: input.status }),
    orderBy: { createdAt: "desc" },
    searchFields: ["name", "subject", "message", "phone"],
    filterFields: ["status"],
  },

  admins: {
    permission: "admins.manage",
    delegate: () => prisma.admin,
    createSchema: adminInputSchema,
    updateSchema: adminInputSchema,
    orderBy: { createdAt: "asc" },
    searchFields: ["name", "email"],
    create: async (input) => {
      if (!input.password) throw new AppError("A password is required for a new admin.", 422);
      return prisma.admin.create({
        data: {
          name: input.name,
          email: input.email.toLowerCase(),
          passwordHash: await hashPassword(input.password),
          role: input.role,
          permissions: input.permissions ?? [],
          active: input.active,
        },
      });
    },
    update: async (id, input) => {
      const data: Record<string, unknown> = {
        name: input.name,
        email: input.email.toLowerCase(),
        role: input.role,
        permissions: input.permissions ?? [],
        active: input.active,
      };
      if (input.password) {
        data.passwordHash = await hashPassword(input.password);
        // Force every existing session for this admin to be re-authenticated.
        data.sessionVersion = { increment: 1 };
      }
      if (input.active === false) data.sessionVersion = { increment: 1 };
      return prisma.admin.update({ where: { id }, data });
    },
  },
};

export function getResource(name: string): ResourceConfig | null {
  return Object.prototype.hasOwnProperty.call(RESOURCES, name) ? RESOURCES[name]! : null;
}

export function revalidateFor(resource: ResourceConfig) {
  for (const path of resource.revalidate ?? []) {
    revalidatePath(path);
  }
}
