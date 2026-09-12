"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { GalleryDTO } from "@/lib/queries";
import { EmptyState } from "@/components/ui";
import { IconClose, IconImage } from "@/components/icons";

export function GalleryGrid({ images }: { images: GalleryDTO[] }) {
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(images.map((image) => image.category)))],
    [images],
  );
  const [active, setActive] = useState("All");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered = useMemo(
    () => (active === "All" ? images : images.filter((image) => image.category === active)),
    [images, active],
  );

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (delta: number) => {
      setOpenIndex((current) => {
        if (current === null) return current;
        const next = (current + delta + filtered.length) % filtered.length;
        return next;
      });
    },
    [filtered.length],
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [openIndex, close, step]);

  if (!images.length) {
    return (
      <EmptyState
        title="No photos yet"
        description="The gallery is empty right now. An admin can upload photos from the admin panel."
        icon={<IconImage className="h-10 w-10" />}
      />
    );
  }

  const current = openIndex === null ? null : filtered[openIndex];

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Gallery categories">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => {
              setActive(category);
              setOpenIndex(null);
            }}
            aria-pressed={active === category}
            className={`chip transition ${
              active === category ? "bg-ink-900 text-paper" : "bg-ink-100 text-ink-600 hover:bg-ink-200/60"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="columns-2 gap-3 md:columns-3 lg:columns-4 [&>*]:mb-3">
        {filtered.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setOpenIndex(index)}
            className="group relative block w-full break-inside-avoid overflow-hidden rounded-2xl"
            aria-label={`Open image: ${image.alt}`}
          >
            <Image
              src={image.url}
              alt={image.alt}
              width={600}
              height={index % 3 === 0 ? 750 : 450}
              sizes="(max-width: 768px) 45vw, 24vw"
              className="h-auto w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-ink-950/75 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" aria-hidden />
            {image.caption ? (
              <span className="absolute inset-x-0 bottom-0 p-3 text-left text-xs font-medium text-paper opacity-0 transition group-hover:opacity-100">
                {image.caption}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {current ? (
        <div
          className="fixed inset-0 z-[85] flex items-center justify-center bg-ink-950/92 p-4 animate-[var(--animate-fade-in)]"
          role="dialog"
          aria-modal="true"
          aria-label={current.alt}
        >
          <button type="button" className="absolute inset-0" onClick={close} aria-label="Close image" />
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-paper transition hover:bg-white/25"
            aria-label="Close"
          >
            <IconClose className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => step(-1)}
            className="absolute left-3 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/12 text-2xl text-paper transition hover:bg-white/25"
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            className="absolute right-3 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/12 text-2xl text-paper transition hover:bg-white/25"
            aria-label="Next image"
          >
            ›
          </button>
          <figure className="relative z-[1] max-h-[86vh] w-full max-w-4xl">
            <Image
              src={current.url}
              alt={current.alt}
              width={1400}
              height={1000}
              sizes="100vw"
              className="max-h-[78vh] w-full rounded-2xl object-contain"
              priority
            />
            {current.caption ? (
              <figcaption className="mt-3 text-center text-sm text-ink-200">
                {current.caption} · {openIndex! + 1} of {filtered.length}
              </figcaption>
            ) : null}
          </figure>
        </div>
      ) : null}
    </div>
  );
}
