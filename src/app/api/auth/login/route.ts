import type { NextRequest } from "next/server";
import { fail, guardRate, handleError, ok } from "@/lib/api";
import { assertSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";
import { startSession, verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** POST /api/auth/login — admin sign-in. */
export async function POST(req: NextRequest) {
  // Tight limit: brute-forcing a password should not be practical.
  const limited = guardRate(req, "login", 8, 5 * 60_000);
  if (limited) return limited;

  try {
    assertSameOrigin(req);
    const { email, password } = loginSchema.parse(await req.json());

    const admin = await prisma.admin.findUnique({ where: { email: email.toLowerCase().trim() } });
    // Same message either way so the form can't be used to enumerate accounts.
    const invalid = fail("That email and password combination didn't work.", 401);
    if (!admin || !admin.active) {
      // Keep the timing similar to a real check.
      await verifyPassword(password, "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin");
      return invalid;
    }

    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) return invalid;

    await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
    await startSession(admin);

    return ok({ id: admin.id, name: admin.name, role: admin.role });
  } catch (error) {
    return handleError(error);
  }
}
