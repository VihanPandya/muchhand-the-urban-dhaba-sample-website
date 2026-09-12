import "server-only";
import type { NextRequest } from "next/server";
import { CSRF_COOKIE } from "@/lib/auth";

/**
 * Double-submit CSRF check for admin mutations: the token in the (non-HttpOnly)
 * cookie must be echoed in the request header, and the Origin must match the
 * host. Public endpoints (orders, reservations, contact) are rate limited and
 * validated instead — they are unauthenticated by design.
 */
export function assertSameOrigin(req: NextRequest): void {
  const origin = req.headers.get("origin");
  if (!origin) return; // same-origin form posts / server-to-server
  const host = req.headers.get("host");
  try {
    if (new URL(origin).host !== host) {
      throw new Error("Cross-origin request blocked.");
    }
  } catch {
    throw new Error("Cross-origin request blocked.");
  }
}

export function assertCsrf(req: NextRequest): void {
  assertSameOrigin(req);
  const cookieToken = req.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = req.headers.get("x-csrf-token");
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw new Error("Invalid or missing CSRF token. Please refresh and try again.");
  }
}
