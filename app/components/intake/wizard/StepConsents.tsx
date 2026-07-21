"use client";

import { getConsentBundle } from "@/app/lib/consents";
import type { IntakeFormData } from "@/app/lib/intake-types";
import { CheckBox, StepHeading } from "./fields";

const bundle = getConsentBundle();

export default function StepConsents({
  form,
  set,
}: {
  form: IntakeFormData;
  set: <K extends keyof IntakeFormData>(key: K, value: IntakeFormData[K]) => void;
}) {
  /**
   * Each clause records the moment it was ticked. Six timestamps is the evidence
   * that this was six separate acts of agreement, not one bulk acceptance.
   */
  function toggleConsent(key: string, agreed: boolean) {
    const next = { ...form.consents };
    if (agreed) next[key] = new Date().toISOString();
    else delete next[key];
    set("consents", next);
  }

  const agreedCount = bundle.items.filter((i) => form.consents[i.key]).length;

  return (
    <>
      <StepHeading
        title="Agreements"
        desc="Please read each one. You agree to them separately, and all six are required before you can sign."
      />

      <div className="space-y-4">
        {bundle.items.map((item, index) => {
          const agreed = Boolean(form.consents[item.key]);
          return (
            <article
              key={item.key}
              className="overflow-hidden rounded-2xl border border-brand-light bg-white"
            >
              <header className="border-b border-brand-light/70 bg-cream/50 px-5 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
                  {index + 1} of {bundle.items.length}
                </p>
                <h3 className="mt-0.5 font-display text-lg text-bark">{item.title}</h3>
                <p className="text-sm text-bark-light">{item.summary}</p>
              </header>

              <div className="max-h-56 space-y-3 overflow-y-auto px-5 py-4 text-[15px] leading-relaxed text-bark-light">
                {item.body.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>

              <div className="border-t border-brand-light/70 px-4 py-3">
                <CheckBox checked={agreed} onChange={(v) => toggleConsent(item.key, v)} emphasis>
                  {item.acknowledgement}
                </CheckBox>
              </div>
            </article>
          );
        })}
      </div>

      <p className="mt-5 text-center text-xs text-bark-light">
        {agreedCount} of {bundle.items.length} agreed · Terms version {bundle.version}, updated{" "}
        {bundle.updated}
      </p>
    </>
  );
}
