import "server-only";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import type { AdminRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { permissionsFor, type Permission } from "@/lib/permissions";
import {
  createSessionToken,
  readSessionToken,
  CSRF_COOKIE,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  type SessionPayload,
} from "@/lib/session";

export { readSessionToken, SESSION_COOKIE, CSRF_COOKIE, type SessionPayload } from "@/lib/session";

export type AdminActor = SessionPayload & { permissions: Permission[] };

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function startSession(admin: {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  sessionVersion: number;
}): Promise<void> {
  const token = await createSessionToken({
    sub: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    v: admin.sessionVersion,
  });
  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  jar.set(CSRF_COOKIE, crypto.randomUUID(), {
    httpOnly: false,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(CSRF_COOKIE);
}

/**
 * Resolves the signed-in admin and re-checks the database so that deactivated
 * accounts and revoked sessions stop working immediately.
 */
export async function getCurrentAdmin(): Promise<AdminActor | null> {
  const jar = await cookies();
  const session = await readSessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!session) return null;

  const admin = await prisma.admin.findUnique({
    where: { id: session.sub },
    select: { id: true, name: true, email: true, role: true, active: true, sessionVersion: true, permissions: true },
  });
  if (!admin || !admin.active || admin.sessionVersion !== session.v) return null;

  return {
    sub: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    v: admin.sessionVersion,
    permissions: permissionsFor(admin.role, admin.permissions),
  };
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export async function requireAdmin(permission?: Permission): Promise<AdminActor> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new AuthError("You need to sign in to continue.", 401);
  if (permission && !admin.permissions.includes(permission)) {
    throw new AuthError("Your role does not have access to this action.", 403);
  }
  return admin;
}
