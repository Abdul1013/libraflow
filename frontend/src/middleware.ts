import { NextResponse, type NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_PREFIXES = ["/dashboard", "/catalogue", "/circulation", "/members", "/reports", "/settings", "/borrowings", "/recommendations"];

// Routes that require librarian/admin role (cookie `role` claim checked server-side in Sprint 3)
const LIBRARIAN_PREFIXES = ["/dashboard", "/catalogue", "/circulation", "/members", "/reports"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // The access_token is an HTTP-only cookie — we can check its presence (not decode it)
  const hasToken = request.cookies.has("access_token");
  if (!hasToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|favicon.ico|public).*)",
  ],
};
