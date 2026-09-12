# Muchhad — The Urban Dhaba

A complete, production-shaped restaurant website: menu, online ordering, WhatsApp / Zomato / Swiggy
ordering, table reservations, offers, gallery, and a role-based admin panel that runs the whole
operation without touching code.

Built with **Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Prisma · PostgreSQL**.

---

## Quick start

You need **Node 20+** and a **PostgreSQL 14+** database. If you don't have Postgres yet, pick one of
the options in [Getting a database](#getting-a-database) below first.

```bash
# 1. Install dependencies
npm install

# If npm reports that install scripts were blocked, approve them —
# sharp needs its install step for image optimisation:
npm approve-scripts --allow-scripts-pending

# 2. Create your env file (note the `cp` — this step is easy to miss)
cp .env.example .env

# 3. Generate a session secret and paste it into .env as AUTH_SECRET
openssl rand -base64 48

# 4. Edit .env and set DATABASE_URL and AUTH_SECRET, then:
npm run db:deploy      # create the schema  (dev alternative: npm run db:migrate)
npm run db:seed        # load the demo menu, offers and orders

# 5. Run it
npm run dev            # http://localhost:3000
```

`DATABASE_URL` and `AUTH_SECRET` are both required. `DATABASE_URL` fails immediately with
`Environment variable not found: DATABASE_URL`; a missing `AUTH_SECRET` fails later, the first time
you try to sign in to the admin panel, so set both now.

### Getting a database

**Homebrew (macOS):**

```bash
brew install postgresql@16
brew services start postgresql@16
createdb muchhad
# DATABASE_URL="postgresql://YOUR_MAC_USERNAME@localhost:5432/muchhad?schema=public"
```

A Homebrew install has no password and uses your system username, so the URL has no `:password` part.
[Postgres.app](https://postgresapp.com) works the same way.

**Docker:**

```bash
docker run -d --name muchhad-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public"
```

**Hosted (Neon, Supabase, Railway):** create a database and paste the connection string it gives you
into `DATABASE_URL`. Add `?sslmode=require` if the provider asks for it.

The seed prints the admin login it created. By default:

| | |
|---|---|
| Admin panel | <http://localhost:3000/admin> |
| Email | `admin@muchhad.test` (`SEED_ADMIN_EMAIL`) |
| Password | `Admin@12345` (`SEED_ADMIN_PASSWORD`) |

It also creates a **Manager** (`manager@muchhad.test`) and a **Staff** (`staff@muchhad.test`) account
with the same password, so you can see how role-based access changes the panel.

> **Change these before deploying anywhere public.**

---

## What's included

### Public website

| Route | What it does |
|---|---|
| `/` | Hero, highlights, featured dishes, categories, order options, offers, gallery, reviews |
| `/menu` | Full menu with instant search and Veg / Non-veg / Bestseller / New / Spicy / Jain / Vegan filters |
| `/menu/[category]` | Single category listing |
| `/dish/[slug]` | Dish detail — ingredients, allergens, portions, add-ons, quantity, cart + WhatsApp |
| `/cart` · `/checkout` | Cart, coupons, delivery/pickup, customer details, payment method |
| `/order-status/[orderNumber]` | Order confirmation and live status tracking |
| `/order` | Order Online hub: direct, Zomato, Swiggy, WhatsApp |
| `/order/zomato` · `/order/swiggy` | Aggregator landing pages (configurable official links) |
| `/whatsapp-order` | Builds a ready-to-send WhatsApp order from the cart, with a live preview |
| `/reserve` | Table reservation |
| `/offers` | Coupons and promotions |
| `/gallery` | Filterable masonry gallery with a keyboard-navigable lightbox |
| `/about` · `/reviews` · `/contact` · `/find-us` | Story, testimonials, contact form, map and directions |

### Admin panel (`/admin`)

Dashboard (today's orders, revenue, pending work, charts) · Orders (7 statuses, inline updates,
order detail) · Reservations (confirm / reject / reschedule / cancel / complete, date range filters) ·
Menu (full dish CRUD with portions, add-ons, labels, image upload) · Categories · Offers & coupons ·
Customers · Inbox · Content (CMS for the hero, highlights and about page) · Gallery · Testimonials ·
Settings (hours, ordering, payments, SEO, notifications) · Integrations (WhatsApp templates, Zomato,
Swiggy, maps, social) · Analytics (revenue, AOV, best sellers, categories, trends) · Team & roles.

### API

Public: `GET /api/settings`, `GET /api/categories`, `GET /api/dishes`, `GET /api/dishes/:id`,
`POST /api/orders`, `GET /api/orders/:orderNumber`, `POST /api/reservations`, `POST /api/contact`,
`POST /api/coupons/validate`.

Admin (session + CSRF required): `POST /api/auth/login`, `POST /api/auth/logout`,
`GET|POST /api/admin/:resource`, `GET|PUT|DELETE /api/admin/:resource/:id`
(`dishes`, `categories`, `coupons`, `testimonials`, `gallery`, `orders`, `reservations`, `customers`,
`messages`, `admins`), plus `/api/admin/settings`, `/api/admin/content`, `/api/admin/analytics`,
`/api/admin/notifications`, `/api/admin/upload`.

---

## How the integrations actually work

**WhatsApp — fully working.** The number, country code and message templates live in the database
(Admin → Integrations). The frontend builds the message from the live cart — items, portions,
add-ons, notes, order type, address and total — URL-encodes it and opens `https://wa.me/<number>?text=…`.
Templates use `{{variables}}`; the admin screen lists them and shows a live preview you can test.

**Zomato and Swiggy — configurable official links, not API integrations.** Neither platform offers a
public ordering API to restaurants, so pretending otherwise would be dishonest. The admin stores the
restaurant's official listing URL and every CTA links there; pages show *Connected / Not connected*
based on whether a URL is set. Nothing is scraped from either platform. If you are ever granted API
credentials, the server-side integration slots in behind the same settings without redesigning the
site.

**Payments.** Cash on delivery and UPI work today. Online payment is wired for an Indian gateway
(Razorpay by default) and stays switched off until `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` are
present — orders are then saved as *payment pending* rather than silently claiming to be paid. Keys
are read server-side only and never reach the browser.

**Email notifications.** Resend-compatible. Without `EMAIL_API_KEY` the app logs that it skipped
delivery instead of reporting a success that never happened. Dashboard notifications always work.

---

## Security

- Session-based admin auth: bcrypt (cost 12) password hashing, signed HS256 session cookie
  (`HttpOnly`, `SameSite=Lax`, `Secure` in production, 8-hour expiry)
- Edge middleware blocks `/admin` and `/api/admin` before they run; every admin route re-checks the
  session against the database, so deactivated accounts and bumped `sessionVersion` stop working at once
- Role-based access (Super Admin / Manager / Staff) with per-account permission overrides, enforced
  server-side on every request and used to build the sidebar
- Double-submit CSRF tokens plus an Origin check on all admin mutations
- Rate limiting on login, orders, reservations, contact, coupon checks and uploads
- Zod validation on every request body; **order totals are always recomputed server-side** from
  database prices, so a tampered client can't set its own price
- Uploads restricted by MIME type and size; `passwordHash` is stripped from every API response
- Secrets only in environment variables — never in the database, the client bundle, or the repo

---

## Performance, SEO and accessibility

- Static rendering with ISR for public pages, `force-dynamic` only where data must be live
- `next/image` with AVIF/WebP, responsive `sizes`, lazy loading below the fold
- Self-hosted fonts via `next/font`, no runtime CSS framework, dependency-free SVG charts
- Restaurant / Menu / MenuItem / Breadcrumb JSON-LD, per-page metadata, Open Graph, canonical URLs,
  `sitemap.xml`, `robots.txt`, web manifest
- Semantic HTML, labelled controls, visible focus rings, `aria-live` regions, keyboard-navigable
  lightbox and menus, `prefers-reduced-motion` support, WCAG-compliant contrast

---

## Demo imagery

Every image is generated locally by `scripts/generate-images.mjs` — stylised SVG food art rendered to
WebP, deterministic per dish slug. It exists so a fresh install looks complete without shipping
licensed photography.

**Replace it with real photos.** Every image path is stored in the database and editable from the
admin panel (Menu → dish, Categories, Gallery, Content, Settings). Uploads go to `/public/uploads` by
default; switch `IMAGE_STORAGE_DRIVER` and add an adapter in `src/app/api/admin/upload/route.ts` for
S3 or Cloudinary.

```bash
npm run images:generate    # rebuild the placeholder set
```

---

## Project layout

```
data/menu.json             Menu catalogue used by the seed and the image generator
prisma/schema.prisma       20 models: menu, orders, reservations, coupons, CMS, settings, admins
prisma/seed.ts             Demo data: 8 categories, 47 dishes, 60 days of orders, offers, reviews
scripts/                   Placeholder image generator
src/app/(site)/            Public website
src/app/admin/             Admin panel (login + (panel) route group)
src/app/api/               Public and admin REST API
src/components/            UI: site chrome, menu, ordering, forms, admin toolkit
src/lib/                   Data access, auth, pricing, settings, WhatsApp, SEO, analytics
```

Money is stored as `Decimal(10,2)` and serialised to plain numbers at the API boundary
(`src/lib/serialize.ts`). Pricing logic is shared between the cart UI and the server
(`src/lib/pricing.ts`) so the customer never sees a total the server disagrees with.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `start` | Production build and server |
| `npm run typecheck` / `lint` | TypeScript and ESLint |
| `npm run db:migrate` / `db:deploy` | Apply migrations (dev / production) |
| `npm run db:seed` / `db:reset` | Load demo data / reset the database |
| `npm run images:generate` | Rebuild placeholder imagery |

## Deploying

### Netlify

The repo ships a `netlify.toml` and the Next.js runtime plugin, so a Netlify
deploy is mostly configuration. Netlify runs the app as serverless functions,
which changes two things: there is no local disk, and there is no database.

**1. Get a PostgreSQL database.** Netlify doesn't host one. [Neon](https://neon.tech)
and [Supabase](https://supabase.com) both have free tiers. Use the **pooled**
connection string — serverless functions open far more connections than a direct
Postgres connection can take:

| Provider | Use |
|---|---|
| Neon | the connection string containing `-pooler` |
| Supabase | the *Connection pooling* string (port `6543`), with `?pgbouncer=true` appended |

**2. Connect the repo** at <https://app.netlify.com/start> → GitHub → this
repository. Leave the build settings alone; `netlify.toml` sets them.

**3. Set environment variables** under Site configuration → Environment
variables, for **all** deploy contexts:

```
DATABASE_URL          your pooled connection string
AUTH_SECRET           openssl rand -base64 48
NEXT_PUBLIC_SITE_URL  https://your-site.netlify.app
RESTAURANT_TIMEZONE   Asia/Kolkata
```

`DATABASE_URL` has to be available at **build** time as well as at runtime —
the menu and dish pages read the restaurant settings while being pre-rendered,
so the build fails without it. Optional: `EMAIL_API_KEY` and `EMAIL_FROM` for
email notifications, `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to enable
online payment.

**4. Deploy.** The build runs `prisma generate && prisma migrate deploy &&
next build`, so your schema is created on the first deploy and kept in step with
the code on every later one.

**5. Seed the demo data once**, from your machine, pointed at the hosted
database (Netlify's build environment is fine for migrations but not the place
to run one-off scripts):

```bash
DATABASE_URL="your-pooled-connection-string" npm run db:seed
```

**6. Sign in** at `https://your-site.netlify.app/admin`, change the seeded
passwords immediately, then set the real address, phone, WhatsApp number and
aggregator links under Settings and Integrations.

Notes specific to serverless:

- **Image uploads switch to Netlify Blobs automatically** (`NETLIFY` is set in
  the runtime), served back through `/api/uploads/<key>`. Nothing to configure —
  but be aware the demo imagery in `/public/images` is committed to the repo and
  served as static files, while anything you upload lives in Blobs.
- **Rate limiting is per-instance.** The in-memory limiter in
  `src/lib/rate-limit.ts` still blunts brute-force attempts, but each function
  instance keeps its own counters, so the effective limit is higher than the
  number configured. Move the store to Upstash Redis or Netlify Blobs if you
  need a hard guarantee.
- **`prisma migrate deploy` runs on every deploy.** It only applies pending
  migrations and never drops data, but it does mean a bad migration ships with
  a bad build — review `prisma/migrations` before merging.

### Anywhere else (VPS, Fly, Render, a container)

A long-running Node server is the simpler deployment: the local upload driver
works, the rate limiter is accurate, and you can use a direct (unpooled)
database connection.

1. Provision PostgreSQL and set `DATABASE_URL`.
2. Set `AUTH_SECRET` (32+ characters) and `NEXT_PUBLIC_SITE_URL`.
3. `npm run db:deploy` then `npm run db:seed` (seed once, then edit through the
   admin panel).
4. `npm run build && npm start`.
5. Sign in to `/admin`, change the seeded passwords, and update Settings and
   Integrations with the real details.

Persist `/public/uploads` on a volume if you use the local storage driver — a
fresh container otherwise starts without the images your admins uploaded.
