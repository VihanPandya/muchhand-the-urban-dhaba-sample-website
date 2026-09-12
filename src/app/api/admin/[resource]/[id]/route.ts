import type { NextRequest } from "next/server";
import { fail, guardRate, handleError, ok } from "@/lib/api";
import { assertCsrf } from "@/lib/csrf";
import { requireAdmin } from "@/lib/auth";
import { getResource, revalidateFor } from "@/lib/admin-resources";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

/**
 * GET    /api/admin/:resource/:id — single record
 * PUT    /api/admin/:resource/:id — update
 * DELETE /api/admin/:resource/:id — delete
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ resource: string; id: string }> }) {
  try {
    const { resource: name, id } = await params;
    const resource = getResource(name);
    if (!resource) return fail("Unknown resource.", 404);

    await requireAdmin(resource.permission);

    const record = await resource.delegate().findUnique({ where: { id }, include: resource.include });
    if (!record) return fail("Not found.", 404);
    return ok(serialize(record));
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ resource: string; id: string }> }) {
  const limited = guardRate(req, "admin-write", 120, 60_000);
  if (limited) return limited;

  try {
    const { resource: name, id } = await params;
    const resource = getResource(name);
    if (!resource) return fail("Unknown resource.", 404);
    if (!resource.updateSchema) return fail("This resource is read-only.", 405);

    await requireAdmin(resource.writePermission ?? resource.permission);
    assertCsrf(req);

    const input = resource.updateSchema.parse(await req.json());
    const updated = resource.update
      ? await resource.update(id, input)
      : await resource.delegate().update({ where: { id }, data: await resource.toData!(input, "update") });

    revalidateFor(resource);
    return ok(serialize(updated));
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ resource: string; id: string }> }) {
  const limited = guardRate(req, "admin-write", 120, 60_000);
  if (limited) return limited;

  try {
    const { resource: name, id } = await params;
    const resource = getResource(name);
    if (!resource) return fail("Unknown resource.", 404);

    const actor = await requireAdmin(resource.writePermission ?? resource.permission);
    assertCsrf(req);

    if (name === "admins" && actor.sub === id) {
      return fail("You can't delete the account you're signed in with.", 409);
    }

    await resource.beforeDelete?.(id);
    await resource.delegate().delete({ where: { id } });

    revalidateFor(resource);
    return ok({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
