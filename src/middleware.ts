import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Create a new headers object
  const headers = new Headers(request.headers);

  // Add security headers
  const securityHeaders = {
    "X-DNS-Prefetch-Control": "on",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-Frame-Options": "SAMEORIGIN",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-XSS-Protection": "1; mode=block",
  };

  // Create base response
  const response = NextResponse.next({
    request: {
      headers: headers,
    },
  });

  // Add security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Skip auth check for public routes
  if (
    request.nextUrl.pathname.startsWith("/api/auth") ||
    request.nextUrl.pathname === "/"
  ) {
    return response;
  }

  const accessToken = request.cookies.get("spotify_access_token");

  if (!accessToken) {
    return NextResponse.redirect(new URL("/api/auth/login", request.url));
  }

  // Add the Bearer token
  headers.set("Authorization", `Bearer ${accessToken.value}`);

  return NextResponse.next({
    request: {
      headers: headers,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
