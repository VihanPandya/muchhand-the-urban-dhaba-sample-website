import type { NextRequest } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fail, guardRate, handleError, ok } from "@/lib/api";
import { assertCsrf } from "@/lib/csrf";
import { requireAdmin } from "@/lib/auth";

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
 *
 * The default driver writes to /public/uploads, which suits a single server.
 * For multi-instance or serverless hosting set IMAGE_STORAGE_DRIVER to your
 * object store and put the upload call for it here — everything else in the app
 * only ever sees the returned URL.
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

    const driver = process.env.IMAGE_STORAGE_DRIVER || "local";
    if (driver !== "local") {
      return fail(
        `IMAGE_STORAGE_DRIVER is set to "${driver}", but no cloud storage adapter is configured in this deployment. Add one in src/app/api/admin/upload/route.ts or switch the driver back to "local".`,
        501,
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
    const directory = path.join(process.cwd(), "public", "uploads");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, name), bytes);

    return ok({ url: `/uploads/${name}`, size: file.size, type: file.type }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
