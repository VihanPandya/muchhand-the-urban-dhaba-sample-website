import { readFile } from "node:fs/promises";
import path from "node:path";
import { fail, handleError } from "@/lib/api";
import { BLOB_STORE, contentTypeForKey, localUploadDir, storageDriver } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Keys are generated server-side (timestamp + random + extension), so they are
// permanently cacheable — and anything that doesn't match that shape is a 404.
const KEY = /^[A-Za-z0-9][\w-]*\.[A-Za-z0-9]{2,5}$/;
const CACHE = "public, max-age=31536000, immutable";

/** GET /api/uploads/:key — serves an admin-uploaded image from either driver. */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  try {
    const { key } = await params;
    if (!KEY.test(key)) return fail("Not found.", 404);

    if (storageDriver() === "netlify-blobs") {
      const { getStore } = await import("@netlify/blobs");
      const store = getStore({ name: BLOB_STORE, consistency: "strong" });
      const blob = await store.getWithMetadata(key, { type: "arrayBuffer" });
      if (!blob) return fail("Not found.", 404);
      const contentType =
        typeof blob.metadata?.contentType === "string" ? blob.metadata.contentType : contentTypeForKey(key);
      return new Response(blob.data, { headers: { "content-type": contentType, "cache-control": CACHE } });
    }

    try {
      const bytes = await readFile(path.join(localUploadDir(), key));
      return new Response(new Uint8Array(bytes), {
        headers: { "content-type": contentTypeForKey(key), "cache-control": CACHE },
      });
    } catch {
      return fail("Not found.", 404);
    }
  } catch (error) {
    return handleError(error);
  }
}
