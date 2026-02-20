import { NextRequest, NextResponse } from "next/server";

const locales = ["en"];
const ACCESS_TOKEN_COOKIE = "token";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (!hasLocale) {
    const url = request.nextUrl.clone();
    url.pathname = `/en${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  const locale = pathname.split("/")[1];
  const loginPath = `/${locale}/admin/login`;
  const legacyLoginPath = `/${locale}/login`;
  const dashboardPath = `/${locale}/dashboard`;
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const hasToken = Boolean(token);
  const isLoginRoute = pathname === loginPath || pathname === legacyLoginPath;

  if (hasToken && isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = dashboardPath;
    return NextResponse.redirect(url);
  }

  if (!hasToken && pathname === legacyLoginPath) {
    const url = request.nextUrl.clone();
    url.pathname = loginPath;
    return NextResponse.redirect(url);
  }

  if (!hasToken && !isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = loginPath;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
