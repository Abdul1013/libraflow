import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/catalogue", "/circulation", "/members", "/reports", "/settings", "/borrowings", "/recommendations"];
const LIBRARIAN_PREFIXES = ["/dashboard", "/catalogue", "/circulation", "/members", "/reports", "/settings"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // lf_authed is a SameSite=Lax cookie set by the frontend JS on login —
  // works cross-origin unlike the HTTP-only backend cookie.
  const hasToken = request.cookies.has("lf_authed");
  if (!hasToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isLibrarianRoute = LIBRARIAN_PREFIXES.some((p) => pathname.startsWith(p));
  if (isLibrarianRoute && request.cookies.get("lf_role")?.value === "STUDENT") {
    return NextResponse.redirect(new URL("/search", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|favicon.ico|public).*)",
  ],
};
