import Link from "next/link";
import type { ReactNode } from "react";
import { IconFlame, IconStar } from "@/components/icons";

/** The green/red square every Indian menu uses. */
export function VegMark({ isVeg, className = "" }: { isVeg: boolean; className?: string }) {
  const label = isVeg ? "Vegetarian" : "Non-vegetarian";
  return (
    <span
      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] ${
        isVeg ? "border-mint-600" : "border-tandoor-600"
      } ${className}`}
      role="img"
      aria-label={label}
      title={label}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isVeg ? "bg-mint-600" : "bg-tandoor-600"}`} />
    </span>
  );
}

export function SpiceMeter({ level, className = "" }: { level: number; className?: string }) {
  if (level <= 0) return null;
  const labels = ["", "Mild", "Medium", "Hot"];
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} title={`Spice: ${labels[level] ?? level}`}>
      <span className="sr-only">Spice level: {labels[level] ?? level}</span>
      {[1, 2, 3].map((step) => (
        <IconFlame
          key={step}
          className={`h-3.5 w-3.5 ${step <= level ? "text-tandoor-500" : "text-ink-200"}`}
        />
      ))}
    </span>
  );
}

export function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      <span className="sr-only">{rating} out of 5 stars</span>
      {[1, 2, 3, 4, 5].map((step) => (
        <IconStar key={step} className={`h-4 w-4 ${step <= rating ? "text-saffron-400" : "text-ink-200"}`} />
      ))}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  action?: ReactNode;
}) {
  return (
    <div
      className={`mb-10 flex flex-col gap-4 md:flex-row md:items-end ${
        align === "center" ? "md:justify-center" : "md:justify-between"
      }`}
    >
      <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
        {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
        <h2 className="text-3xl leading-tight text-balance md:text-4xl">{title}</h2>
        {description ? <p className="mt-3 text-ink-500 text-pretty md:text-lg">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      {icon ? <div className="mb-1 text-ink-300">{icon}</div> : null}
      <h3 className="text-xl">{title}</h3>
      <p className="max-w-md text-sm text-ink-500">{description}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-400">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-2">
            {item.href ? (
              <Link href={item.href} className="transition hover:text-saffron-600">
                {item.label}
              </Link>
            ) : (
              <span className="text-ink-600">{item.label}</span>
            )}
            {index < items.length - 1 ? <span aria-hidden>/</span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "saffron" | "mint" | "tandoor" | "gold" }) {
  const tones = {
    neutral: "bg-ink-100 text-ink-600",
    saffron: "bg-saffron-100 text-saffron-700",
    mint: "bg-mint-500/12 text-mint-600",
    tandoor: "bg-tandoor-500/12 text-tandoor-600",
    gold: "bg-gold/15 text-[#8a6a22]",
  } as const;
  return <span className={`chip ${tones[tone]}`}>{children}</span>;
}
