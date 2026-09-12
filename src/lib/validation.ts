import { z } from "zod";

const phone = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");

const optionalEmail = z
  .union([z.email("Enter a valid email address"), z.literal("")])
  .optional()
  .transform((v) => (v ? v : undefined));

export const cartItemSchema = z.object({
  dishId: z.string().min(1),
  variantId: z.string().optional().nullable(),
  addOnIds: z.array(z.string()).default([]),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(50, "Maximum 50 per dish"),
  notes: z.string().max(200).optional().nullable(),
});

export const createOrderSchema = z
  .object({
    customerName: z.string().trim().min(2, "Please tell us your name").max(80),
    phone,
    email: optionalEmail,
    type: z.enum(["DELIVERY", "PICKUP"]),
    addressLine: z.string().trim().max(300).optional(),
    landmark: z.string().trim().max(120).optional(),
    pincode: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Enter a valid 6-digit pincode")
      .optional()
      .or(z.literal("")),
    notes: z.string().trim().max(300).optional(),
    couponCode: z.string().trim().max(40).optional(),
    paymentMethod: z.enum(["COD", "UPI", "ONLINE"]),
    items: z.array(cartItemSchema).min(1, "Your cart is empty"),
  })
  .refine((data) => data.type !== "DELIVERY" || (data.addressLine && data.addressLine.length > 8), {
    message: "A delivery address is required",
    path: ["addressLine"],
  })
  .refine((data) => data.type !== "DELIVERY" || (data.pincode && /^\d{6}$/.test(data.pincode)), {
    message: "Enter a valid 6-digit pincode",
    path: ["pincode"],
  });

export const reservationSchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name").max(80),
  phone,
  email: optionalEmail,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Choose a time"),
  guests: z.number().int().min(1, "At least 1 guest").max(40, "For parties over 40, please call us"),
  specialRequest: z.string().trim().max(400).optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name").max(80),
  phone,
  email: optionalEmail,
  subject: z.string().trim().min(3, "Add a subject").max(120),
  message: z.string().trim().min(10, "Tell us a little more").max(2000),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const couponCheckSchema = z.object({
  code: z.string().trim().min(2).max(40),
  subtotal: z.number().min(0),
  phone: z.string().trim().optional(),
});

// --- admin --------------------------------------------------------------

const money = z.number().min(0, "Must be zero or more").max(1_000_000);

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(60),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens")
    .max(60),
  description: z.string().trim().max(300).optional().nullable(),
  imageUrl: z.string().trim().max(500).optional().nullable(),
  displayOrder: z.number().int().min(0).max(999).default(0),
  active: z.boolean().default(true),
});

export const dishInputSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(90),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens")
    .max(90),
  categoryId: z.string().min(1, "Choose a category"),
  description: z.string().trim().min(5, "Add a short description").max(300),
  longDescription: z.string().trim().max(2000).optional().nullable(),
  price: money,
  discountPrice: money.nullable().optional(),
  imageUrl: z.string().trim().max(500).optional().nullable(),
  isVeg: z.boolean().default(true),
  isJain: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  spiceLevel: z.number().int().min(0).max(3).default(0),
  ingredients: z.array(z.string().trim().max(60)).max(30).default([]),
  allergens: z.array(z.string().trim().max(40)).max(20).default([]),
  portionSize: z.string().trim().max(60).optional().nullable(),
  available: z.boolean().default(true),
  displayOrder: z.number().int().min(0).max(999).default(0),
  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().trim().min(1).max(40),
        price: money,
        isDefault: z.boolean().default(false),
        displayOrder: z.number().int().min(0).max(99).default(0),
      }),
    )
    .max(10)
    .default([]),
  addOns: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().trim().min(1).max(40),
        price: money,
        active: z.boolean().default(true),
        displayOrder: z.number().int().min(0).max(99).default(0),
      }),
    )
    .max(15)
    .default([]),
});

export const couponInputSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[A-Z0-9_-]{3,20}$/, "Use 3–20 uppercase letters, numbers, - or _"),
  title: z.string().trim().min(3, "Add a title").max(80),
  description: z.string().trim().max(300).optional().nullable(),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.number().min(0.01, "Enter a discount value").max(100000),
  maxDiscount: money.nullable().optional(),
  minOrderValue: money.default(0),
  usageLimit: z.number().int().min(0).max(1_000_000).nullable().optional(),
  perCustomerLimit: z.number().int().min(0).max(1000).nullable().optional(),
  startsAt: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  active: z.boolean().default(true),
  showOnSite: z.boolean().default(true),
  badge: z.string().trim().max(30).optional().nullable(),
  displayOrder: z.number().int().min(0).max(999).default(0),
});

