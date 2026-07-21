"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { getConsentBundle } from "@/app/lib/consents";
import { emptyIntakeForm, type IntakeFormData } from "@/app/lib/intake-types";
import StaffGate from "./StaffGate";
import StepConsents from "./StepConsents";
import StepHealth from "./StepHealth";
import StepPersonal from "./StepPersonal";
import StepSignature from "./StepSignature";
import StepVisit from "./StepVisit";

const DRAFT_KEY = "jt-intake-draft";
/** A draft older than this belongs to someone who already left. */
const DRAFT_TTL_MS = 30 * 60 * 1000;
/** How long the thank-you screen stays up before the tablet resets itself. */
const RESET_DELAY_MS = 5000;

const STEPS = ["Welcome", "About You", "Health", "Session", "Agreements", "Signature"] as const;
const CONSENT_KEYS = getConsentBundle().items.map((i) => i.key);

type ListKey = "hearAboutUs" | "enhancements" | "conditions" | "goals";

interface Draft {
  savedAt: number;
  step: number;
  form: IntakeFormData;
}

/** Blocks Next until the step is actually complete; the message names what's missing. */
function stepError(step: number, form: IntakeFormData): string | null {
  if (step === 1) {
    if (!form.name.trim()) return "Please enter your name.";
    if (!form.phone.trim()) return "Please enter your phone number.";
  }
  if (step === 2) {
    if (form.hasInjuries === null) return "Please answer the injuries question.";
    if (form.hasSurgeries === null) return "Please answer the surgeries question.";
    if (form.isPregnant === null) return "Please answer the pregnancy question.";
    if (!form.healthAttested)
      return "Please confirm that your health information is complete and accurate.";
  }
  if (step === 3) {
    if (!form.sessionPreference) return "Please choose your communication preference.";
  }
  if (step === 4) {
    const missing = CONSENT_KEYS.filter((k) => !form.consents[k]).length;
    if (missing) return `Please read and agree to all ${CONSENT_KEYS.length} agreements.`;
  }
  if (step === 5) {
    if (!form.signatureDataUrl) return "Please sign in the box above.";
    if (!form.printedName.trim()) return "Please type your name as printed.";
  }
  return null;
}

