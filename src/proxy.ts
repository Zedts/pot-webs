import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("pot_token")?.value;
  const { pathname } = request.nextUrl;

  // 1. Root route '/'
  if (pathname === "/") {
    if (token) {
      return NextResponse.redirect(new URL("/home", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // 2. Auth routes: '/login' and '/register'
  if (pathname === "/login" || pathname === "/register") {
    if (token) {
      return NextResponse.redirect(new URL("/home", request.url));
    }
  }

  // 3. Protected routes: '/home' and its sub-paths
  if (pathname.startsWith("/home")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/register", "/home", "/home/:path*"],
};
