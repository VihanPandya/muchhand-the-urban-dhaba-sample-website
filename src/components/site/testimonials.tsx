import type { TestimonialDTO } from "@/lib/queries";
import { Stars } from "@/components/ui";

export function TestimonialGrid({ testimonials }: { testimonials: TestimonialDTO[] }) {
  if (!testimonials.length) return null;

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {testimonials.map((t) => (
        <figure key={t.id} className="card flex h-full flex-col gap-4 p-6">
          <Stars rating={t.rating} />
          <blockquote className="flex-1 text-[15px] leading-relaxed text-ink-600">“{t.message}”</blockquote>
          <figcaption className="flex items-center gap-3 border-t border-ink-100 pt-4">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-saffron-100 font-display text-base font-semibold text-saffron-700">
              {t.name.charAt(0)}
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink-900">{t.name}</span>
              {t.location ? <span className="block text-xs text-ink-400">{t.location}</span> : null}
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
