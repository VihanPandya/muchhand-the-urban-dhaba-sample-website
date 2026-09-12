import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/auth";
import { limitRequest } from "@/lib/rate-limit";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

/** Single place where thrown errors become a clean JSON response. */
export function handleError(error: unknown) {
  if (error instanceof AuthError) return fail(error.message, error.status);
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "form";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return fail("Please check the highlighted fields.", 422, { fieldErrors });
  }
  if (error instanceof Error) {
    const message = error.message || "Something went wrong.";
    const isClientError =
      message.includes("CSRF") || message.includes("Cross-origin") || message.startsWith("Invalid");
    if (process.env.NODE_ENV !== "production" || isClientError) {
      return fail(message, isClientError ? 403 : 500);
    }
  }
  console.error("[api]", error);
  return fail("Something went wrong on our side. Please try again.", 500);
}

export function guardRate(
  req: NextRequest,
  scope: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const result = limitRequest(req, scope, limit, windowMs);
  if (result.ok) return null;
  return NextResponse.json(
    { ok: false, error: "Too many requests. Please slow down and try again shortly." },
    { status: 429, headers: { "Retry-After": String(result.retryAfter) } },
  );
}
