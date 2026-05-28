"use client";

import { useState } from "react";
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
  "w-full border border-brand-light rounded-xl px-4 py-3 text-base text-bark focus:outline-none focus:ring-2 focus:ring-brand bg-white";
const labelCls = "block text-sm font-semibold text-bark mb-2";
const sectionCls = "bg-white border border-brand-light rounded-2xl p-6 shadow-sm space-y-5";

function YesNoField({
  label,
  value,
  onChange,
  detailsLabel,
  details,
  onDetailsChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
  detailsLabel: string;
  details: string;
  onDetailsChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className={labelCls}>{label}</p>
      <div className="flex gap-3">
        {([true, false] as const).map((v) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => onChange(v)}
            className={`flex-1 py-3 rounded-xl text-base font-medium border transition-colors ${
              value === v
                ? "bg-brand text-white border-brand"
                : "border-brand-light text-bark hover:bg-brand-light"
            }`}
          >
            {v ? "Yes" : "No"}
          </button>
        ))}
      </div>
      {value === true && (
        <textarea
          value={details}
          onChange={(e) => onDetailsChange(e.target.value)}
          placeholder={detailsLabel}
          rows={3}
          className={inputCls}
        />
      )}
    </div>
  );
}

function RadioGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className={labelCls}>{label}</p>
      <div className="space-y-2">
        {options.map((opt) => (
          <label
            key={opt}
            className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
              value === opt ? "border-brand bg-brand-light/50" : "border-brand-light hover:bg-brand-light/30"
            }`}
          >
            <input
              type="radio"
              name={label}
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="mt-1 accent-brand w-5 h-5 shrink-0"
            />
            <span className="text-base text-bark">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function IntakeForm() {
  const [form, setForm] = useState<IntakeFormData>(emptyIntakeForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof IntakeFormData>(key: K, value: IntakeFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleHearAbout(option: string) {
    setForm((prev) => ({
      ...prev,
      hearAboutUs: prev.hearAboutUs.includes(option)
        ? prev.hearAboutUs.filter((o) => o !== option)
        : [...prev.hearAboutUs, option],
    }));
  }

  function toggleEnhancement(option: string) {
    setForm((prev) => ({
      ...prev,
      enhancements: prev.enhancements.includes(option)
        ? prev.enhancements.filter((o) => o !== option)
        : [...prev.enhancements, option],
    }));
  }

  const selectedService = INTAKE_SERVICES.find((s) => s.name === form.service);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
    return (
      <div className="text-center py-16 space-y-6">
        <div className="text-5xl">✓</div>
        <h2 className="text-2xl font-semibold text-bark">Thank you!</h2>
        <p className="text-bark-light text-lg max-w-md mx-auto">
          Your intake form has been submitted. Jane will review it before your session.
        </p>
        <button
          type="button"
          onClick={startNew}
          className="bg-sage text-white px-8 py-3 rounded-full text-base font-semibold hover:opacity-90 transition-opacity"
        >
          Submit Another Form
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-2">
        <h1 className="text-3xl font-semibold text-bark tracking-wide">Jane&apos;s Therapy</h1>
        <p className="text-bark-light mt-1">New Client Intake Form</p>
      </div>

      {/* Personal Info */}
      <section className={sectionCls}>
        <h2 className="text-lg font-semibold text-bark border-b border-brand-light pb-2">Personal Information</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Date</label>
            <input value={form.date} onChange={(e) => set("date", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputCls}
              autoComplete="name"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Full Address</label>
            <input
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className={inputCls}
              autoComplete="street-address"
            />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className={inputCls}
              autoComplete="email"
            />
          </div>
          <div>
            <label className={labelCls}>Phone Number *</label>
            <input
              required
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={inputCls}
              autoComplete="tel"
            />
          </div>
          <div>
            <label className={labelCls}>Birthday</label>
            <input
              value={form.birthday}
              onChange={(e) => set("birthday", e.target.value)}
              placeholder="MM/DD/YYYY"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Occupation</label>
            <input value={form.occupation} onChange={(e) => set("occupation", e.target.value)} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Referred By</label>
            <input value={form.referredBy} onChange={(e) => set("referredBy", e.target.value)} className={inputCls} />
          </div>
        </div>
      </section>

      {/* How did you hear about us */}
      <section className={sectionCls}>
        <h2 className="text-lg font-semibold text-bark border-b border-brand-light pb-2">Where did you hear about us?</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {HEAR_ABOUT_OPTIONS.map((opt) => (
            <label
              key={opt}
              className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${
                form.hearAboutUs.includes(opt) ? "border-brand bg-brand-light/50" : "border-brand-light"
              }`}
            >
              <input
                type="checkbox"
                checked={form.hearAboutUs.includes(opt)}
                onChange={() => toggleHearAbout(opt)}
                className="accent-brand w-5 h-5"
              />
              <span className="text-base">{opt}</span>
            </label>
          ))}
        </div>
        <div>
          <label className={labelCls}>Other</label>
          <input
            value={form.hearAboutUsOther}
            onChange={(e) => set("hearAboutUsOther", e.target.value)}
            placeholder="Please specify"
            className={inputCls}
          />
        </div>
      </section>

      {/* Health History */}
      <section className={sectionCls}>
        <h2 className="text-lg font-semibold text-bark border-b border-brand-light pb-2">Health History</h2>
        <YesNoField
          label="Recent or past injuries?"
          value={form.hasInjuries}
          onChange={(v) => set("hasInjuries", v)}
          detailsLabel="Include general date and details regarding pain, stiffness, loss of range of motion, etc."
          details={form.injuryDetails}
          onDetailsChange={(v) => set("injuryDetails", v)}
        />
        <YesNoField
          label="Recent or past surgeries?"
          value={form.hasSurgeries}
          onChange={(v) => set("hasSurgeries", v)}
          detailsLabel="Include general date and details regarding pain, stiffness, loss of range of motion, etc."
          details={form.surgeryDetails}
          onDetailsChange={(v) => set("surgeryDetails", v)}
        />
        <div>
          <label className={labelCls}>Medical Conditions</label>
          <textarea
            value={form.medicalConditions}
            onChange={(e) => set("medicalConditions", e.target.value)}
            rows={3}
            className={inputCls}
          />
        </div>
        <YesNoField
          label="Are you pregnant?"
          value={form.isPregnant}
          onChange={(v) => set("isPregnant", v)}
          detailsLabel="How far along are you? Are there any special circumstances we should be aware of?"
          details={form.pregnancyDetails}
          onDetailsChange={(v) => set("pregnancyDetails", v)}
        />
        <div>
          <label className={labelCls}>Allergies</label>
          <textarea value={form.allergies} onChange={(e) => set("allergies", e.target.value)} rows={2} className={inputCls} />
        </div>
      </section>

      {/* Session Preferences */}
      <section className={sectionCls}>
        <h2 className="text-lg font-semibold text-bark border-b border-brand-light pb-2">For Today&apos;s Bodywork Session</h2>
        <RadioGroup
          label="I prefer:"
          options={BODYWORK_PREFERENCES}
          value={form.bodyworkPreference}
          onChange={(v) => set("bodyworkPreference", v)}
        />
        <div>
          <label className={labelCls}>Areas to avoid or that you do NOT want worked on</label>
          <textarea value={form.areasToAvoid} onChange={(e) => set("areasToAvoid", e.target.value)} rows={2} className={inputCls} />
        </div>
      </section>

      {/* Service Selection */}
      <section className={sectionCls}>
        <h2 className="text-lg font-semibold text-bark border-b border-brand-light pb-2">Service & Session Time</h2>
        <div>
          <label className={labelCls}>Service *</label>
          <select
            required
            value={form.service}
            onChange={(e) => {
              set("service", e.target.value);
              set("serviceDuration", "");
            }}
            className={inputCls}
          >
            <option value="">Select a service</option>
            {INTAKE_SERVICES.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        {selectedService && (
          <div>
            <label className={labelCls}>Duration (minutes) *</label>
            <div className="flex flex-wrap gap-2">
              {selectedService.durations.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => set("serviceDuration", d)}
                  className={`px-5 py-3 rounded-xl text-base font-medium border transition-colors ${
                    form.serviceDuration === d
                      ? "bg-brand text-white border-brand"
                      : "border-brand-light text-bark hover:bg-brand-light"
                  }`}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Enhancements */}
      <section className={sectionCls}>
        <h2 className="text-lg font-semibold text-bark border-b border-brand-light pb-2">
          Massage Enhancements ($10–30)
        </h2>
        <div className="space-y-2">
          {ENHANCEMENT_OPTIONS.map((opt) => (
            <label
              key={opt}
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                form.enhancements.includes(opt) ? "border-brand bg-brand-light/50" : "border-brand-light"
              }`}
            >
              <input
                type="checkbox"
                checked={form.enhancements.includes(opt)}
                onChange={() => toggleEnhancement(opt)}
                className="mt-1 accent-brand w-5 h-5 shrink-0"
              />
              <span className="text-base text-bark">{opt}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Communication Preference */}
      <section className={sectionCls}>
        <h2 className="text-lg font-semibold text-bark border-b border-brand-light pb-2">For Today&apos;s Session</h2>
        <RadioGroup
          label="I prefer:"
          options={SESSION_PREFERENCES}
          value={form.sessionPreference}
          onChange={(v) => set("sessionPreference", v)}
        />
      </section>

      {/* Body Diagram */}
      <section className={sectionCls}>
        <h2 className="text-lg font-semibold text-bark border-b border-brand-light pb-2">Pain & Discomfort Areas</h2>
        <BodyDiagram
          markers={form.painMarkersBack}
          onChange={(m) => set("painMarkersBack", m)}
        />
      </section>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-base">{error}</div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-sage text-white py-4 rounded-full text-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit Intake Form"}
      </button>
    </form>
  );
}
