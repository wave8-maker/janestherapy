import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/app/lib/admin-auth";
import { deleteIntake, getIntake, listIntakes } from "@/app/lib/intake-storage";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const submissions = await listIntakes();
  const summary = submissions.map(({ id, name, phone, email, date, service, serviceDuration, submittedAt }) => ({
    id,
    name,
    phone,
    email,
    date,
    service,
    serviceDuration,
    submittedAt,
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
