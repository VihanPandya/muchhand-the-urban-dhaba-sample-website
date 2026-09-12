import { NextResponse, type NextRequest } from "next/server";
import { readSessionToken, SESSION_COOKIE } from "@/lib/session";

/**
 * First gate in front of the admin panel: anyone without a valid session token
 * is bounced to the login page before a page or API route even runs. The
 * session is verified again (against the database) inside the admin layout and
 * every admin API route, so a revoked account can't ride on a signed token.
 */
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const session = await readSessionToken(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/admin/login") {
    if (session) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, error: "You need to sign in to continue." }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