export default function IntakeWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<IntakeFormData>(emptyIntakeForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [restored, setRestored] = useState(false);
  const lastActivity = useRef(Date.now());

  const reset = useCallback(() => {
    setForm(emptyIntakeForm());
    setStep(0);
    setError("");
    setSubmitted(false);
    setStaffOpen(false);
    setRestored(false);
    lastActivity.current = Date.now();
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* private mode — nothing was stored anyway */
    }
  }, []);

  // A new step starts at its own beginning — after the page has grown or shrunk
  // to fit the new content, so the scroll isn't undone by the re-layout.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);

  // Restore a recent draft so a stray refresh mid-form isn't fatal.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as Draft;
      if (Date.now() - draft.savedAt > DRAFT_TTL_MS) {
        window.localStorage.removeItem(DRAFT_KEY);
        return;
      }
      setForm({ ...emptyIntakeForm(), ...draft.form });
      setStep(draft.step);
      setRestored(true);
    } catch {
      /* unreadable draft — start clean */
    }
  }, []);

  // Persist after every change, except once the form is in the hands of the server.
  useEffect(() => {
    if (submitted || step === 0) return;
    try {
      const draft: Draft = { savedAt: Date.now(), step, form };
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* quota or private mode — the form still works, just without a draft */
    }
  }, [form, step, submitted]);

  // An abandoned form must not still be on screen when the next client is handed
  // the tablet, so idle time wipes it.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (submitted || step === 0) return;
      if (Date.now() - lastActivity.current > DRAFT_TTL_MS) reset();
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [reset, step, submitted]);

  function set<K extends keyof IntakeFormData>(key: K, value: IntakeFormData[K]) {
    lastActivity.current = Date.now();
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  }

  function toggle(key: ListKey, option: string) {
    lastActivity.current = Date.now();
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(option)
        ? prev[key].filter((o) => o !== option)
        : [...prev[key], option],
    }));
    setError("");
  }

  function goTo(next: number) {
    lastActivity.current = Date.now();
    setStep(next);
    setError("");
    setRestored(false);
  }

  function next() {
    const problem = stepError(step, form);
    if (problem) {
      setError(problem);
      return;
    }
    if (step === STEPS.length - 1) {
      void submit();
      return;
    }
    goTo(step + 1);
  }

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Submission failed. Please ask Jane for help.");
        return;
      }
      try {
        window.localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* nothing stored */
      }
      setSubmitted(true);
    } catch {
      setError("Network error. Please ask Jane for help.");
    } finally {
      setSubmitting(false);
    }
  }

  // Thank-you screen: shows a first name and nothing else, then clears itself.
  useEffect(() => {
    if (!submitted) return;
    const timer = window.setTimeout(reset, RESET_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [submitted, reset]);

  if (submitted) {
    const firstName = form.printedName.trim().split(/\s+/)[0] || form.name.trim().split(/\s+/)[0];
    return (
      <div className="reveal mx-auto max-w-md py-24 text-center">
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
          Thank you{firstName ? `, ${firstName}` : ""}!
        </h2>
      </div>
    );
  }

  const progress = step / (STEPS.length - 1);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]" aria-hidden="true">
        <div
          className="h-full bg-gradient-to-r from-brand to-sage transition-[width] duration-500 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {step === 0 ? (
        <div className="reveal mx-auto max-w-md py-16 text-center sm:py-24">
          <Image
            src="/logo.png"
            alt="Jane's Therapy"
            width={120}
            height={120}
            priority
            className="mx-auto h-auto w-24 sm:w-28"
          />
          <h1 className="mt-8 font-display text-4xl text-bark sm:text-5xl">Welcome</h1>
          <p className="mx-auto mt-5 max-w-sm text-[17px] leading-relaxed text-bark-light">
            A few questions before your session, so Jane can work safely and give you exactly
            what you came for. It takes about five minutes.
          </p>
          {restored && (
            <p className="mx-auto mt-6 max-w-sm rounded-xl border border-brand-light bg-brand-light/30 px-4 py-3 text-sm text-bark">
              An unfinished form was found on this tablet. Continue it, or ask Jane to start a
              fresh one.
            </p>
          )}
          <button
            type="button"
            onClick={() => goTo(1)}
            className="btn btn-primary mt-9 w-full max-w-xs py-4 text-base"
          >
            {restored ? "Continue" : "Start"}
          </button>
          <button
            type="button"
            onClick={() => setStaffOpen(true)}
            className="mx-auto mt-8 block text-xs text-bark-light/70 underline underline-offset-4"
          >
            Staff
          </button>
        </div>
      ) : (
        <div className="pb-32">
          <header className="reveal mb-6 flex items-baseline justify-between gap-4">
            <p className="eyebrow">
              Step {step} of {STEPS.length - 1} · {STEPS[step]}
            </p>
            <button
              type="button"
              onClick={() => setStaffOpen(true)}
              className="text-xs text-bark-light/70 underline underline-offset-4"
            >
              Staff
            </button>
          </header>

          <div className="reveal reveal-2 rounded-[1.5rem] border border-brand-light bg-white px-5 py-8 shadow-[0_1px_2px_rgba(44,32,24,0.04),0_24px_48px_-24px_rgba(44,32,24,0.25)] sm:rounded-[2rem] sm:px-9 sm:py-10">
            {step === 1 && <StepPersonal form={form} set={set} toggle={toggle} />}
            {step === 2 && <StepHealth form={form} set={set} toggle={toggle} />}
            {step === 3 && <StepVisit form={form} set={set} toggle={toggle} />}
            {step === 4 && <StepConsents form={form} set={set} />}
            {step === 5 && <StepSignature form={form} set={set} />}
          </div>

          <div className="fixed inset-x-0 bottom-0 z-50 border-t border-brand-light bg-cream/95 backdrop-blur">
            <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
              {error && (
                <div
                  role="alert"
                  className="mb-3 rounded-xl border border-[#e0b3a4] bg-[#fdf1ec] px-4 py-2.5 text-[15px] text-[#9c3f24]"
                >
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => goTo(step - 1)}
                  className="btn btn-secondary min-h-14 flex-1 py-4"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={next}
                  disabled={submitting}
                  className="btn btn-primary min-h-14 flex-[2] py-4 text-base disabled:opacity-50"
                >
                  {step === STEPS.length - 1
                    ? submitting
                      ? "Submitting…"
                      : "Sign and Submit"
                    : "Next"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {staffOpen && <StaffGate onClose={() => setStaffOpen(false)} onStartOver={reset} />}
    </>
  );
}
