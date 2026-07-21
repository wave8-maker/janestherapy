"use client";

import { HEALTH_CONDITIONS, type IntakeFormData } from "@/app/lib/intake-types";
import { CheckBox, FieldGroup, StepHeading, TextArea, YesNo, labelCls } from "./fields";

export default function StepHealth({
  form,
  set,
  toggle,
}: {
  form: IntakeFormData;
  set: <K extends keyof IntakeFormData>(key: K, value: IntakeFormData[K]) => void;
  toggle: (key: "hearAboutUs" | "enhancements" | "conditions" | "goals", option: string) => void;
}) {
  return (
    <>
      <StepHeading
        title="Health History"
        desc="Some conditions make certain techniques unsafe. Jane works from what you tell her here, so please check everything that applies."
      />
      <FieldGroup>
        <fieldset>
          <legend className={`${labelCls} mb-2.5`}>
            Do any of these apply to you, now or in the past?
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {HEALTH_CONDITIONS.map((c) => (
              <CheckBox
                key={c}
                checked={form.conditions.includes(c)}
                onChange={() => toggle("conditions", c)}
              >
                {c}
              </CheckBox>
            ))}
          </div>
        </fieldset>

        {form.conditions.includes("Other") && (
          <div className="border-l-2 border-sage/50 pl-4">
            <TextArea
              label="Please describe"
              rows={2}
              value={form.conditionsOther}
              onChange={(e) => set("conditionsOther", e.target.value)}
            />
          </div>
        )}

        <YesNo
          label="Recent or past injuries?"
          value={form.hasInjuries}
          onChange={(v) => set("hasInjuries", v)}
          detailsPlaceholder="Roughly when, and what it feels like now — pain, stiffness, limited movement."
          details={form.injuryDetails}
          onDetailsChange={(v) => set("injuryDetails", v)}
        />
        <YesNo
          label="Recent or past surgeries?"
          value={form.hasSurgeries}
          onChange={(v) => set("hasSurgeries", v)}
          detailsPlaceholder="Roughly when, and what was done."
          details={form.surgeryDetails}
          onDetailsChange={(v) => set("surgeryDetails", v)}
        />
        <YesNo
          label="Are you pregnant?"
          value={form.isPregnant}
          onChange={(v) => set("isPregnant", v)}
          detailsPlaceholder="How far along are you? Anything else Jane should know?"
          details={form.pregnancyDetails}
          onDetailsChange={(v) => set("pregnancyDetails", v)}
        />

        <TextArea
          label="Anything else about your health Jane should know"
          rows={3}
          value={form.medicalConditions}
          onChange={(e) => set("medicalConditions", e.target.value)}
        />
        <CheckBox
          emphasis
          checked={form.healthAttested}
          onChange={(v) => set("healthAttested", v)}
        >
          I have reviewed the list above and disclosed every condition that applies to me. The
          health information I have given is complete and accurate.
        </CheckBox>
      </FieldGroup>
    </>
  );
}
