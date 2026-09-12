/**
 * Demo data for "Muchhad — The Urban Dhaba".
 *
 * Everything here is placeholder content meant to make a fresh install look
 * complete: menu, imagery, offers, reviews, a couple of months of orders for the
 * dashboard charts, and DEMO integration links. Replace the links and imagery
 * from the admin panel before going live.
 */
import { PrismaClient, type OrderStatus, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import path from "node:path";
import { DEFAULT_ORDER_TEMPLATE, DEFAULT_RESERVATION_TEMPLATE } from "../src/lib/whatsapp";

// The Prisma CLI loads .env for `migrate` and `generate`, but this script runs
// as a plain Node process, so load it ourselves before the client is created.
// Missing file is fine — hosting platforms inject real environment variables.
try {
  process.loadEnvFile();
} catch {
  /* no .env on disk */
}

if (!process.env.DATABASE_URL) {
  console.error(
    [
      "DATABASE_URL is not set, so there is no database to seed.",
      "",
      "  1. cp .env.example .env",
      "  2. set DATABASE_URL in .env, for example:",
      '     DATABASE_URL="postgresql://YOUR_USER@localhost:5432/muchhad?schema=public"',
      "",
      "See the README section \"Getting a database\" for the options.",
    ].join("\n"),
  );
  process.exit(1);
}

const prisma = new PrismaClient();

type MenuFile = {
  categories: { slug: string; name: string; art: string; description: string }[];
  dishes: {
    slug: string;
    name: string;
    category: string;
    price: number;
    discountPrice?: number;
    veg: boolean;
    jain?: boolean;
    vegan?: boolean;
    spice: number;
    bestseller?: boolean;
    new?: boolean;
    featured?: boolean;
    description: string;
    long: string;
    ingredients: string[];
    allergens: string[];
    portion: string;
    variants: [string, number][];
    addOns: [string, number][];
  }[];
  gallery: { seed: string; variant: string; art?: string; category: string; caption: string }[];
};

const menu: MenuFile = JSON.parse(
  readFileSync(path.join(process.cwd(), "data/menu.json"), "utf8"),
);

const DEMO_WHATSAPP = process.env.SEED_WHATSAPP_NUMBER || "7600334353";
const DEMO_ZOMATO =
  process.env.SEED_ZOMATO_URL || "https://www.zomato.com/ahmedabad/muchhad-the-urban-dhaba-gota";
const DEMO_SWIGGY =
  process.env.SEED_SWIGGY_URL ||
  "https://www.swiggy.com/restaurants/muchhad-the-urban-dhaba-bopal-bopal-538212";
const DEMO_MAPS = process.env.SEED_MAPS_URL || "https://maps.app.goo.gl/bFB3PFU284sZfAq58";
const DEMO_INSTAGRAM = process.env.SEED_INSTAGRAM_URL || "https://www.instagram.com/muchhad_urbandhaba/";

async function seedSettings() {
  const data = {
    name: "Muchhad — The Urban Dhaba",
    tagline: "Authentic Flavours. Made Fresh. Served With Love.",
    logoUrl: "/logo.svg",
    about:
      "A highway dhaba's heart with a city restaurant's comfort. Charcoal tandoors, hand-pounded masalas and Amritsari kulchas served hot off the griddle.",
    cuisines: ["North Indian", "Punjabi", "Amritsari", "Tandoor"],
    priceRange: "₹₹",
    address: "Box Park, Opp. Jaguar Showroom, Vasant Nagar, Gota, Ahmedabad, Gujarat 382481",
    latitude: 23.1012,
    longitude: 72.5468,
    mapsUrl: DEMO_MAPS,
    mapsEmbedUrl: "",
    phone: "+917600334353",
    email: "hello@muchhadurbandhaba.example",
    whatsappNumber: DEMO_WHATSAPP,
    whatsappCountryCode: "91",
    whatsappDefaultMessage: "Hello {{restaurant_name}}! I'd like to know more about your menu.",
    whatsappOrderTemplate: DEFAULT_ORDER_TEMPLATE,
    whatsappReservationTemplate: DEFAULT_RESERVATION_TEMPLATE,
    zomatoUrl: DEMO_ZOMATO,
    swiggyUrl: DEMO_SWIGGY,
    instagramUrl: DEMO_INSTAGRAM,
    facebookUrl: "https://www.facebook.com/muchhad.urban.dhaba",
    youtubeUrl: null,
    googleBusinessUrl: DEMO_MAPS,
    deliveryEnabled: true,
    pickupEnabled: true,
    directOrderingEnabled: true,
    minOrderValue: 199,
    deliveryFee: 39,
    freeDeliveryThreshold: 799,
    taxPercent: 5,
    codEnabled: true,
    upiEnabled: true,
    onlinePaymentEnabled: false,
    paymentProvider: "razorpay",
    upiId: "muchhad@demoupi",
    openState: "AUTO" as const,
    closedMessage: "We're currently closed.",
    notifyEmail: "orders@muchhadurbandhaba.example",
    seoTitle: "Muchhad — The Urban Dhaba | Punjabi & Amritsari food in Ahmedabad",
    seoDescription:
      "Amritsari kulcha, butter chicken, dal makhani and charcoal tandoor kebabs. Order online, on WhatsApp, Zomato or Swiggy, or book a table.",
    ogImage: "/images/og.webp",
  };

  await prisma.restaurantSettings.upsert({ where: { id: "default" }, create: { id: "default", ...data }, update: data });

  const hours = [
    { dayOfWeek: 0, isOpen: true, openTime: "11:00", closeTime: "23:30" },
    { dayOfWeek: 1, isOpen: true, openTime: "11:00", closeTime: "23:00" },
    { dayOfWeek: 2, isOpen: true, openTime: "11:00", closeTime: "23:00" },
    { dayOfWeek: 3, isOpen: true, openTime: "11:00", closeTime: "23:00" },
    { dayOfWeek: 4, isOpen: true, openTime: "11:00", closeTime: "23:00" },
    { dayOfWeek: 5, isOpen: true, openTime: "11:00", closeTime: "23:59" },
    { dayOfWeek: 6, isOpen: true, openTime: "11:00", closeTime: "23:59" },
  ];
  for (const hour of hours) {
    await prisma.businessHours.upsert({
      where: { dayOfWeek: hour.dayOfWeek },
      create: hour,
      update: hour,
    });
  }
}

async function seedAdmins() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@muchhad.test";
  const password = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";
  const passwordHash = await bcrypt.hash(password, 12);

  const people = [
    { name: "Restaurant Owner", email, role: "SUPER_ADMIN" as const },
    { name: "Floor Manager", email: "manager@muchhad.test", role: "MANAGER" as const },
    { name: "Counter Staff", email: "staff@muchhad.test", role: "STAFF" as const },
  ];

  for (const person of people) {
    await prisma.admin.upsert({
      where: { email: person.email },
      create: { ...person, passwordHash },
      update: { name: person.name, role: person.role },
    });
  }
  console.log(`  admin login: ${email} / ${password}`);
}

