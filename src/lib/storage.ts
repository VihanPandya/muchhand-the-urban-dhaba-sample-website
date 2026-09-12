import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { AppError } from "@/lib/errors";

/**
 * Image storage for admin uploads.
 *
 * - `local` writes to /public/uploads. Fine for a single long-running server,
 *   but useless on serverless hosting, where the filesystem is read-only and
 *   nothing survives between invocations.
 * - `netlify-blobs` stores the bytes in a Netlify Blobs store. Selected
 *   automatically when running on Netlify so uploads work with no extra setup.
 *
 * Either way the URL is /api/uploads/<key>: `next start` only serves the
 * /public files that existed when the build ran, so an image uploaded later
 * would 404 until the next restart if we linked to it directly.
 *
 * Set IMAGE_STORAGE_DRIVER to force one, or add another case here for S3 or
 * Cloudinary — the rest of the app only ever sees the returned URL.
 */
export type StorageDriver = "local" | "netlify-blobs";

export const BLOB_STORE = "uploads";

export function storageDriver(): StorageDriver {
  const configured = process.env.IMAGE_STORAGE_DRIVER?.trim();
  if (configured === "local" || configured === "netlify-blobs") return configured;
  if (configured) {
    throw new AppError(
      `IMAGE_STORAGE_DRIVER is set to "${configured}", which this deployment has no adapter for. Use "local" or "netlify-blobs", or add the adapter in src/lib/storage.ts.`,
      501,
    );
  }
  // Netlify sets NETLIFY=true during builds and in the function runtime.
  return process.env.NETLIFY ? "netlify-blobs" : "local";
}

export function buildImageKey(extension: string): string {
  return `${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
}

export async function storeImage(
  key: string,
  bytes: Buffer,
  contentType: string,
): Promise<{ url: string; driver: StorageDriver }> {
  const driver = storageDriver();

  if (driver === "netlify-blobs") {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: BLOB_STORE, consistency: "strong" });
    // Blobs takes an ArrayBuffer/Blob, not a Node Buffer.
    await store.set(key, new Blob([new Uint8Array(bytes)], { type: contentType }), {
      metadata: { contentType },
    });
    return { url: `/api/uploads/${key}`, driver };
  }

  await mkdir(localUploadDir(), { recursive: true });
  await writeFile(path.join(localUploadDir(), key), bytes);
  return { url: `/api/uploads/${key}`, driver };
}

export function localUploadDir(): string {
  return path.join(process.cwd(), "public", "uploads");
}

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
};

export function contentTypeForKey(key: string): string {
  const extension = key.split(".").pop()?.toLowerCase() ?? "";
  return CONTENT_TYPES[extension] ?? "application/octet-stream";
}
