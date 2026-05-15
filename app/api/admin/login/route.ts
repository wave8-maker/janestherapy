import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = await req.json();
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin-session", process.env.ADMIN_SESSION_SECRET ?? "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