async function seedMenu() {
  const categoryIds = new Map<string, string>();

  for (const [index, category] of menu.categories.entries()) {
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      create: {
        slug: category.slug,
        name: category.name,
        description: category.description,
        imageUrl: `/images/categories/${category.slug}.webp`,
        displayOrder: index,
        active: true,
      },
      update: {
        name: category.name,
        description: category.description,
        imageUrl: `/images/categories/${category.slug}.webp`,
        displayOrder: index,
      },
    });
    categoryIds.set(category.slug, record.id);
  }

  for (const [index, dish] of menu.dishes.entries()) {
    const categoryId = categoryIds.get(dish.category);
    if (!categoryId) throw new Error(`Unknown category ${dish.category} for dish ${dish.slug}`);

    const base = {
      name: dish.name,
      categoryId,
      description: dish.description,
      longDescription: dish.long,
      price: dish.price,
      discountPrice: dish.discountPrice ?? null,
      imageUrl: `/images/dishes/${dish.slug}.webp`,
      isVeg: dish.veg,
      isJain: dish.jain ?? false,
      isVegan: dish.vegan ?? false,
      isBestseller: dish.bestseller ?? false,
      isNew: dish.new ?? false,
      isFeatured: dish.featured ?? false,
      spiceLevel: dish.spice,
      ingredients: dish.ingredients,
      allergens: dish.allergens,
      portionSize: dish.portion,
      available: true,
      displayOrder: index,
    };

    const record = await prisma.dish.upsert({
      where: { slug: dish.slug },
      create: { slug: dish.slug, ...base },
      update: base,
    });

    await prisma.dishVariant.deleteMany({ where: { dishId: record.id } });
    if (dish.variants.length) {
      await prisma.dishVariant.createMany({
        data: dish.variants.map(([name, price], i) => ({
          dishId: record.id,
          name,
          price,
          isDefault: i === 0,
          displayOrder: i,
        })),
      });
    }

    await prisma.addOn.deleteMany({ where: { dishId: record.id } });
    if (dish.addOns.length) {
      await prisma.addOn.createMany({
        data: dish.addOns.map(([name, price], i) => ({
          dishId: record.id,
          name,
          price,
          active: true,
          displayOrder: i,
        })),
      });
    }
  }
}