export const testimonialInputSchema = z.object({
  name: z.string().trim().min(2).max(60),
  rating: z.number().int().min(1).max(5),
  message: z.string().trim().min(10, "Add the review text").max(600),
  photoUrl: z.string().trim().max(500).optional().nullable(),
  location: z.string().trim().max(80).optional().nullable(),
  active: z.boolean().default(true),
  displayOrder: z.number().int().min(0).max(999).default(0),
});

export const galleryInputSchema = z.object({
  url: z.string().trim().min(1, "An image is required").max(500),
  caption: z.string().trim().max(140).optional().nullable(),
  alt: z.string().trim().max(160).optional().nullable(),
  category: z.string().trim().min(2).max(40),
  displayOrder: z.number().int().min(0).max(999).default(0),
  active: z.boolean().default(true),
});

export const orderStatusSchema = z.object({
  status: z.enum([
    "NEW",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "OUT_FOR_DELIVERY",
    "COMPLETED",
    "CANCELLED",
  ]),
  paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]).optional(),
});

export const reservationUpdateSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "REJECTED", "COMPLETED", "CANCELLED"]).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  guests: z.number().int().min(1).max(40).optional(),
  adminNote: z.string().trim().max(400).optional().nullable(),
});

export const messageUpdateSchema = z.object({
  status: z.enum(["NEW", "READ", "ARCHIVED"]),
});

export const businessHourSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  isOpen: z.boolean(),
  openTime: z.string().regex(/^\d{2}:\d{2}$/),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export const settingsInputSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  tagline: z.string().trim().max(200).optional(),
  logoUrl: z.string().trim().max(500).nullable().optional(),
  about: z.string().trim().max(4000).nullable().optional(),
  cuisines: z.array(z.string().trim().max(40)).max(12).optional(),
  priceRange: z.string().trim().max(10).optional(),
  address: z.string().trim().max(300).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  mapsUrl: z.string().trim().max(1000).nullable().optional(),
  mapsEmbedUrl: z.string().trim().max(2000).nullable().optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.union([z.email(), z.literal("")]).optional(),
  whatsappNumber: z.string().trim().max(15).optional(),
  whatsappCountryCode: z.string().trim().max(5).optional(),
  whatsappDefaultMessage: z.string().trim().max(600).optional(),
  whatsappOrderTemplate: z.string().trim().max(1200).optional(),
  whatsappReservationTemplate: z.string().trim().max(1200).optional(),
  zomatoUrl: z.union([z.url("Enter a full https:// link"), z.literal("")]).nullable().optional(),
  swiggyUrl: z.union([z.url("Enter a full https:// link"), z.literal("")]).nullable().optional(),
  instagramUrl: z.union([z.url(), z.literal("")]).nullable().optional(),
  facebookUrl: z.union([z.url(), z.literal("")]).nullable().optional(),
  youtubeUrl: z.union([z.url(), z.literal("")]).nullable().optional(),
  googleBusinessUrl: z.union([z.url(), z.literal("")]).nullable().optional(),
  deliveryEnabled: z.boolean().optional(),
  pickupEnabled: z.boolean().optional(),
  directOrderingEnabled: z.boolean().optional(),
  minOrderValue: money.optional(),
  deliveryFee: money.optional(),
  freeDeliveryThreshold: money.nullable().optional(),
  taxPercent: z.number().min(0).max(50).optional(),
  codEnabled: z.boolean().optional(),
  upiEnabled: z.boolean().optional(),
  onlinePaymentEnabled: z.boolean().optional(),
  paymentProvider: z.string().trim().max(40).optional(),
  upiId: z.string().trim().max(80).nullable().optional(),
  openState: z.enum(["AUTO", "OPEN", "CLOSED"]).optional(),
  closedMessage: z.string().trim().max(300).optional(),
  notifyEmail: z.union([z.email(), z.literal("")]).nullable().optional(),
  notifyOnNewOrder: z.boolean().optional(),
  notifyOnReservation: z.boolean().optional(),
  notifyOnContact: z.boolean().optional(),
  seoTitle: z.string().trim().max(120).nullable().optional(),
  seoDescription: z.string().trim().max(300).nullable().optional(),
  ogImage: z.string().trim().max(500).nullable().optional(),
  businessHours: z.array(businessHourSchema).length(7).optional(),
});

export const adminInputSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters").max(100).optional(),
  role: z.enum(["SUPER_ADMIN", "MANAGER", "STAFF"]),
  permissions: z.array(z.string()).max(40).default([]),
  active: z.boolean().default(true),
});

export const contentBlockSchema = z.object({
  key: z.string().trim().min(2).max(60),
  data: z.record(z.string(), z.unknown()),
});
