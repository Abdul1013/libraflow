import { NextResponse, type NextRequest } from "next/server";

// Routes that require ADMIN or LIBRARIAN role
const ADMIN_PREFIXES = ["/dashboard", "/catalogue", "/circulation", "/members", "/reports", "/settings"];

// Routes that require any authenticated user
const STUDENT_PREFIXES = ["/search", "/borrowings", "/recommendations"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute   = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
  const isStudentRoute = STUDENT_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isAdminRoute && !isStudentRoute) return NextResponse.next();

  const hasToken = request.cookies.has("lf_authed");
  const role     = request.cookies.get("lf_role")?.value;

  if (isAdminRoute) {
    // No cookie, or cookie says STUDENT → staff portal login
    if (!hasToken || role === "STUDENT") {
      const dest = new URL("/admin/login", request.url);
      dest.searchParams.set("redirect", pathname);
      return NextResponse.redirect(dest);
    }
  }

  if (isStudentRoute) {
    if (!hasToken) {
      const dest = new URL("/login", request.url);
      dest.searchParams.set("redirect", pathname);
      return NextResponse.redirect(dest);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|favicon.ico|public).*)",
  ],
};
