import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/app/lib/admin-auth";
import { deleteIntake, getIntake, listIntakes } from "@/app/lib/intake-storage";
import { ALERT_CONDITIONS } from "@/app/lib/intake-types";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const submissions = await listIntakes();
  const summary = submissions.map((s) => ({
    id: s.id,
    name: s.name,
    phone: s.phone,
    email: s.email,
    date: s.date,
    submittedAt: s.submittedAt,
    goals: s.goals,
    // Surfaced in the list so a condition needing care is visible before Jane
    // opens the record.
    alerts: s.conditions.filter((c) => ALERT_CONDITIONS.includes(c)),
    signed: Boolean(s.signatureDataUrl),
  }));
  return NextResponse.json({ submissions: summary });
}

export async function DELETE(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const deleted = await deleteIntake(id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const submission = await getIntake(id);
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ submission });
}
