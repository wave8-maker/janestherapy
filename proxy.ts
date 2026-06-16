import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/app/lib/admin-session";

// Next.js 16: the former `middleware` convention is now `proxy`, which runs in
// the Node.js runtime. Running here (not Edge) means it reads the same env vars
// (ADMIN_SESSION_SECRET) as the login route, so session tokens verify consistently.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin/login")) return NextResponse.next();

  const session = req.cookies.get("admin-session")?.value;
  const valid = await verifySessionToken(session);

  if (pathname.startsWith("/api/admin/") && !pathname.startsWith("/api/admin/login")) {
    if (!valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!valid) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
