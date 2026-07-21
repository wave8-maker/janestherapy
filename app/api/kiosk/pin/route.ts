import { NextResponse } from "next/server";

/**
 * Verifies the studio PIN server-side so the value never reaches the browser
 * bundle. With no KIOSK_PIN configured the gate refuses everything rather than
 * silently opening — a missing env var should not unlock the tablet.
 */
export async function POST(req: Request) {
  const configured = process.env.KIOSK_PIN?.trim();
  if (!configured) {
    return NextResponse.json(
      { error: "No studio PIN is set up yet. Ask Jane to configure KIOSK_PIN." },
      { status: 503 }
    );
  }

  let pin: unknown;
  try {
    pin = ((await req.json()) as { pin?: unknown }).pin;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (typeof pin !== "string" || pin !== configured) {
    return NextResponse.json({ error: "That PIN didn't match. Try again." }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
