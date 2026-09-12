"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { api, ApiError } from "@/components/admin/api";
import { IconImage, IconClose } from "@/components/icons";

/** Image picker: uploads through /api/admin/upload, or accepts a pasted URL. */
export function ImageInput({
  value,
  onChange,
  label = "Image",
  id = "image",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  id?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const data = await api.post<{ url: string }>("/api/admin/upload", form);
      onChange(data.url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex items-start gap-3">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-ink-100 bg-ink-100">
          {value ? (
            <Image src={value} alt="" fill sizes="96px" className="object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-ink-300">
              <IconImage className="h-7 w-7" />
            </span>
          )}
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-ink-900/70 text-white"
              aria-label="Remove image"
            >
              <IconClose className="h-3 w-3" />
            </button>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <input
            id={id}
            type="url"
            className="field"
            placeholder="/images/dishes/example.webp or https://…"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) upload(file);
                event.target.value = "";
              }}
            />
            <button type="button" className="btn btn-sm btn-outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? "Uploading…" : "Upload image"}
            </button>
            <span className="text-xs text-ink-400">JPG, PNG, WebP or AVIF · max 5 MB</span>
          </div>
          {error ? <p className="text-sm text-tandoor-600">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
