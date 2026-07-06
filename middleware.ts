import { NextRequest, NextResponse } from "next/server";
import { canAccessRoute } from "@/lib/roles";

// Routes that are always public (auth, API, static assets)
const PUBLIC_PREFIXES = ["/api", "/auth", "/_next", "/favicon"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Read role from cookie set by the session (NextAuth stores it there)
  // In dev/bypass mode, role is written to a custom cookie by the app-shell
  const role = request.cookies.get("pmo_role")?.value;

  // If no role cookie yet, allow through (session hydration will handle it)
  if (!role) {
    return NextResponse.next();
  }

  // Check route access
  if (!canAccessRoute(role, pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/unauthorized";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match everything except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
