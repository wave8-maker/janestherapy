"use client";

import { useCallback, useEffect, useState } from "react";
import type { IntakeSubmission } from "@/app/lib/intake-types";
import { buildIntakeHTML } from "./intakePrint";
import { useAdminLang } from "./i18n";

interface IntakeSummary {
  id: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  submittedAt: string;
  goals: string[];
  alerts: string[];
  signed: boolean;
}

function Btn({ onClick, children, variant = "primary", small }: {
  onClick?: () => void; children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger"; small?: boolean;
}) {
  const base = small ? "px-3 py-1 text-sm rounded-full font-medium" : "px-5 py-2 rounded-full font-semibold";
  const cls = {
    primary: "bg-brand text-white hover:bg-brand-dark",
    secondary: "border border-brand-light text-bark hover:bg-brand-light",
    danger: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100",
  }[variant];
  return (
    <button onClick={onClick} className={`${base} ${cls} transition-colors`}>
      {children}
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: string | boolean | null | undefined }) {
  const { t } = useAdminLang();
  if (value === null || value === undefined || value === "") return null;
  const display = typeof value === "boolean" ? (value ? t("field.yes") : t("field.no")) : value;
  return (
    <div className="grid sm:grid-cols-3 gap-1 py-2 border-b border-brand-light/50 last:border-0">
      <dt className="text-sm font-medium text-bark-light">{label}</dt>
      <dd className="sm:col-span-2 text-sm text-bark whitespace-pre-wrap">{display}</dd>
    </div>
  );
}

function stamp(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function IntakeDetail({ submission, onBack, onDelete, onPrint }: {
  submission: IntakeSubmission;
  onBack: () => void;
  onDelete: () => void;
  onPrint: () => void;
}) {
  const { t } = useAdminLang();
  const submitted = stamp(submission.submittedAt);
  const alerts = submission.conditions ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Btn variant="secondary" small onClick={onBack}>{t("intake.back")}</Btn>
        <div className="flex gap-2">
          <Btn small onClick={onPrint}>{t("intake.print")}</Btn>
          <Btn variant="danger" small onClick={onDelete}>{t("common.delete")}</Btn>
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-bark">{submission.name}</h2>
        <p className="text-sm text-bark-light">{t("intake.submitted")} {submitted}</p>
      </div>

      {alerts.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-900">
            {t("intake.conditionsReported")}
          </p>
          <p className="mt-1 text-sm text-amber-900">{alerts.join(" · ")}</p>
        </div>
      )}

      <dl className="space-y-0">
        <DetailRow label={t("field.date")} value={submission.date} />
        <DetailRow label={t("field.address")} value={submission.address} />
        <DetailRow label={t("field.email")} value={submission.email} />
        <DetailRow label={t("field.phone")} value={submission.phone} />
        <DetailRow label={t("field.birthday")} value={submission.birthday} />
        <DetailRow label={t("field.occupation")} value={submission.occupation} />
        <DetailRow label={t("field.referredBy")} value={submission.referredBy} />
        <DetailRow
          label={t("field.heardAbout")}
          value={
            [
              ...submission.hearAboutUs,
              submission.hearAboutUsOther ? `${t("common.other")}: ${submission.hearAboutUsOther}` : "",
            ]
              .filter(Boolean)
              .join(", ") || undefined
          }
        />
        <DetailRow
          label={t("field.emergencyContact")}
          value={
            [
              submission.emergencyContact?.name,
              submission.emergencyContact?.relationship,
              submission.emergencyContact?.phone,
            ]
              .filter(Boolean)
              .join(" · ") || undefined
          }
        />
        <DetailRow
          label={t("field.conditions")}
          value={
            [...(submission.conditions ?? []), submission.conditionsOther ? `${t("common.other")}: ${submission.conditionsOther}` : ""]
              .filter(Boolean)
              .join(", ") || undefined
          }
        />
        <DetailRow label={t("field.healthAttested")} value={submission.healthAttested} />
        <DetailRow label={t("field.injuries")} value={submission.hasInjuries} />
        <DetailRow label={t("field.injuryDetails")} value={submission.injuryDetails} />
        <DetailRow label={t("field.surgeries")} value={submission.hasSurgeries} />
        <DetailRow label={t("field.surgeryDetails")} value={submission.surgeryDetails} />
        <DetailRow label={t("field.medicalConditions")} value={submission.medicalConditions} />
        <DetailRow label={t("field.pregnant")} value={submission.isPregnant} />
        <DetailRow label={t("field.pregnancyDetails")} value={submission.pregnancyDetails} />
        <DetailRow label={t("field.areasToAvoid")} value={submission.areasToAvoid} />
        <DetailRow
          label={t("field.goals")}
          value={
            [...(submission.goals ?? []), submission.goalsOther ? `${t("common.other")}: ${submission.goalsOther}` : ""]
              .filter(Boolean)
              .join(", ") || undefined
          }
        />
        <DetailRow label={t("field.pressure")} value={submission.pressure} />
        <DetailRow
          label={t("field.painLevel")}
          value={submission.painLevel === null || submission.painLevel === undefined ? undefined : `${submission.painLevel} / 10`}
        />
        <DetailRow label={t("field.enhancements")} value={submission.enhancements.join(", ") || undefined} />
        <DetailRow label={t("field.sessionPreference")} value={submission.sessionPreference} />
        <DetailRow
          label={t("field.painMarkers")}
          value={
            [
              (submission.painMarkersFront ?? []).length
                ? `${t("field.front")}: ${submission.painMarkersFront.length}`
                : "",
              (submission.painMarkersBack ?? []).length
                ? `${t("field.back")}: ${submission.painMarkersBack.length}`
                : "",
            ]
              .filter(Boolean)
              .join(" · ") || undefined
          }
        />
        {/* Questions the form no longer asks — shown only for records that answered them. */}
        <DetailRow label={t("field.medications")} value={submission.medications} />
        <DetailRow label={t("field.allergies")} value={submission.allergies} />
        <DetailRow label={t("field.physician")} value={submission.physician} />
        <DetailRow label={t("field.service")} value={submission.service} />
        <DetailRow label={t("field.duration")} value={submission.serviceDuration ? `${submission.serviceDuration} min` : ""} />
        <DetailRow label={t("field.bodyworkPreference")} value={submission.bodyworkPreference} />
        <DetailRow label={t("field.music")} value={submission.musicPreference} />
        <DetailRow label={t("field.roomTemperature")} value={submission.roomTemperature} />
      </dl>

      <LegalRecordNote submission={submission} onPrint={onPrint} />
    </div>
  );
}

