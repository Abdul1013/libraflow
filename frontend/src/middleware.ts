import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/catalogue", "/circulation", "/members", "/reports", "/settings", "/borrowings", "/recommendations"];
const LIBRARIAN_PREFIXES = ["/dashboard", "/catalogue", "/circulation", "/members", "/reports", "/settings"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const hasToken = request.cookies.has("access_token");
  if (!hasToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Block students from admin/librarian routes using the non-sensitive role cookie
  const isLibrarianRoute = LIBRARIAN_PREFIXES.some((p) => pathname.startsWith(p));
  if (isLibrarianRoute && request.cookies.get("user_role")?.value === "STUDENT") {
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