async function seedOffers() {
  const now = new Date();
  const inDays = (days: number) => new Date(now.getTime() + days * 86400000);

  const coupons = [
    {
      code: "FIRST10",
      title: "10% OFF",
      description: "Get 10% off on your first direct order from us.",
      type: "PERCENT" as const,
      value: 10,
      maxDiscount: 150,
      minOrderValue: 299,
      usageLimit: 500,
      perCustomerLimit: 1,
      expiresAt: inDays(90),
      badge: "First order",
      displayOrder: 0,
    },
    {
      code: "FAMILY150",
      title: "Family Combo",
      description: "₹150 off on family orders above ₹999. Thali, breads and dessert included.",
      type: "FIXED" as const,
      value: 150,
      maxDiscount: null,
      minOrderValue: 999,
      usageLimit: null,
      perCustomerLimit: null,
      expiresAt: inDays(60),
      badge: "Save ₹150",
      displayOrder: 1,
    },
    {
      code: "WEEKEND15",
      title: "Weekend Special",
      description: "15% off every Saturday and Sunday on direct orders.",
      type: "PERCENT" as const,
      value: 15,
      maxDiscount: 250,
      minOrderValue: 599,
      usageLimit: null,
      perCustomerLimit: 4,
      expiresAt: inDays(120),
      badge: "Sat & Sun",
      displayOrder: 2,
    },
    {
      code: "KULCHA50",
      title: "₹50 off on Kulcha",
      description: "Flat ₹50 off when your order includes our signature Amritsari Kulcha.",
      type: "FIXED" as const,
      value: 50,
      maxDiscount: null,
      minOrderValue: 399,
      usageLimit: 200,
      perCustomerLimit: 2,
      expiresAt: inDays(45),
      badge: "Signature",
      displayOrder: 3,
    },
  ];

  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      create: { ...coupon, active: true, showOnSite: true },
      update: coupon,
    });
  }
}

