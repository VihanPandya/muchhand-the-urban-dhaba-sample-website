"use client";

import Image from "next/image";
import { ResourceManager } from "@/components/admin/resource-manager";
import { StatusBadge } from "@/components/admin/ui";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
  active: boolean;
  _count?: { dishes: number };
};

export function CategoriesManager() {
  return (
    <ResourceManager<CategoryRow>
      resource="categories"
      title="Categories"
      singularLabel="Category"
      description="Menu sections, in the order they appear on the website."
      emptyMessage="No categories yet. Add the first one to start building the menu."
      defaults={{ name: "", slug: "", description: "", imageUrl: "", displayOrder: 0, active: true }}
      columns={[
        {
          key: "name",
          label: "Category",
          render: (row) => (
            <span className="flex items-center gap-3">
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                {row.imageUrl ? <Image src={row.imageUrl} alt="" fill sizes="40px" className="object-cover" /> : null}
              </span>
              <span>
                <span className="block font-medium text-ink-900">{row.name}</span>
                <span className="block font-mono text-[11px] text-ink-400">/{row.slug}</span>
              </span>
            </span>
          ),
        },
        { key: "dishes", label: "Dishes", render: (row) => row._count?.dishes ?? 0 },
        { key: "order", label: "Order", render: (row) => row.displayOrder },
        { key: "active", label: "Status", render: (row) => <StatusBadge status={row.active ? "COMPLETED" : "ARCHIVED"} /> },
      ]}
      fields={[
        { name: "name", label: "Category name", type: "text", required: true, half: true },
        { name: "slug", label: "URL slug", type: "text", required: true, half: true, derivedFrom: "name", hint: "lowercase-with-hyphens" },
        { name: "description", label: "Description", type: "textarea", hint: "Shown under the section heading" },
        { name: "imageUrl", label: "Category image", type: "image" },
        { name: "displayOrder", label: "Display order", type: "number", half: true, min: 0 },
        { name: "active", label: "Visible on the website", type: "switch", half: true },
      ]}
      toForm={(row) => ({
        name: row.name,
        slug: row.slug,
        description: row.description ?? "",
        imageUrl: row.imageUrl ?? "",
        displayOrder: row.displayOrder,
        active: row.active,
      })}
    />
  );
}
