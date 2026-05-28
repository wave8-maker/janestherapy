import { NextResponse } from "next/server";
import { saveIntake } from "@/app/lib/intake-storage";
import type { IntakeFormData } from "@/app/lib/intake-types";

function validate(data: IntakeFormData): string | null {
  if (!data.name?.trim()) return "Name is required";
  if (!data.phone?.trim()) return "Phone number is required";
  if (data.hasInjuries === null) return "Please answer the injuries question";
  if (data.hasSurgeries === null) return "Please answer the surgeries question";
  if (data.isPregnant === null) return "Please answer the pregnancy question";
  if (!data.service) return "Please select a service";
  if (!data.serviceDuration) return "Please select session duration";
  if (!data.bodyworkPreference) return "Please select bodywork preference";
  if (!data.sessionPreference) return "Please select session communication preference";
  return null;
}

export async function POST(req: Request) {
  try {
    const data = (await req.json()) as IntakeFormData;
    const error = validate(data);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const submission = await saveIntake(data);
    return NextResponse.json({ ok: true, id: submission.id });
  } catch (e) {
    console.error("Intake submission failed:", e);
    return NextResponse.json({ error: "Failed to save intake form" }, { status: 500 });
  }
}
