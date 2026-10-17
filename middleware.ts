import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PUBLIC_PATHS = [
  /^\/auth(?:\/|$)/,
  /^\/terms\/?$/,
  /^\/privacy\/?$/,
  /^\/api\/auth(?:\/|$)/,
  /^\/api\/invoices\/pay\/?$/,
  /^\/storage(?:\/|$)/,
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((pattern) => pattern.test(pathname))) {
    return NextResponse.next();
  }

  if (getSessionCookie(request)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const login = new URL("/auth/login", request.url);
  const next = `${pathname}${request.nextUrl.search}`;
  if (next !== "/") {
    login.searchParams.set("next", next);
  }
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
