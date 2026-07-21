"use client";

import type { IntakeFormData } from "@/app/lib/intake-types";
import SignaturePad from "./SignaturePad";
import { FieldGroup, StepHeading, TextField, labelCls } from "./fields";

export default function StepSignature({
  form,
  set,
}: {
  form: IntakeFormData;
  set: <K extends keyof IntakeFormData>(key: K, value: IntakeFormData[K]) => void;
}) {
  return (
    <>
      <StepHeading title="Signature" desc="One last step, and you're done." />

      <div className="mb-6 space-y-2.5 rounded-2xl border border-brand-light bg-cream/50 p-5 text-[15px] leading-relaxed text-bark">
        <p>I certify that the information I have given on this form is true and complete.</p>
        <p>I consent to receive massage therapy treatment today.</p>
      </div>

      <FieldGroup>
        <div>
          <p className={`${labelCls} mb-2`}>Signature</p>
          <SignaturePad
            value={form.signatureDataUrl}
            onChange={(dataUrl) => set("signatureDataUrl", dataUrl)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Printed Name"
            required
            value={form.printedName}
            onChange={(e) => set("printedName", e.target.value)}
          />
          <TextField label="Date" value={form.date} readOnly />
        </div>
      </FieldGroup>
    </>
  );
}
