import { NextResponse } from "next/server";
import { saveIntake } from "@/app/lib/intake-storage";
import { getConsentBundle } from "@/app/lib/consents";
import type { IntakeFormData } from "@/app/lib/intake-types";

function validate(data: IntakeFormData, consentKeys: string[]): string | null {
  if (!data.name?.trim()) return "Name is required";
  if (!data.phone?.trim()) return "Phone number is required";
  if (data.hasInjuries === null) return "Please answer the injuries question";
  if (data.hasSurgeries === null) return "Please answer the surgeries question";
  if (data.isPregnant === null) return "Please answer the pregnancy question";
  if (!data.healthAttested) return "Please confirm your health information is complete";
  if (!data.sessionPreference) return "Please select session communication preference";

  const missing = consentKeys.filter((key) => !data.consents?.[key]);
  if (missing.length) return "Please agree to every clause before signing";

  if (!data.signatureDataUrl?.startsWith("data:image/png")) return "Signature is required";
  if (!data.printedName?.trim()) return "Printed name is required";
  return null;
}

export async function POST(req: Request) {
  try {
    const data = (await req.json()) as IntakeFormData;
    const bundle = getConsentBundle();

    const error = validate(
      data,
      bundle.items.map((i) => i.key)
    );
    if (error) return NextResponse.json({ error }, { status: 400 });

    // The signed record carries its own copy of the clauses and its own
    // server-stamped time, so editing consents.json later cannot change what an
    // existing record says the client agreed to.
    const submission = await saveIntake(data, {
      consentVersion: bundle.version,
      consentSnapshot: bundle.items,
      meta: {
        ip: req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "",
        userAgent: req.headers.get("user-agent") ?? "",
      },
    });
    return NextResponse.json({ ok: true, id: submission.id });
  } catch (e) {
    console.error("Intake submission failed:", e);
    return NextResponse.json({ error: "Failed to save intake form" }, { status: 500 });
  }
}
