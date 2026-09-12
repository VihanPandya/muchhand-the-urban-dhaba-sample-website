import { Prisma } from "@prisma/client";

/**
 * Turns Prisma records into plain JSON-safe values: Decimal → number,
 * Date → ISO string. Used at every boundary that hands data to the client.
 */
export function serialize<T>(value: T): T {
  return transform(value) as T;
}

function transform(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Prisma.Decimal) return Number(value.toString());
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(transform);
  if (typeof value === "object") {
    // Skip anything exotic (Buffers, class instances we don't own).
    if (Object.getPrototypeOf(value) !== Object.prototype) return value;
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (key === "passwordHash") continue; // never leaves the server
      out[key] = transform(item);
    }
    return out;
  }
  return value;
}
