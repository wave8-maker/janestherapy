"use client";

import BodyDiagram from "../BodyDiagram";
import {
  ENHANCEMENT_OPTIONS,
  PRESSURE_LEVELS,
  SESSION_PREFERENCES,
  VISIT_GOALS,
  type IntakeFormData,
} from "@/app/lib/intake-types";
import {
  CheckBox,
  ChipGroup,
  FieldGroup,
  RadioCards,
  StepHeading,
  TextArea,
  TextField,
  labelCls,
} from "./fields";

function PillRow({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          aria-pressed={value === opt}
          onClick={() => onChange(opt)}
          className={`rounded-full border px-5 py-3 text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 ${
            value === opt
              ? "border-sage bg-sage text-white"
              : "border-brand-light text-bark-light hover:border-brand/50 hover:text-bark"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function StepVisit({
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
      <StepHeading title="Today's Session" desc="What you'd like out of the next hour." />
      <FieldGroup>
        <div>
          <p className={`${labelCls} mb-2.5`}>What are you hoping for today?</p>
          <ChipGroup
            options={VISIT_GOALS}
            selected={form.goals}
            onToggle={(o) => toggle("goals", o)}
          />
          {form.goals.includes("Other") && (
            <div className="mt-4 border-l-2 border-sage/50 pl-4">
              <TextField
                label="Please describe"
                value={form.goalsOther}
                onChange={(e) => set("goalsOther", e.target.value)}
              />
            </div>
          )}
        </div>

        <div>
          <p className={`${labelCls} mb-2.5`}>Preferred pressure</p>
          <PillRow
            options={PRESSURE_LEVELS}
            value={form.pressure}
            onChange={(v) => set("pressure", v)}
          />
        </div>

        <div>
          <p className={labelCls}>
            Pain level right now
            <span className="ml-2 font-normal text-bark-light">
              {form.painLevel === null ? "not set" : `${form.painLevel} / 10`}
            </span>
          </p>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={form.painLevel ?? 0}
            onChange={(e) => set("painLevel", Number(e.target.value))}
            className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-brand-light accent-sage"
            aria-label="Pain level from 0 to 10"
          />
          <div className="mt-1 flex justify-between text-xs text-bark-light">
            <span>0 — none</span>
            <span>10 — worst</span>
          </div>
        </div>

        <div>
          <p className={`${labelCls} mb-2`}>
            Tap the figures wherever you feel pain, tension, or soreness.
          </p>
          <BodyDiagram
            front={form.painMarkersFront}
            back={form.painMarkersBack}
            onFrontChange={(m) => set("painMarkersFront", m)}
            onBackChange={(m) => set("painMarkersBack", m)}
          />
        </div>

        <TextArea
          label="Areas to avoid, or that you do NOT want worked on"
          rows={2}
          value={form.areasToAvoid}
          onChange={(e) => set("areasToAvoid", e.target.value)}
        />

        <RadioCards
          label="Communication during your session"
          name="session-preference"
          options={SESSION_PREFERENCES}
          value={form.sessionPreference}
          onChange={(v) => set("sessionPreference", v)}
        />

        <div>
          <p className={`${labelCls} mb-2.5`}>Enhancements — optional add-ons, $10–$30 each</p>
          <div className="space-y-2.5">
            {ENHANCEMENT_OPTIONS.map((opt) => (
              <CheckBox
                key={opt}
                checked={form.enhancements.includes(opt)}
                onChange={() => toggle("enhancements", opt)}
              >
                {opt}
              </CheckBox>
            ))}
          </div>
        </div>
      </FieldGroup>
    </>
  );
}
