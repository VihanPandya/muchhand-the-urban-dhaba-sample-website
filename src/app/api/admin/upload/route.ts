import type { NextRequest } from "next/server";
import { fail, guardRate, handleError, ok } from "@/lib/api";
import { assertCsrf } from "@/lib/csrf";
import { requireAdmin } from "@/lib/auth";
import { buildImageKey, storeImage } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
  ["image/gif", "gif"],
]);

/**
 * POST /api/admin/upload — image upload for dishes, categories and the gallery.
 * Where the bytes land is decided by src/lib/storage.ts: the local public
 * folder when self-hosting, Netlify Blobs when deployed to Netlify.
 */
export async function POST(req: NextRequest) {
  const limited = guardRate(req, "upload", 30, 60_000);
  if (limited) return limited;

  try {
    await requireAdmin("menu.manage");
    assertCsrf(req);

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("No file was uploaded.", 422);
    if (file.size > MAX_BYTES) return fail("That image is larger than 5 MB. Please compress it first.", 413);

    const extension = ALLOWED.get(file.type);
    if (!extension) return fail("Only JPG, PNG, WebP, AVIF or GIF images are allowed.", 415);

    const bytes = Buffer.from(await file.arrayBuffer());
    const { url, driver } = await storeImage(buildImageKey(extension), bytes, file.type);

    return ok({ url, size: file.size, type: file.type, driver }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
