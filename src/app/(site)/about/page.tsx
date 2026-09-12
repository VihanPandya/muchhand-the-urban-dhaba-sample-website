import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getContent, getTestimonials } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { TestimonialGrid } from "@/components/site/testimonials";
import { Breadcrumbs, SectionHeading } from "@/components/ui";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return pageMetadata({
    settings,
    title: "About Us",
    description: `The story behind ${settings.name} — our kitchen, our chef and the way we cook.`,
    path: "/about",
  });
}

type AboutContent = {
  title: string;
  story: string;
  philosophy: string;
  chefName: string;
  chefTitle: string;
  chefNote: string;
  images: string[];
  stats: { value: string; label: string }[];
};

export default async function AboutPage() {
  const [about, testimonials] = await Promise.all([
    getContent<AboutContent>("about", {
      title: "Our story",
      story: "",
      philosophy: "",
      chefName: "",
      chefTitle: "",
      chefNote: "",
      images: ["/images/about-dining.webp"],
      stats: [],
    }),
    getTestimonials(),
  ]);

  return (
    <div>
      <div className="relative isolate overflow-hidden bg-ink-900">
        <Image src={about.images[0] ?? "/images/about-dining.webp"} alt="" fill sizes="100vw" className="object-cover opacity-50" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/95 to-ink-950/50" aria-hidden />
        <div className="container-x relative py-20 md:py-28">
          <p className="eyebrow mb-3 text-saffron-300">Since 2012</p>
          <h1 className="max-w-3xl text-4xl leading-tight text-paper text-balance md:text-5xl lg:text-6xl">
            {about.title}
          </h1>
        </div>
      </div>

      <div className="container-x py-12 md:py-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} />

        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
          <div className="prose-dhaba max-w-none text-[17px]">
            {about.story.split("\n\n").map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}

            {about.philosophy ? (
              <blockquote className="my-8 border-l-4 border-saffron-400 bg-saffron-50 px-6 py-5">
                <p className="font-display text-xl leading-snug text-ink-900">“{about.philosophy}”</p>
              </blockquote>
            ) : null}

            <h2 className="mt-10 text-2xl">The kitchen</h2>
            <p>
              Eleven people work the line every service. Two are on the tandoor from four in the afternoon, one does
              nothing but kulcha, and the rest keep the gravies moving. Masalas are roasted and ground in-house every
              morning — coriander, cumin, fennel, dry red chilli, black cardamom.
            </p>
            <p>
              Paneer is set fresh each day. Vegetables are cut after the morning mandi run, never the night before. The
              dal makhani goes on at midnight and comes off at noon; there is no faster way to make it taste right.
            </p>

            <h2 className="mt-10 text-2xl">What we won&apos;t do</h2>
            <p>
              No artificial colour in the tandoori marinade. No reheated gravy bases bought in bulk. No shortcuts on the
              dal. If a dish can&apos;t be made properly on a given day, it comes off the menu for that day.
            </p>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-28">
            {about.stats.length ? (
              <dl className="card grid grid-cols-2 gap-4 p-6">
                {about.stats.map((stat) => (
                  <div key={stat.label}>
                    <dt className="sr-only">{stat.label}</dt>
                    <dd>
                      <span className="block font-display text-2xl font-semibold text-saffron-600">{stat.value}</span>
                      <span className="mt-0.5 block text-xs leading-snug text-ink-500">{stat.label}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <div className="card overflow-hidden">
              <div className="relative aspect-[4/3]">
                <Image
                  src={about.images[1] ?? "/images/about-kitchen.webp"}
                  alt="Our kitchen"
                  fill
                  sizes="(max-width: 1024px) 100vw, 380px"
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <p className="font-display text-lg font-semibold">{about.chefName}</p>
                <p className="text-sm text-saffron-600">{about.chefTitle}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink-500">“{about.chefNote}”</p>
              </div>
            </div>

            <div className="card p-5">
              <h2 className="font-display text-base font-semibold">Come see for yourself</h2>
              <p className="mt-2 text-sm text-ink-500">
                The kitchen is open to view from the dining hall. Ask and we&apos;ll walk you through it.
              </p>
              <div className="mt-4 space-y-2">
                <Link href="/reserve" className="btn btn-primary w-full">
                  Book a table
                </Link>
                <Link href="/gallery" className="btn btn-outline w-full">
                  See the gallery
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {about.images.length > 2 ? (
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {about.images.map((image, index) => (
              <div key={image} className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)]">
                <Image
                  src={image}
                  alt={["Our dining hall", "Our kitchen", "The entrance"][index] ?? "Muchhad The Urban Dhaba"}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        ) : null}

        {testimonials.length ? (
          <section className="mt-16">
            <SectionHeading eyebrow="Guest reviews" title="What our guests say" />
            <TestimonialGrid testimonials={testimonials.slice(0, 3)} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
