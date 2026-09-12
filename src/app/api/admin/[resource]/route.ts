import type { NextRequest } from "next/server";
import { fail, guardRate, handleError, ok } from "@/lib/api";
import { assertCsrf } from "@/lib/csrf";
import { requireAdmin } from "@/lib/auth";
import { getResource, revalidateFor } from "@/lib/admin-resources";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

/**
 * GET  /api/admin/:resource      — paginated, searchable list
 * POST /api/admin/:resource      — create
 *
 * Resources, their schemas and the permission each one needs are declared in
 * src/lib/admin-resources.ts.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  try {
    const { resource: name } = await params;
    const resource = getResource(name);
    if (!resource) return fail("Unknown resource.", 404);

    await requireAdmin(resource.permission);

    const search = req.nextUrl.searchParams;
    const page = Math.max(1, Number(search.get("page") ?? 1));
    const perPage = Math.min(100, Math.max(1, Number(search.get("perPage") ?? 25)));
    const query = search.get("q")?.trim();

    const where: Record<string, unknown> = {};
    if (query && resource.searchFields?.length) {
      where.OR = resource.searchFields.map((field) => ({
        [field]: { contains: query, mode: "insensitive" },
      }));
    }
    for (const field of resource.filterFields ?? []) {
      const value = search.get(field);
      if (value) where[field] = value;
    }

    const delegate = resource.delegate();
    const [items, total] = await Promise.all([
      delegate.findMany({
        where,
        include: resource.listInclude ?? resource.include,
        orderBy: resource.orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      delegate.count({ where }),
    ]);

    return ok({ items: serialize(items), total, page, perPage, pages: Math.ceil(total / perPage) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const limited = guardRate(req, "admin-write", 120, 60_000);
  if (limited) return limited;

  try {
    const { resource: name } = await params;
    const resource = getResource(name);
    if (!resource) return fail("Unknown resource.", 404);
    if (!resource.createSchema) return fail("This resource can't be created from here.", 405);

    await requireAdmin(resource.writePermission ?? resource.permission);
    assertCsrf(req);

    const input = resource.createSchema.parse(await req.json());
    const created = resource.create
      ? await resource.create(input)
      : await resource.delegate().create({ data: await resource.toData!(input, "create") });

    revalidateFor(resource);
    return ok(serialize(created), { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
