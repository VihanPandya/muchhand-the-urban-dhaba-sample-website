import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getContent, getFeaturedDishes, getGallery, getMenu, getPublicOffers, getTestimonials } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { DishCard } from "@/components/menu/dish-card";
import { OrderChannels } from "@/components/site/order-channels";
import { OfferCard } from "@/components/site/offer-card";
import { TestimonialGrid } from "@/components/site/testimonials";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/ui";
import { ICONS_BY_NAME, IconArrowRight, IconStar, type HighlightIcon } from "@/components/icons";

export const revalidate = 120;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return pageMetadata({
    settings,
    title: settings.seoTitle || `${settings.name} — ${settings.tagline}`,
    description:
      settings.seoDescription ||
      "Authentic Punjabi and Amritsari food in Ahmedabad. Order online, on WhatsApp, Zomato or Swiggy, or book a table.",
    path: "/",
  });
}

type HeroContent = {
  eyebrow: string;
  heading: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  image: string;
  stats: { value: string; label: string }[];
};

type HighlightsContent = {
  title: string;
  items: { icon: string; title: string; text: string }[];
};

export default async function HomePage() {
  const [hero, highlights, featured, menu, offers, testimonials, gallery] = await Promise.all([
    getContent<HeroContent>("home.hero", {
      eyebrow: "Amritsari kitchen",
      heading: "Authentic Flavours.\nMade Fresh. Served With Love.",
      description:
        "Experience delicious food prepared with fresh ingredients, authentic flavours, and a passion for great dining.",
      primaryCta: "View Menu",
      secondaryCta: "Order Online",
      image: "/images/hero.webp",
      stats: [],
    }),
    getContent<HighlightsContent>("home.highlights", { title: "Why people keep coming back", items: [] }),
    getFeaturedDishes(8),
    getMenu(),
    getPublicOffers(),
    getTestimonials(),
    getGallery(),
  ]);

  const [headline, ...restHeadline] = hero.heading.split("\n");

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-ink-900">
        <Image
          src={hero.image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/80 via-ink-950/55 to-ink-950/92" aria-hidden />
        <div className="container-x relative py-20 md:py-28 lg:py-36">
          <div className="max-w-2xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-saffron-200 backdrop-blur">
              <IconStar className="h-3.5 w-3.5 text-saffron-300" />
              {hero.eyebrow}
            </p>
            <h1 className="font-display text-4xl leading-[1.08] text-paper text-balance sm:text-5xl lg:text-6xl">
              {headline}
              {restHeadline.length ? (
                <>
                  <br />
                  <span className="text-saffron-300">{restHeadline.join(" ")}</span>
                </>
              ) : null}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-200 text-pretty md:text-lg">
              {hero.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/menu" className="btn btn-primary btn-lg">
                {hero.primaryCta}
              </Link>
              <Link href="/order" className="btn btn-ghost-light btn-lg">
                {hero.secondaryCta}
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-ink-300">Also available on</span>
              <HeroChannelLinks />
            </div>

            {hero.stats.length ? (
              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/12 pt-6">
                {hero.stats.map((stat) => (
                  <div key={stat.label}>
                    <dt className="sr-only">{stat.label}</dt>
                    <dd>
                      <span className="block font-display text-2xl font-semibold text-saffron-300 md:text-3xl">
                        {stat.value}
                      </span>
                      <span className="mt-1 block text-xs leading-snug text-ink-300">{stat.label}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="section bg-paper-dim">
        <div className="container-x">
          <SectionHeading eyebrow="The Muchhad promise" title={highlights.title} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.items.map((item, index) => {
              const Icon = ICONS_BY_NAME[item.icon as HighlightIcon] ?? ICONS_BY_NAME.spark;
              return (
                <Reveal key={item.title} delay={index * 60} className="card flex items-start gap-4 p-5">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-saffron-100 text-saffron-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-display text-base font-semibold text-ink-900">{item.title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-ink-500">{item.text}</span>
                  </span>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured dishes */}
      <section className="section">
        <div className="container-x">
          <SectionHeading
            align="left"
            eyebrow="Straight from the tandoor"
            title="Our Most Loved Dishes"
            description="The plates that come back to the kitchen empty, every single night."
            action={
              <Link href="/menu" className="btn btn-outline">
                View full menu <IconArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((dish, index) => (
              <Reveal key={dish.id} delay={index * 50} className="h-full">
                <DishCard dish={dish} priority={index < 4} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section bg-ink-900 text-paper">
        <div className="container-x">
          <SectionHeading
            align="left"
            eyebrow="Browse by course"
            title="Explore the menu"
            action={
              <Link href="/menu" className="btn btn-ghost-light">
                All {menu.dishes.length} dishes
              </Link>
            }
          />
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 scrollbar-none md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
            {menu.categories.map((category) => (
              <Link
                key={category.id}
                href={`/menu/${category.slug}`}
                className="group relative aspect-[4/5] w-56 shrink-0 overflow-hidden rounded-[var(--radius-card)] md:aspect-[4/3] md:w-auto"
              >
                <Image
                  src={category.imageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 224px, 25vw"
                  className="object-cover transition duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/20 to-transparent" aria-hidden />
                <span className="absolute inset-x-0 bottom-0 p-4">
                  <span className="block font-display text-lg font-semibold text-paper">{category.name}</span>
                  <span className="mt-0.5 block text-xs text-ink-300">{category.dishCount} dishes</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Order options */}
      <section className="section" id="order">
        <div className="container-x">
          <SectionHeading
            eyebrow="Four ways to eat"
            title="Order Online"
            description="Order directly from us for the best price, or use your favourite delivery app."
          />
          <OrderChannels />
        </div>
      </section>

      {/* Offers */}
      {offers.length ? (
        <section className="section bg-paper-dim">
          <div className="container-x">
            <SectionHeading
              align="left"
              eyebrow="Save more"
              title="Offers running right now"
              action={
                <Link href="/offers" className="btn btn-outline">
                  All offers <IconArrowRight className="h-4 w-4" />
                </Link>
              }
            />
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {offers.slice(0, 3).map((offer, index) => (
                <Reveal key={offer.id} delay={index * 60} className="h-full">
                  <OfferCard offer={offer} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* About teaser */}
      <section className="section">
        <div className="container-x grid items-center gap-10 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-card)]">
              <Image src="/images/about-kitchen.webp" alt="Our tandoor kitchen" fill sizes="(max-width:1024px) 45vw, 25vw" className="object-cover" loading="lazy" />
            </div>
            <div className="relative mt-8 aspect-[3/4] overflow-hidden rounded-[var(--radius-card)]">
              <Image src="/images/about-dining.webp" alt="Our dining hall" fill sizes="(max-width:1024px) 45vw, 25vw" className="object-cover" loading="lazy" />
            </div>
          </div>
          <div>
            <p className="eyebrow mb-3">Our story</p>
            <h2 className="text-3xl leading-tight md:text-4xl">
              A highway dhaba that moved to the city — and changed nothing else
            </h2>
            <div className="prose-dhaba mt-4">
              <p>
                The dal still cooks for twelve hours. The kulcha dough still rests overnight. Masalas are pounded in our
                kitchen every morning, never bought pre-mixed.
              </p>
              <p>
                What you get is food that tastes like someone cared about it — because eleven people in our kitchen did.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/about" className="btn btn-dark">
                Read our story
              </Link>
              <Link href="/reserve" className="btn btn-outline">
                Book a table
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery strip */}
      {gallery.length ? (
        <section className="section bg-paper-dim">
          <div className="container-x">
            <SectionHeading
              align="left"
              eyebrow="Inside the dhaba"
              title="Gallery"
              action={
                <Link href="/gallery" className="btn btn-outline">
                  Open gallery <IconArrowRight className="h-4 w-4" />
                </Link>
              }
            />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {gallery.slice(0, 8).map((image) => (
                <Link
                  key={image.id}
                  href="/gallery"
                  className="group relative aspect-square overflow-hidden rounded-2xl"
                >
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 768px) 45vw, 22vw"
                    className="object-cover transition duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Reviews */}
      {testimonials.length ? (
        <section className="section" id="reviews">
          <div className="container-x">
            <SectionHeading
              eyebrow="Guest reviews"
              title="What our guests say"
              description="Reviews collected from our tables, Google and delivery orders."
            />
            <TestimonialGrid testimonials={testimonials.slice(0, 6)} />
          </div>
        </section>
      ) : null}

      {/* Reservation CTA */}
      <section className="section pt-0">
        <div className="container-x">
          <div className="relative isolate overflow-hidden rounded-[2rem] bg-ink-900 px-6 py-14 text-center md:px-16">
            <Image src="/images/about-street.webp" alt="" fill sizes="100vw" className="object-cover opacity-25" loading="lazy" />
            <div className="relative mx-auto max-w-2xl">
              <p className="eyebrow mb-3 text-saffron-300">Reservations</p>
              <h2 className="text-3xl text-paper text-balance md:text-4xl">Save your table before the evening rush</h2>
              <p className="mt-3 text-ink-200 text-pretty">
                Weekends fill up by 7:30pm. Book in a few taps and we&apos;ll confirm on WhatsApp.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link href="/reserve" className="btn btn-primary btn-lg">
                  Book a table
                </Link>
                <Link href="/find-us" className="btn btn-ghost-light btn-lg">
                  Get directions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function HeroChannelLinks() {
  return (
    <span className="flex flex-wrap gap-2">
      <ChannelPill href="/order/zomato" label="Zomato" className="hover:bg-[#e23744] hover:text-white" />
      <ChannelPill href="/order/swiggy" label="Swiggy" className="hover:bg-[#fc8019] hover:text-ink-900" />
      <ChannelPill href="/whatsapp-order" label="WhatsApp" className="hover:bg-[#25d366] hover:text-ink-900" />
    </span>
  );
}

function ChannelPill({ href, label, className }: { href: string; label: string; className: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center rounded-full border border-white/25 bg-white/8 px-3.5 py-1.5 text-xs font-semibold text-paper backdrop-blur transition ${className}`}
    >
      {label}
    </Link>
  );
}
