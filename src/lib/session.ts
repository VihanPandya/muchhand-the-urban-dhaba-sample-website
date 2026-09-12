/**
 * Session token helpers. Kept free of Node-only dependencies (bcrypt, Prisma)
 * so the Edge middleware can verify a session before a request reaches a route.
 */
import { SignJWT, jwtVerify } from "jose";
import type { AdminRole } from "@prisma/client";

export const SESSION_COOKIE = "mud_session";
export const CSRF_COOKIE = "mud_csrf";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: AdminRole;
  /** Session version — bumped on the admin record to revoke issued tokens. */
  v: number;
};

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("AUTH_SECRET is missing or too short (needs 32+ characters). Set it in your environment.");
  }
  return new TextEncoder().encode(value);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret());
}

export async function readSessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (!payload.sub || typeof payload.role !== "string") return null;
    return {
      sub: payload.sub,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      role: payload.role as AdminRole,
      v: Number(payload.v ?? 1),
    };
  } catch {
    return null;
  }
}
