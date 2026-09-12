"use client";

import Image from "next/image";
import { ResourceManager } from "@/components/admin/resource-manager";
import { StatusBadge } from "@/components/admin/ui";

type GalleryRow = {
  id: string;
  url: string;
  caption: string | null;
  alt: string | null;
  category: string;
  displayOrder: number;
  active: boolean;
};

const CATEGORIES = ["Food", "Restaurant", "Kitchen", "Ambience", "Events"];

export function GalleryManager() {
  return (
    <ResourceManager<GalleryRow>
      resource="gallery"
      title="Gallery"
      singularLabel="Photo"
      description="Photos shown on the gallery page and the home page strip."
      emptyMessage="No photos yet. Upload the first one."
      defaults={{ url: "", caption: "", alt: "", category: "Food", displayOrder: 0, active: true }}
      filters={[
        {
          name: "category",
          label: "All categories",
          options: CATEGORIES.map((category) => ({ value: category, label: category })),
        },
      ]}
      columns={[
        {
          key: "image",
          label: "Photo",
          render: (row) => (
            <span className="relative block h-14 w-20 overflow-hidden rounded-lg bg-ink-100">
              {row.url ? <Image src={row.url} alt={row.alt ?? ""} fill sizes="80px" className="object-cover" /> : null}
            </span>
          ),
        },
        {
          key: "caption",
          label: "Caption",
          render: (row) => <span className="text-sm text-ink-700">{row.caption ?? "—"}</span>,
        },
        { key: "category", label: "Category", render: (row) => row.category },
        { key: "order", label: "Order", render: (row) => row.displayOrder },
        { key: "active", label: "Status", render: (row) => <StatusBadge status={row.active ? "COMPLETED" : "ARCHIVED"} /> },
      ]}
      fields={[
        { name: "url", label: "Photo", type: "image" },
        { name: "caption", label: "Caption", type: "text", half: true },
        {
          name: "category",
          label: "Category",
          type: "select",
          half: true,
          options: CATEGORIES.map((category) => ({ value: category, label: category })),
        },
        { name: "alt", label: "Alt text", type: "text", hint: "Describe the photo for screen readers" },
        { name: "displayOrder", label: "Display order", type: "number", half: true, min: 0 },
        { name: "active", label: "Show in the gallery", type: "switch", half: true },
      ]}
      toForm={(row) => ({
        url: row.url,
        caption: row.caption ?? "",
        alt: row.alt ?? "",
        category: row.category,
        displayOrder: row.displayOrder,
        active: row.active,
      })}
    />
  );
}