async function seedContent() {
  const testimonials = [
    { name: "Rahul Mehta", rating: 5, location: "Gota", message: "Excellent food and amazing service. Everything tasted fresh and authentic — the kulcha is the real deal." },
    { name: "Priya Shah", rating: 5, location: "Bopal", message: "We ordered the family thali for six people and not a single plate went back. Butter chicken was outstanding." },
    { name: "Aman Verma", rating: 4, location: "Thaltej", message: "Proper dhaba flavours without the highway drive. Dal makhani tastes like it has been cooking all day, because it has." },
    { name: "Sneha Patel", rating: 5, location: "Science City", message: "Booked a table for a birthday. The team decorated the corner booth and the brownie sizzler arrived with sparklers." },
    { name: "Imran Qureshi", rating: 5, location: "Chandkheda", message: "Ordered on WhatsApp at 11pm and food reached hot in 30 minutes. Mutton rogan josh was falling off the bone." },
    { name: "Kavita Joshi", rating: 4, location: "Vaishnodevi", message: "Jain options were handled carefully and the staff actually knew what they were talking about. Rare and appreciated." },
  ];

  for (const [index, t] of testimonials.entries()) {
    const existing = await prisma.testimonial.findFirst({ where: { name: t.name, message: t.message } });
    if (existing) continue;
    await prisma.testimonial.create({ data: { ...t, displayOrder: index, active: true } });
  }

  for (const [index, image] of menu.gallery.entries()) {
    const url = `/images/gallery/${image.seed}.webp`;
    const existing = await prisma.galleryImage.findFirst({ where: { url } });
    const data = {
      url,
      caption: image.caption,
      alt: `${image.caption} at Muchhad The Urban Dhaba`,
      category: image.category,
      displayOrder: index,
      active: true,
    };
    if (existing) {
      await prisma.galleryImage.update({ where: { id: existing.id }, data });
    } else {
      await prisma.galleryImage.create({ data });
    }
  }

  const blocks: { key: string; data: Prisma.InputJsonValue }[] = [
    {
      key: "home.hero",
      data: {
        eyebrow: "Amritsari kitchen · Ahmedabad",
        heading: "Authentic Flavours.\nMade Fresh. Served With Love.",
        description:
          "Experience delicious food prepared with fresh ingredients, authentic flavours, and a passion for great dining — charcoal tandoors, hand-pounded masalas and kulchas cracked open at your table.",
        primaryCta: "View Menu",
        secondaryCta: "Order Online",
        image: "/images/hero.webp",
        stats: [
          { value: "12+", label: "Years of dhaba cooking" },
          { value: "4.6★", label: "Rated by 2,400+ guests" },
          { value: "45 min", label: "Average delivery" },
        ],
      },
    },
    {
      key: "home.highlights",
      data: {
        title: "Why people keep coming back",
        items: [
          { icon: "leaf", title: "Fresh Ingredients", text: "Vegetables cut daily, paneer set in-house every morning." },
          { icon: "flame", title: "Authentic Taste", text: "Masalas pounded in our kitchen, never bought pre-mixed." },
          { icon: "shield", title: "Hygienic Kitchen", text: "FSSAI-compliant kitchen with open-kitchen viewing." },
          { icon: "clock", title: "Fast Service", text: "Most tables served within 15 minutes of ordering." },
          { icon: "users", title: "Family Friendly", text: "High chairs, Jain options and a quiet family section." },
          { icon: "scooter", title: "Delivery Available", text: "Direct delivery, plus Zomato and Swiggy." },
        ],
      },
    },
    {
      key: "about",
      data: {
        title: "A highway dhaba that moved to the city",
        story:
          "Muchhad started as a roadside tandoor on the Ahmedabad–Mehsana highway, where truck drivers stopped for kulcha at two in the morning. The moustache on our sign belonged to the founder, and the recipes still belong to his kitchen.\n\nWhen we moved into the city, we brought the clay oven, the copper handi and the stubbornness about doing things the long way. The dal still cooks for twelve hours. The kulcha dough still rests overnight. The only thing that changed is the seating.",
        philosophy:
          "Cook it the way it was cooked at home, serve it the way it was served on the highway — generously, and without fuss.",
        chefName: "Chef Harpreet Singh",
        chefTitle: "Head Chef · 22 years in Punjabi kitchens",
        chefNote:
          "I learned this food standing next to my father at a tandoor in Amritsar. Nothing here is quick, and that is the point.",
        images: ["/images/about-dining.webp", "/images/about-kitchen.webp", "/images/about-street.webp"],
        stats: [
          { value: "2012", label: "Founded on the highway" },
          { value: "12 hrs", label: "Dal makhani cook time" },
          { value: "100%", label: "In-house ground masalas" },
          { value: "47", label: "Dishes on the menu" },
        ],
      },
    },
  ];

  for (const block of blocks) {
    await prisma.contentBlock.upsert({
      where: { key: block.key },
      create: block,
      update: { data: block.data },
    });
  }
}