/**
 * The consent text and signature image are evidence, not something Jane reads
 * between clients — the screen just confirms they are on file, and the printout
 * is where they belong. A record missing either says so rather than staying
 * quiet about it.
 */
function LegalRecordNote({
  submission,
  onPrint,
}: {
  submission: IntakeSubmission;
  onPrint: () => void;
}) {
  const { t } = useAdminLang();
  const agreed = Object.keys(submission.consents ?? {}).length;
  const total = (submission.consentSnapshot ?? []).length;
  const complete = Boolean(submission.signatureDataUrl) && total > 0 && agreed === total;

  if (!complete) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
        <p className="text-sm font-semibold text-amber-900">
          {t("intake.recordIncomplete")}
        </p>
        <p className="mt-1 text-sm text-amber-900">
          {total === 0
            ? t("intake.noConsentRecord")
            : `${t("intake.agreedCount")} ${agreed} / ${total}`}
          {!submission.signatureDataUrl && ` · ${t("intake.noSignature")}`}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-light bg-white px-4 py-3">
      <p className="text-sm text-bark">
        <span className="text-green-700">✓</span> {t("intake.recordStored")}
        <span className="text-bark-light">
          {" "}
          · {agreed} {t("intake.consentsAgreed")} · {t("intake.termsVersion")} {submission.consentVersion} ·{" "}
          {t("intake.printToView")}
        </span>
      </p>
      <Btn small variant="secondary" onClick={onPrint}>
        {t("intake.print")}
      </Btn>
    </div>
  );
}

export default function IntakeTab() {
  const { t } = useAdminLang();
  const [list, setList] = useState<IntakeSummary[]>([]);
  const [selected, setSelected] = useState<IntakeSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  const loadList = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/intake");
    if (r.ok) {
      const data = await r.json();
      setList(data.submissions ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  async function openDetail(id: string) {
    const r = await fetch("/api/admin/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (r.ok) {
      const data = await r.json();
      setSelected(data.submission);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t("intake.confirmDelete"))) return;
    await fetch("/api/admin/intake", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setSelected(null);
    loadList();
  }

  function handlePrint(submission: IntakeSubmission) {
    const w = window.open("", "_blank");
    if (!w) {
      alert(t("intake.popupBlocked"));
      return;
    }
    w.document.write(buildIntakeHTML(submission));
    w.document.close();
  }

  if (selected) {
    return (
      <IntakeDetail
        submission={selected}
        onBack={() => setSelected(null)}
        onDelete={() => handleDelete(selected.id)}
        onPrint={() => handlePrint(selected)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-bark-light">
          {t("intake.heading")}
        </p>
        <Btn variant="secondary" small onClick={loadList}>{t("common.refresh")}</Btn>
      </div>
      {loading && <p className="text-bark-light text-sm">{t("common.loading")}</p>}
      {!loading && list.length === 0 && (
        <p className="text-bark-light text-sm">{t("intake.empty")}</p>
      )}
      {list.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between bg-white border border-brand-light rounded-xl px-5 py-3 hover:border-brand transition-colors"
        >
          <div>
            <p className="text-bark font-medium flex items-center gap-2">
              {item.name}
              {item.alerts?.length > 0 && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900"
                  title={item.alerts.join(" · ")}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                  {item.alerts.length} {t("intake.flags")}
                </span>
              )}
              {!item.signed && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {t("intake.unsigned")}
                </span>
              )}
            </p>
            <p className="text-sm text-bark-light">
              {[new Date(item.submittedAt).toLocaleDateString(), (item.goals ?? []).join(", ")]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {item.phone && <p className="text-sm text-bark-light">{item.phone}</p>}
          </div>
          <Btn small variant="secondary" onClick={() => openDetail(item.id)}>{t("common.view")}</Btn>
        </div>
      ))}
    </div>
  );
}
