import type { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api";
import { assertSameOrigin } from "@/lib/csrf";
import { destroySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** POST /api/auth/logout — clears the admin session cookie. */
export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    await destroySession();
    return ok({ signedOut: true });
  } catch (error) {
    return handleError(error);
  }
}
