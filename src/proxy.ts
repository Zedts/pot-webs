import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("pot_token")?.value;
  const { pathname } = request.nextUrl;

  // 1. Root route '/'
  if (pathname === "/") {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // 2. Auth routes: '/login' and '/register'
  if (pathname === "/login" || pathname === "/register") {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 3. Legacy '/home' route redirect
  if (pathname === "/home" || pathname.startsWith("/home/")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 4. Protected routes: '/dashboard', '/pengiriman', and '/slp'
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/pengiriman") ||
    pathname.startsWith("/slp")
  ) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/home",
    "/home/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/pengiriman",
    "/pengiriman/:path*",
    "/slp",
    "/slp/:path*",
  ],
};
