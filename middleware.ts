import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin/login")) return NextResponse.next();
  if (pathname.startsWith("/admin")) {
    const session = req.cookies.get("admin-session")?.value;
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret || session !== secret) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }
  return NextResponse.next();
}

export const config = { matcher: "/admin/:path*" };
