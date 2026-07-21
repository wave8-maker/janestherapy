"use client";

import { HEAR_ABOUT_OPTIONS, type IntakeFormData } from "@/app/lib/intake-types";
import { ChipGroup, FieldGroup, StepHeading, TextField, labelCls } from "./fields";

export default function StepPersonal({
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
        title="About You"
        desc="So Jane can reach you, and reach someone else if she ever needs to."
      />
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Full Name"
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
          <TextField
            label="Phone Number"
            required
            type="tel"
            inputMode="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
          <TextField
            label="Email"
            type="email"
            inputMode="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
          <TextField
            label="Date of Birth"
            placeholder="MM/DD/YYYY"
            inputMode="numeric"
            value={form.birthday}
            onChange={(e) => set("birthday", e.target.value)}
          />
          <TextField
            label="Address"
            span2
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
          />
          <TextField
            label="Occupation"
            value={form.occupation}
            onChange={(e) => set("occupation", e.target.value)}
          />
          <TextField
            label="Referred By"
            value={form.referredBy}
            onChange={(e) => set("referredBy", e.target.value)}
          />
        </div>

        <fieldset className="rounded-xl border border-brand-light bg-cream/40 p-4">
          <legend className="px-1 text-sm font-semibold text-bark">Emergency Contact</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              label="Name"
              value={form.emergencyContact.name}
              onChange={(e) =>
                set("emergencyContact", { ...form.emergencyContact, name: e.target.value })
              }
            />
            <TextField
              label="Relationship"
              value={form.emergencyContact.relationship}
              onChange={(e) =>
                set("emergencyContact", { ...form.emergencyContact, relationship: e.target.value })
              }
            />
            <TextField
              label="Phone"
              type="tel"
              inputMode="tel"
              value={form.emergencyContact.phone}
              onChange={(e) =>
                set("emergencyContact", { ...form.emergencyContact, phone: e.target.value })
              }
            />
          </div>
        </fieldset>

        <div>
          <p className={`${labelCls} mb-2.5`}>How did you hear about us?</p>
          <ChipGroup
            options={HEAR_ABOUT_OPTIONS}
            selected={form.hearAboutUs}
            onToggle={(o) => toggle("hearAboutUs", o)}
          />
          <div className="mt-4">
            <TextField
              label="Other"
              placeholder="Please specify"
              value={form.hearAboutUsOther}
              onChange={(e) => set("hearAboutUsOther", e.target.value)}
            />
          </div>
        </div>
      </FieldGroup>
    </>
  );
}
