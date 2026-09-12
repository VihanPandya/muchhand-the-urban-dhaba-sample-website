"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { CategoryDTO, DishDTO } from "@/lib/queries";
import { DishCard } from "@/components/menu/dish-card";
import { EmptyState } from "@/components/ui";
import { IconClose, IconSearch } from "@/components/icons";

type FilterKey = "all" | "veg" | "nonveg" | "bestseller" | "new" | "spicy" | "jain" | "vegan";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "veg", label: "Vegetarian" },
  { key: "nonveg", label: "Non-Vegetarian" },
  { key: "bestseller", label: "Bestseller" },
  { key: "new", label: "New" },
  { key: "spicy", label: "Spicy" },
  { key: "jain", label: "Jain" },
  { key: "vegan", label: "Vegan" },
];

const MATCHERS: Record<FilterKey, (dish: DishDTO) => boolean> = {
  all: () => true,
  veg: (d) => d.isVeg,
  nonveg: (d) => !d.isVeg,
  bestseller: (d) => d.isBestseller,
  new: (d) => d.isNew,
  spicy: (d) => d.spiceLevel >= 2,
  jain: (d) => d.isJain,
  vegan: (d) => d.isVegan,
};

export function MenuBrowser({
  categories,
  dishes,
  initialCategory = null,
}: {
  categories: CategoryDTO[];
  dishes: DishDTO[];
  initialCategory?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [activeCategory, setActiveCategory] = useState<string | null>(initialCategory);
  const deferredQuery = useDeferredValue(query);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  const filtered = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    return dishes.filter((dish) => {
      if (!MATCHERS[filter](dish)) return false;
      if (activeCategory && dish.categorySlug !== activeCategory) return false;
      if (!needle) return true;
      return (
        dish.name.toLowerCase().includes(needle) ||
        dish.description.toLowerCase().includes(needle) ||
        dish.categoryName.toLowerCase().includes(needle) ||
        dish.ingredients.some((i) => i.toLowerCase().includes(needle))
      );
    });
  }, [dishes, deferredQuery, filter, activeCategory]);

  const grouped = useMemo(() => {
    const map = new Map<string, { category: CategoryDTO; dishes: DishDTO[] }>();
    for (const category of categories) {
      map.set(category.slug, { category, dishes: [] });
    }
    for (const dish of filtered) {
      map.get(dish.categorySlug)?.dishes.push(dish);
    }
    return [...map.values()].filter((group) => group.dishes.length > 0);
  }, [categories, filtered]);

  const reset = () => {
    setQuery("");
    setFilter("all");
    setActiveCategory(null);
  };

  return (
    <div>
      <div className="sticky top-16 z-30 -mx-4 mb-8 border-b border-ink-100 bg-paper/95 px-4 py-3 backdrop-blur-md md:top-20 md:mx-0 md:rounded-2xl md:border md:px-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="field pl-11"
              placeholder="Search dishes…"
              aria-label="Search dishes"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-400 transition hover:bg-ink-900/5"
                aria-label="Clear search"
              >
                <IconClose className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none" role="group" aria-label="Dietary filters">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                aria-pressed={filter === item.key}
                className={`chip shrink-0 border-[1.5px] transition ${
                  filter === item.key
                    ? "border-saffron-400 bg-saffron-400 text-ink-900"
                    : "border-ink-200 bg-white text-ink-600 hover:border-ink-300"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none" role="group" aria-label="Menu categories">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              aria-pressed={activeCategory === null}
              className={`chip shrink-0 transition ${
                activeCategory === null ? "bg-ink-900 text-paper" : "bg-ink-100 text-ink-600 hover:bg-ink-200/60"
              }`}
            >
              Everything
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.slug)}
                aria-pressed={activeCategory === category.slug}
                className={`chip shrink-0 transition ${
                  activeCategory === category.slug
                    ? "bg-ink-900 text-paper"
                    : "bg-ink-100 text-ink-600 hover:bg-ink-200/60"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mb-6 text-sm text-ink-400" aria-live="polite" ref={resultsRef}>
        Showing <strong className="text-ink-700">{filtered.length}</strong> of {dishes.length} dishes
      </p>

      {grouped.length === 0 ? (
        <EmptyState
          title="No dishes found"
          description="Nothing matches that search or filter combination. Try a different keyword, or clear the filters to see the full menu."
          action={
            <button type="button" onClick={reset} className="btn btn-primary">
              Clear filters
            </button>
          }
          icon={<IconSearch className="h-9 w-9" />}
        />
      ) : (
        <div className="space-y-14">
          {grouped.map((group) => (
            <section key={group.category.id} id={group.category.slug} aria-labelledby={`heading-${group.category.slug}`}>
              <div className="mb-5 flex items-end justify-between gap-4 border-b border-ink-100 pb-3">
                <div>
                  <h2 id={`heading-${group.category.slug}`} className="text-2xl">
                    {group.category.name}
                  </h2>
                  {group.category.description ? (
                    <p className="mt-1 text-sm text-ink-500">{group.category.description}</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-xs text-ink-400">{group.dishes.length} items</span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.dishes.map((dish) => (
                  <DishCard key={dish.id} dish={dish} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