/** A couple of months of orders so the dashboard and analytics have shape. */
async function seedOperations() {
  const existing = await prisma.order.count();
  if (existing > 0) {
    console.log("  orders already present — skipping demo operations");
    return;
  }

  const dishes = await prisma.dish.findMany({ include: { variants: true } });
  const names = [
    ["Rahul Mehta", "9825012345"],
    ["Priya Shah", "9727098765"],
    ["Aman Verma", "9909011223"],
    ["Sneha Patel", "9016778899"],
    ["Imran Qureshi", "9033445566"],
    ["Kavita Joshi", "9879012345"],
    ["Devansh Trivedi", "9825566778"],
    ["Meera Nair", "9712334455"],
  ] as const;
  const statuses: OrderStatus[] = [
    "COMPLETED",
    "COMPLETED",
    "COMPLETED",
    "COMPLETED",
    "CANCELLED",
    "NEW",
    "PREPARING",
    "OUT_FOR_DELIVERY",
  ];

  let seedValue = 42;
  const random = () => {
    seedValue = (seedValue * 1103515245 + 12345) % 2147483648;
    return seedValue / 2147483648;
  };

  for (let dayOffset = 59; dayOffset >= 0; dayOffset--) {
    const ordersToday = 2 + Math.floor(random() * 5) + (dayOffset % 7 === 0 || dayOffset % 7 === 6 ? 3 : 0);
    for (let n = 0; n < ordersToday; n++) {
      const created = new Date();
      created.setDate(created.getDate() - dayOffset);
      created.setHours(12 + Math.floor(random() * 10), Math.floor(random() * 60), 0, 0);

      const [name, phone] = names[Math.floor(random() * names.length)]!;
      const itemCount = 1 + Math.floor(random() * 4);
      const picked = new Set<string>();
      const items = [] as {
        dishId: string;
        dishName: string;
        variantName: string | null;
        unitPrice: number;
        quantity: number;
        lineTotal: number;
      }[];

      for (let i = 0; i < itemCount; i++) {
        const dish = dishes[Math.floor(random() * dishes.length)]!;
        if (picked.has(dish.id)) continue;
        picked.add(dish.id);
        const variant = dish.variants[0];
        const unitPrice = Number(variant ? variant.price : (dish.discountPrice ?? dish.price));
        const quantity = 1 + Math.floor(random() * 2);
        items.push({
          dishId: dish.id,
          dishName: dish.name,
          variantName: variant?.name ?? null,
          unitPrice,
          quantity,
          lineTotal: Math.round(unitPrice * quantity * 100) / 100,
        });
      }
      if (!items.length) continue;

      const subtotal = Math.round(items.reduce((s, i) => s + i.lineTotal, 0) * 100) / 100;
      const isDelivery = random() > 0.35;
      const deliveryFee = isDelivery && subtotal < 799 ? 39 : 0;
      const taxAmount = Math.round(subtotal * 0.05 * 100) / 100;
      const total = Math.round((subtotal + taxAmount + deliveryFee) * 100) / 100;
      const status = dayOffset < 2 ? statuses[5 + Math.floor(random() * 3)]! : statuses[Math.floor(random() * 5)]!;

      const customer = await prisma.customer.upsert({
        where: { phone },
        create: {
          name,
          phone,
          email: `${name.split(" ")[0]!.toLowerCase()}@example.com`,
          addressLine: "12, Silver Oak Residency, Gota",
          pincode: "382481",
          ordersCount: 1,
          totalSpend: total,
          lastOrderAt: created,
        },
        update: {
          ordersCount: { increment: 1 },
          totalSpend: { increment: total },
          lastOrderAt: created,
        },
      });

      await prisma.order.create({
        data: {
          orderNumber: `MUD-${created.toISOString().slice(2, 10).replace(/-/g, "")}-${1000 + Math.floor(random() * 8999)}`,
          customerId: customer.id,
          customerName: name,
          phone,
          email: customer.email,
          type: isDelivery ? "DELIVERY" : "PICKUP",
          status,
          addressLine: isDelivery ? "12, Silver Oak Residency, Gota" : null,
          pincode: isDelivery ? "382481" : null,
          subtotal,
          taxAmount,
          deliveryFee,
          discountAmount: 0,
          total,
          paymentMethod: random() > 0.5 ? "COD" : "UPI",
          paymentStatus: status === "COMPLETED" ? "PAID" : "PENDING",
          source: random() > 0.8 ? "WHATSAPP" : "WEB",
          createdAt: created,
          updatedAt: created,
          items: { create: items },
        },
      });
    }
  }

  const reservationSeeds = [
    { name: "Rahul Mehta", phone: "9825012345", guests: 4, offset: 1, time: "20:00", status: "CONFIRMED" as const },
    { name: "Sneha Patel", phone: "9016778899", guests: 8, offset: 2, time: "19:30", status: "PENDING" as const, note: "Birthday — please arrange a cake table." },
    { name: "Aman Verma", phone: "9909011223", guests: 2, offset: 0, time: "21:00", status: "PENDING" as const },
    { name: "Meera Nair", phone: "9712334455", guests: 6, offset: 5, time: "13:00", status: "CONFIRMED" as const, note: "Jain food only." },
    { name: "Imran Qureshi", phone: "9033445566", guests: 3, offset: -3, time: "20:30", status: "COMPLETED" as const },
  ];

  for (const r of reservationSeeds) {
    const date = new Date();
    date.setDate(date.getDate() + r.offset);
    date.setHours(0, 0, 0, 0);
    await prisma.reservation.create({
      data: {
        reference: `RSV-${date.toISOString().slice(2, 10).replace(/-/g, "")}-${100 + Math.floor(Math.random() * 899)}`,
        name: r.name,
        phone: r.phone,
        email: `${r.name.split(" ")[0]!.toLowerCase()}@example.com`,
        date,
        time: r.time,
        guests: r.guests,
        specialRequest: r.note,
        status: r.status,
      },
    });
  }

  await prisma.contactMessage.createMany({
    data: [
      {
        name: "Nikhil Bhatt",
        phone: "9825123456",
        email: "nikhil@example.com",
        subject: "Bulk catering for 80 people",
        message: "We have an office event on the 21st and would like a veg + non-veg counter. Can you share a quote?",
      },
      {
        name: "Ritu Desai",
        phone: "9726554433",
        email: "ritu@example.com",
        subject: "Lost phone at your restaurant",
        message: "I think I left my phone at table 7 last night around 10pm. Could someone check?",
        status: "READ",
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      { type: "ORDER", title: "New order received", message: "A new delivery order is waiting to be confirmed.", link: "/admin/orders" },
      { type: "RESERVATION", title: "New table reservation", message: "Sneha Patel requested a table for 8.", link: "/admin/reservations" },
      { type: "CONTACT", title: "New enquiry", message: "Nikhil Bhatt asked about bulk catering.", link: "/admin/messages" },
    ],
  });
}

async function main() {
  console.log("Seeding Muchhad — The Urban Dhaba…");
  await seedSettings();
  await seedAdmins();
  await seedMenu();
  await seedOffers();
  await seedContent();
  await seedOperations();

  const [categories, dishes, orders, reservations] = await Promise.all([
    prisma.category.count(),
    prisma.dish.count(),
    prisma.order.count(),
    prisma.reservation.count(),
  ]);
  console.log(`Done — ${categories} categories, ${dishes} dishes, ${orders} orders, ${reservations} reservations.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
