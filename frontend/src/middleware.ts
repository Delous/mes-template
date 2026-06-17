import { NextResponse, type NextRequest } from "next/server";

import { getApiUrl } from "@/shared/api/config";
import {
  createAuthSetCookiesFromTokenResponse,
  getSetCookies,
  parseSetCookieHeader,
  upsertCookieHeader,
} from "@/shared/lib/cookies";

const authCookieName = "arm_auth";
const accessCookieName = "access_token";
const refreshCookieName = "refresh_token";
const loginPath = "/";

async function refreshSession(request: NextRequest) {
  const response = await fetch(`${getApiUrl()}/api/v1/refresh`, {
    method: "POST",
    headers: { Cookie: request.cookies.toString() },
    cache: "no-store",
  });

  if (!response.ok) return null;

  const setCookies = getSetCookies(response.headers);
  if (setCookies.length > 0) return setCookies;

  const tokenPayload = await response.json().catch(() => null);
  const fallbackSetCookies = createAuthSetCookiesFromTokenResponse(tokenPayload);

  return fallbackSetCookies.length > 0 ? fallbackSetCookies : null;
}

function redirectToLogin(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const url = request.nextUrl.clone();
  url.pathname = loginPath;
  url.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === loginPath;
  const isAuthenticated = request.cookies.has(authCookieName);

  if (!isLoginPage && !isAuthenticated) {
    return redirectToLogin(request);
  }

  if (!isLoginPage && !request.cookies.has(accessCookieName) && request.cookies.has(refreshCookieName)) {
    const setCookies = await refreshSession(request).catch(() => null);

    if (!setCookies) {
      const response = redirectToLogin(request);
      response.cookies.delete(authCookieName);
      return response;
    }

    const requestHeaders = new Headers(request.headers);
    const refreshedCookieHeader = setCookies.reduce((cookieHeader, setCookieHeader) => {
      const parsed = parseSetCookieHeader(setCookieHeader);
      return parsed ? upsertCookieHeader(cookieHeader, parsed.name, parsed.value) : cookieHeader;
    }, requestHeaders.get("cookie") ?? "");

    requestHeaders.set("cookie", refreshedCookieHeader);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    for (const setCookieHeader of setCookies) {
      const parsed = parseSetCookieHeader(setCookieHeader);
      if (parsed) {
        response.cookies.set(parsed.name, parsed.value, parsed.options);
      }
    }

    response.cookies.set(authCookieName, "1", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)"],
};
