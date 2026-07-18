"use client";

import { useRef, useState } from "react";
import BodyDiagram from "./BodyDiagram";
import {
  BODYWORK_PREFERENCES,
  ENHANCEMENT_OPTIONS,
  HEAR_ABOUT_OPTIONS,
  INTAKE_SERVICES,
  SESSION_PREFERENCES,
  emptyIntakeForm,
  type IntakeFormData,
} from "@/app/lib/intake-types";

const inputCls =
  "w-full rounded-xl border border-brand-light bg-cream/60 px-4 py-3 text-base text-bark placeholder:text-bark-light/50 transition-colors focus:outline-none focus:border-sage focus:bg-white focus:ring-[3px] focus:ring-sage/20";
const labelCls = "block text-sm font-semibold text-bark";

const REQUIRED_COUNT = 9;

type SectionKey = "personal" | "health" | "prefs" | "service";

function Req() {
  return (
    <span className="text-brand" aria-hidden="true">
      {" "}
      *
    </span>
  );
}

function Section({
  num,
  title,
  desc,
  flash,
  innerRef,
  children,
}: {
  num: string;
  title: string;
  desc?: string;
  flash?: boolean;
  innerRef?: React.Ref<HTMLElement>;
  children: React.ReactNode;
}) {
  return (
    <section
      ref={innerRef}
      className={`scroll-mt-28 px-5 py-8 transition-colors duration-700 sm:px-10 sm:py-10 ${
        flash ? "bg-brand-light/40" : "bg-transparent"
      }`}
    >
      <div className="mb-6 flex items-baseline gap-4 sm:mb-7">
        <span
          className="select-none font-display text-[1.55rem] italic leading-none text-brand/50"
          aria-hidden="true"
        >
          {num}
        </span>
        <div>
          <h2 className="font-display text-xl text-bark sm:text-[1.3rem]">{title}</h2>
          {desc && <p className="mt-1 text-sm leading-relaxed text-bark-light">{desc}</p>}
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function TextField({
  label,
  required,
  span2,
  ...inputProps
}: {
  label: string;
  required?: boolean;
  span2?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${span2 ? "sm:col-span-2" : ""}`}>
      <span className={`${labelCls} mb-1.5`}>
        {label}
        {required && <Req />}
      </span>
      <input {...inputProps} aria-required={required} className={inputCls} />
    </label>
  );
}

function YesNo({
  label,
  value,
  onChange,
  detailsPlaceholder,
  details,
  onDetailsChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
  detailsPlaceholder: string;
  details: string;
  onDetailsChange: (v: string) => void;
}) {
  return (
    <div>
      <p className={labelCls}>
        {label}
        <Req />
      </p>
      <div className="mt-2 grid max-w-[15rem] grid-cols-2 rounded-full border border-brand-light bg-cream/70 p-1">
        {([true, false] as const).map((v) => (
          <button
            key={String(v)}
            type="button"
            aria-pressed={value === v}
            onClick={() => onChange(v)}
            className={`rounded-full py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 ${
              value === v ? "bg-sage text-white shadow-sm" : "text-bark-light hover:text-bark"
            }`}
          >
            {v ? "Yes" : "No"}
          </button>
        ))}
      </div>
      {value === true && (
        <div className="mt-3 border-l-2 border-sage/50 pl-4">
          <textarea
            value={details}
            onChange={(e) => onDetailsChange(e.target.value)}
            placeholder={detailsPlaceholder}
            rows={3}
            className={inputCls}
          />
        </div>
      )}
    </div>
  );
}

function RadioCards({
  label,
  name,
  options,
  value,
  onChange,
}: {
  label: string;
  name: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend className={labelCls}>
        {label}
        <Req />
      </legend>
      <div className="mt-2.5 space-y-2.5">
        {options.map((opt) => {
          const selected = value === opt;
          return (
            <label
              key={opt}
              className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sage/40 ${
                selected
                  ? "border-sage/60 bg-sage/[0.07]"
                  : "border-brand-light hover:border-brand/40"
              }`}
            >
              <input
                type="radio"
                name={name}
                checked={selected}
                onChange={() => onChange(opt)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  selected ? "border-sage" : "border-brand-light"
                }`}
              >
                {selected && <span className="h-2.5 w-2.5 rounded-full bg-sage" />}
              </span>
              <span className="text-[15px] leading-snug text-bark">{opt}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function IntakeForm() {
  const [form, setForm] = useState<IntakeFormData>(emptyIntakeForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState<SectionKey | null>(null);

  const personalRef = useRef<HTMLElement>(null);
  const healthRef = useRef<HTMLElement>(null);
  const prefsRef = useRef<HTMLElement>(null);
  const serviceRef = useRef<HTMLElement>(null);
  const sectionRefs: Record<SectionKey, React.RefObject<HTMLElement | null>> = {
    personal: personalRef,
    health: healthRef,
    prefs: prefsRef,
    service: serviceRef,
  };

  function set<K extends keyof IntakeFormData>(key: K, value: IntakeFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  }

  function toggleListItem(key: "hearAboutUs" | "enhancements", option: string) {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(option)
        ? prev[key].filter((o) => o !== option)
        : [...prev[key], option],
    }));
  }

  const selectedService = INTAKE_SERVICES.find((s) => s.name === form.service);

  const requiredDone = [
    form.name.trim(),
    form.phone.trim(),
    form.hasInjuries !== null,
    form.hasSurgeries !== null,
    form.isPregnant !== null,
    form.bodyworkPreference,
    form.sessionPreference,
    form.service,
    form.serviceDuration,
  ].filter(Boolean).length;
  const allDone = requiredDone === REQUIRED_COUNT;

  function firstIncomplete(): { message: string; key: SectionKey } | null {
    if (!form.name.trim()) return { message: "Please enter your name.", key: "personal" };
    if (!form.phone.trim()) return { message: "Please enter your phone number.", key: "personal" };
    if (form.hasInjuries === null)
      return { message: "Please answer the injuries question.", key: "health" };
    if (form.hasSurgeries === null)
      return { message: "Please answer the surgeries question.", key: "health" };
    if (form.isPregnant === null)
      return { message: "Please answer the pregnancy question.", key: "health" };
    if (!form.bodyworkPreference)
      return { message: "Please choose how you'd like the massage focused.", key: "prefs" };
    if (!form.sessionPreference)
      return { message: "Please choose your communication preference.", key: "prefs" };
    if (!form.service) return { message: "Please select a service.", key: "service" };
    if (!form.serviceDuration)
      return { message: "Please select a session duration.", key: "service" };
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const missing = firstIncomplete();
    if (missing) {
      setError(missing.message);
      setFlash(missing.key);
      sectionRefs[missing.key].current?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => setFlash(null), 1600);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Submission failed");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function startNew() {
    setForm(emptyIntakeForm());
    setSubmitted(false);
    setError("");
  }

  if (submitted) {
    const firstName = form.name.trim().split(/\s+/)[0];
    return (
      <div className="reveal mx-auto max-w-md py-20 text-center">
        <svg viewBox="0 0 64 64" className="mx-auto h-16 w-16 text-sage" aria-hidden="true">
          <circle
            cx="32"
            cy="32"
            r="30"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            transform="rotate(-90 32 32)"
            className="draw-circle"
          />
          <path
            d="M20 33 L28.5 41.5 L45 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="draw-check"
          />
        </svg>
        <h2 className="mt-6 font-display text-3xl text-bark">
          Thank you{firstName ? `, ${firstName}` : ""}.
        </h2>
        <p className="mt-3 text-lg leading-relaxed text-bark-light">
          Your intake form has been received. Jane will review it before your session.
        </p>
        <button type="button" onClick={startNew} className="btn btn-secondary mt-8">
          Submit another form
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Completion progress — hairline pinned to the very top of the viewport */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]" aria-hidden="true">
        <div
          className="h-full bg-gradient-to-r from-brand to-sage transition-[width] duration-500 ease-out"
          style={{ width: `${(requiredDone / REQUIRED_COUNT) * 100}%` }}
        />
      </div>

      <form onSubmit={handleSubmit}>
        <header className="reveal reveal-1 mb-8 text-center sm:mb-10">
          <p className="eyebrow mb-3">Confidential · Please complete before your session</p>
          <h1 className="font-display text-4xl text-bark sm:text-5xl">New Client Intake Form</h1>
          <div className="mx-auto mt-5 flex max-w-[10rem] items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-brand/30" />
            <span className="h-1.5 w-1.5 rotate-45 bg-brand/50" />
            <span className="h-px flex-1 bg-brand/30" />
          </div>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-bark-light">
            Your answers help Jane tailor every session to your body and comfort. Takes about
            3 minutes. Fields marked with <span className="text-brand">*</span> are required.
          </p>
        </header>

        <div className="reveal reveal-2 divide-y divide-brand-light/70 overflow-hidden rounded-[1.5rem] border border-brand-light bg-white shadow-[0_1px_2px_rgba(44,32,24,0.04),0_24px_48px_-24px_rgba(44,32,24,0.25)] sm:rounded-[2rem]">
          <Section
            num="01"
            title="Personal Details"
            flash={flash === "personal"}
            innerRef={personalRef}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Today's Date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
              <TextField
                label="Full Name"
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                autoComplete="name"
              />
              <TextField
                label="Full Address"
                span2
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                autoComplete="street-address"
              />
              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                autoComplete="email"
              />
              <TextField
                label="Phone Number"
                required
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                autoComplete="tel"
              />
              <TextField
                label="Birthday"
                placeholder="MM/DD/YYYY"
                value={form.birthday}
                onChange={(e) => set("birthday", e.target.value)}
              />
              <TextField
                label="Occupation"
                value={form.occupation}
                onChange={(e) => set("occupation", e.target.value)}
              />
              <TextField
                label="Referred By"
                span2
                value={form.referredBy}
                onChange={(e) => set("referredBy", e.target.value)}
              />
            </div>
          </Section>

          <Section num="02" title="How You Found Us" desc="Select all that apply.">
            <div className="flex flex-wrap gap-2.5">
              {HEAR_ABOUT_OPTIONS.map((opt) => {
                const on = form.hearAboutUs.includes(opt);
                return (
                  <label
                    key={opt}
                    className={`cursor-pointer rounded-full border px-4 py-2.5 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sage/40 ${
                      on
                        ? "border-sage bg-sage text-white"
                        : "border-brand-light text-bark-light hover:border-brand/50 hover:text-bark"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleListItem("hearAboutUs", opt)}
                      className="sr-only"
                    />
                    {opt}
                  </label>
                );
              })}
            </div>
            <TextField
              label="Other"
              placeholder="Please specify"
              value={form.hearAboutUsOther}
              onChange={(e) => set("hearAboutUsOther", e.target.value)}
            />
          </Section>

          <Section
            num="03"
            title="Health History"
            desc="This helps Jane work safely and effectively with your body."
            flash={flash === "health"}
            innerRef={healthRef}
          >
            <YesNo
              label="Recent or past injuries?"
              value={form.hasInjuries}
              onChange={(v) => set("hasInjuries", v)}
              detailsPlaceholder="Include general date and details — pain, stiffness, loss of range of motion, etc."
              details={form.injuryDetails}
              onDetailsChange={(v) => set("injuryDetails", v)}
            />
            <YesNo
              label="Recent or past surgeries?"
              value={form.hasSurgeries}
              onChange={(v) => set("hasSurgeries", v)}
              detailsPlaceholder="Include general date and details — pain, stiffness, loss of range of motion, etc."
              details={form.surgeryDetails}
              onDetailsChange={(v) => set("surgeryDetails", v)}
            />
            <YesNo
              label="Are you pregnant?"
              value={form.isPregnant}
              onChange={(v) => set("isPregnant", v)}
              detailsPlaceholder="How far along are you? Any special circumstances we should be aware of?"
              details={form.pregnancyDetails}
              onDetailsChange={(v) => set("pregnancyDetails", v)}
            />
            <label className="block">
              <span className={`${labelCls} mb-1.5`}>Medical Conditions</span>
              <textarea
                value={form.medicalConditions}
                onChange={(e) => set("medicalConditions", e.target.value)}
                rows={3}
                placeholder="Anything your therapist should know — e.g. blood pressure, diabetes, skin conditions."
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className={`${labelCls} mb-1.5`}>Allergies</span>
              <textarea
                value={form.allergies}
                onChange={(e) => set("allergies", e.target.value)}
                rows={2}
                placeholder="Oils, lotions, scents, nuts, latex…"
                className={inputCls}
              />
            </label>
          </Section>

          <Section
            num="04"
            title="Areas of Discomfort"
            desc="Optional — tap the figures wherever you feel pain, tension, or soreness."
          >
            <BodyDiagram
              front={form.painMarkersFront}
              back={form.painMarkersBack}
              onFrontChange={(m) => set("painMarkersFront", m)}
              onBackChange={(m) => set("painMarkersBack", m)}
            />
            <label className="block">
              <span className={`${labelCls} mb-1.5`}>
                Areas to avoid or that you do NOT want worked on
              </span>
              <textarea
                value={form.areasToAvoid}
                onChange={(e) => set("areasToAvoid", e.target.value)}
                rows={2}
                className={inputCls}
              />
            </label>
          </Section>

          <Section
            num="05"
            title="Session Preferences"
            flash={flash === "prefs"}
            innerRef={prefsRef}
          >
            <RadioCards
              label="How would you like the massage focused?"
              name="bodywork-preference"
              options={BODYWORK_PREFERENCES}
              value={form.bodyworkPreference}
              onChange={(v) => set("bodyworkPreference", v)}
            />
            <RadioCards
              label="Communication during your session"
              name="session-preference"
              options={SESSION_PREFERENCES}
              value={form.sessionPreference}
              onChange={(v) => set("sessionPreference", v)}
            />
          </Section>

          <Section
            num="06"
            title="Service & Duration"
            desc="Confirm what you'd like for today's session."
            flash={flash === "service"}
            innerRef={serviceRef}
          >
            <label className="block">
              <span className={`${labelCls} mb-1.5`}>
                Service
                <Req />
              </span>
              <div className="relative">
                <select
                  value={form.service}
                  onChange={(e) => {
                    set("service", e.target.value);
                    set("serviceDuration", "");
                  }}
                  aria-required
                  className={`${inputCls} appearance-none pr-11 ${
                    form.service ? "" : "text-bark-light/60"
                  }`}
                >
                  <option value="">Select a service</option>
                  {INTAKE_SERVICES.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <svg
                  viewBox="0 0 16 16"
                  className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-bark-light"
                  aria-hidden="true"
                >
                  <path
                    d="M4 6l4 4 4-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </label>
            {selectedService && (
              <div>
                <p className={labelCls}>
                  Duration
                  <Req />
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedService.durations.map((d) => (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={form.serviceDuration === d}
                      onClick={() => set("serviceDuration", d)}
                      className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 ${
                        form.serviceDuration === d
                          ? "border-sage bg-sage text-white"
                          : "border-brand-light text-bark-light hover:border-brand/50 hover:text-bark"
                      }`}
                    >
                      {d} min
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Section>

          <Section num="07" title="Enhancements" desc="Optional add-ons, $10–$30 each.">
            <div className="space-y-2.5">
              {ENHANCEMENT_OPTIONS.map((opt) => {
                const on = form.enhancements.includes(opt);
                return (
                  <label
                    key={opt}
                    className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sage/40 ${
                      on ? "border-sage/60 bg-sage/[0.07]" : "border-brand-light hover:border-brand/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleListItem("enhancements", opt)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[0.4rem] border-2 transition-colors ${
                        on ? "border-sage bg-sage" : "border-brand-light bg-white"
                      }`}
                    >
                      <svg
                        viewBox="0 0 12 10"
                        className={`h-3 w-3 transition-opacity ${on ? "opacity-100" : "opacity-0"}`}
                      >
                        <path
                          d="M1 5.2 4.2 8.4 11 1.6"
                          fill="none"
                          stroke="white"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span className="text-[15px] leading-snug text-bark">{opt}</span>
                  </label>
                );
              })}
            </div>
          </Section>

          {/* Submit */}
          <div className="bg-cream/50 px-5 py-8 sm:px-10 sm:py-10">
            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-[#e0b3a4] bg-[#fdf1ec] px-4 py-3 text-[15px] text-[#9c3f24]"
              >
                {error}
              </div>
            )}
            <p
              className={`mb-4 text-center text-xs font-medium tracking-wide ${
                allDone ? "text-sage" : "text-bark-light"
              }`}
            >
              {allDone
                ? "All required questions answered — you're ready to submit."
                : `${requiredDone} of ${REQUIRED_COUNT} required questions answered`}
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-full py-4 text-base disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit Intake Form"}
            </button>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-bark-light">
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                <path d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H4a1.5 1.5 0 0 0-1.5 1.5v5A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 12 6h-.5V4.5A3.5 3.5 0 0 0 8 1Zm2 5H6V4.5a2 2 0 1 1 4 0V6Z" />
              </svg>
              Your information is kept confidential and reviewed only by your therapist.
            </p>
          </div>
        </div>
      </form>
    </>
  );
}
