"use client";

import { ResourceManager } from "@/components/admin/resource-manager";
import { StatusBadge } from "@/components/admin/ui";
import { Stars } from "@/components/ui";

type TestimonialRow = {
  id: string;
  name: string;
  rating: number;
  message: string;
  photoUrl: string | null;
  location: string | null;
  active: boolean;
  displayOrder: number;
};

export function TestimonialsManager() {
  return (
    <ResourceManager<TestimonialRow>
      resource="testimonials"
      title="Testimonials"
      singularLabel="Review"
      description="Guest reviews shown on the home page, the about page and the reviews page."
      emptyMessage="No testimonials yet."
      defaults={{ name: "", rating: 5, message: "", photoUrl: "", location: "", active: true, displayOrder: 0 }}
      columns={[
        {
          key: "name",
          label: "Guest",
          render: (row) => (
            <span>
              <span className="block font-medium text-ink-900">{row.name}</span>
              {row.location ? <span className="block text-[11px] text-ink-400">{row.location}</span> : null}
            </span>
          ),
        },
        { key: "rating", label: "Rating", render: (row) => <Stars rating={row.rating} /> },
        {
          key: "message",
          label: "Review",
          render: (row) => <span className="line-clamp-2 max-w-md text-sm text-ink-600">{row.message}</span>,
        },
        { key: "active", label: "Status", render: (row) => <StatusBadge status={row.active ? "COMPLETED" : "ARCHIVED"} /> },
      ]}
      fields={[
        { name: "name", label: "Guest name", type: "text", required: true, half: true },
        { name: "location", label: "Location", type: "text", half: true, placeholder: "Gota" },
        { name: "rating", label: "Rating (1–5)", type: "number", required: true, half: true, min: 1, max: 5 },
        { name: "displayOrder", label: "Display order", type: "number", half: true, min: 0 },
        { name: "message", label: "Review", type: "textarea", required: true },
        { name: "photoUrl", label: "Guest photo", type: "image" },
        { name: "active", label: "Show on the website", type: "switch" },
      ]}
      toForm={(row) => ({
        name: row.name,
        rating: row.rating,
        message: row.message,
        photoUrl: row.photoUrl ?? "",
        location: row.location ?? "",
        active: row.active,
        displayOrder: row.displayOrder,
      })}
    />
  );
}
