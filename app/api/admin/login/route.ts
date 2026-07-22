import { NextResponse } from "next/server";
import { verifyPassword } from "@/app/lib/admin-credentials";
import { createSessionToken, SESSION_MAX_AGE } from "@/app/lib/admin-session";

/**
 * A wrong password answers slowly on purpose. With no username to guess as well,
 * the password is the only thing standing in the way, and scrypt plus this delay
 * put an online guesser at roughly one attempt per second.
 */
const WRONG_PASSWORD_DELAY_MS = 900;

export async function POST(req: Request) {
  let password = "";
  try {
    const body = await req.json();
    password = body?.password ?? "";
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (!verifyPassword(password)) {
    await new Promise((resolve) => setTimeout(resolve, WRONG_PASSWORD_DELAY_MS));
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const token = await createSessionToken("admin");
  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin-session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  return res;
}
