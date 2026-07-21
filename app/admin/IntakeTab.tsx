"use client";

import { useCallback, useEffect, useState } from "react";
import type { IntakeSubmission } from "@/app/lib/intake-types";
import { buildIntakeHTML } from "./intakePrint";

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
  if (value === null || value === undefined || value === "") return null;
  const display = typeof value === "boolean" ? (value ? "Yes" : "No") : value;
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
  const submitted = stamp(submission.submittedAt);
  const alerts = submission.conditions ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Btn variant="secondary" small onClick={onBack}>← Back to list</Btn>
        <div className="flex gap-2">
          <Btn small onClick={onPrint}>打印 / 存 PDF · Print</Btn>
          <Btn variant="danger" small onClick={onDelete}>Delete</Btn>
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-bark">{submission.name}</h2>
        <p className="text-sm text-bark-light">Submitted {submitted}</p>
      </div>

      {alerts.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-900">
            健康提示 · Conditions reported
          </p>
          <p className="mt-1 text-sm text-amber-900">{alerts.join(" · ")}</p>
        </div>
      )}

      <dl className="space-y-0">
        <DetailRow label="Date" value={submission.date} />
        <DetailRow label="Address" value={submission.address} />
        <DetailRow label="Email" value={submission.email} />
        <DetailRow label="Phone" value={submission.phone} />
        <DetailRow label="Birthday" value={submission.birthday} />
        <DetailRow label="Occupation" value={submission.occupation} />
        <DetailRow label="Referred By" value={submission.referredBy} />
        <DetailRow
          label="Heard About Us"
          value={
            [
              ...submission.hearAboutUs,
              submission.hearAboutUsOther ? `Other: ${submission.hearAboutUsOther}` : "",
            ]
              .filter(Boolean)
              .join(", ") || undefined
          }
        />
        <DetailRow
          label="Emergency Contact"
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
          label="Conditions Reported"
          value={
            [...(submission.conditions ?? []), submission.conditionsOther ? `Other: ${submission.conditionsOther}` : ""]
              .filter(Boolean)
              .join(", ") || undefined
          }
        />
        <DetailRow label="Health Attested" value={submission.healthAttested} />
        <DetailRow label="Injuries" value={submission.hasInjuries} />
        <DetailRow label="Injury Details" value={submission.injuryDetails} />
        <DetailRow label="Surgeries" value={submission.hasSurgeries} />
        <DetailRow label="Surgery Details" value={submission.surgeryDetails} />
        <DetailRow label="Medical Conditions" value={submission.medicalConditions} />
        <DetailRow label="Pregnant" value={submission.isPregnant} />
        <DetailRow label="Pregnancy Details" value={submission.pregnancyDetails} />
        <DetailRow label="Areas to Avoid" value={submission.areasToAvoid} />
        <DetailRow
          label="Goals"
          value={
            [...(submission.goals ?? []), submission.goalsOther ? `Other: ${submission.goalsOther}` : ""]
              .filter(Boolean)
              .join(", ") || undefined
          }
        />
        <DetailRow label="Preferred Pressure" value={submission.pressure} />
        <DetailRow
          label="Pain Level"
          value={submission.painLevel === null || submission.painLevel === undefined ? undefined : `${submission.painLevel} / 10`}
        />
        <DetailRow label="Enhancements" value={submission.enhancements.join(", ") || undefined} />
        <DetailRow label="Session Preference" value={submission.sessionPreference} />
        <DetailRow
          label="Pain Markers"
          value={
            [
              (submission.painMarkersFront ?? []).length
                ? `Front: ${submission.painMarkersFront.length}`
                : "",
              (submission.painMarkersBack ?? []).length
                ? `Back: ${submission.painMarkersBack.length}`
                : "",
            ]
              .filter(Boolean)
              .join(" · ") || undefined
          }
        />
        {/* Questions the form no longer asks — shown only for records that answered them. */}
        <DetailRow label="Medications" value={submission.medications} />
        <DetailRow label="Allergies" value={submission.allergies} />
        <DetailRow label="Primary Physician" value={submission.physician} />
        <DetailRow label="Service" value={submission.service} />
        <DetailRow label="Duration" value={submission.serviceDuration ? `${submission.serviceDuration} min` : ""} />
        <DetailRow label="Bodywork Preference" value={submission.bodyworkPreference} />
        <DetailRow label="Music" value={submission.musicPreference} />
        <DetailRow label="Room Temperature" value={submission.roomTemperature} />
      </dl>

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-bark">
          签署记录 <span className="text-bark-light/70">Consent record</span>
          {submission.consentVersion && (
            <span className="ml-2 text-sm font-normal text-bark-light">
              version {submission.consentVersion}
            </span>
          )}
        </h3>
        {(submission.consentSnapshot ?? []).length === 0 && (
          <p className="text-sm text-bark-light">
            这份记录早于电子签名功能。No consent record stored with this submission.
          </p>
        )}
        {(submission.consentSnapshot ?? []).map((item) => {
          const at = submission.consents?.[item.key];
          return (
            <details key={item.key} className="rounded-xl border border-brand-light bg-white px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium text-bark">
                <span className={at ? "text-green-700" : "text-red-600"}>{at ? "☑" : "☐"}</span>{" "}
                {item.title}
                <span className="ml-2 text-xs font-normal text-bark-light">
                  {at ? `agreed ${stamp(at)}` : "not agreed"}
                </span>
              </summary>
              <div className="mt-2 space-y-2 text-sm text-bark-light">
                {item.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                <p className="font-medium text-bark">{item.acknowledgement}</p>
              </div>
            </details>
          );
        })}
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-semibold text-bark">
          电子签名 <span className="text-bark-light/70">Signature</span>
        </h3>
        {submission.signatureDataUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element -- a data: URL, not an optimizable asset */
          <img
            src={submission.signatureDataUrl}
            alt={`Signature of ${submission.printedName || submission.name}`}
            className="max-h-32 rounded-xl border border-brand-light bg-white p-2"
          />
        ) : (
          <p className="text-sm text-bark-light">未签名 · No signature on file.</p>
        )}
        <p className="text-sm text-bark-light">
          {submission.printedName && <>Printed name: {submission.printedName} · </>}
          IP {submission.meta?.ip || "—"}
        </p>
        {submission.meta?.userAgent && (
          <p className="text-xs text-bark-light/80 break-all">{submission.meta.userAgent}</p>
        )}
      </section>
    </div>
  );
}

export default function IntakeTab() {
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
    if (!confirm("Delete this intake form? This cannot be undone.")) return;
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
      alert("请允许弹出窗口以打印。Please allow pop-ups to print this record.");
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
          客户登记表 <span className="text-bark-light/70">Client Intake Forms</span>
        </p>
        <Btn variant="secondary" small onClick={loadList}>Refresh</Btn>
      </div>
      {loading && <p className="text-bark-light text-sm">Loading…</p>}
      {!loading && list.length === 0 && (
        <p className="text-bark-light text-sm">暂无登记表。No intake forms yet.</p>
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
                  {item.alerts.length} 健康提示
                </span>
              )}
              {!item.signed && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  未签名
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
          <Btn small variant="secondary" onClick={() => openDetail(item.id)}>View</Btn>
        </div>
      ))}
    </div>
  );
}
