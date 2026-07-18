"use client";

import { useCallback, useEffect, useState } from "react";
import type { IntakeSubmission } from "@/app/lib/intake-types";

interface IntakeSummary {
  id: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  service: string;
  serviceDuration: string;
  submittedAt: string;
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

function IntakeDetail({ submission, onBack, onDelete }: {
  submission: IntakeSubmission;
  onBack: () => void;
  onDelete: () => void;
}) {
  const submitted = new Date(submission.submittedAt).toLocaleString();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Btn variant="secondary" small onClick={onBack}>← Back to list</Btn>
        <Btn variant="danger" small onClick={onDelete}>Delete</Btn>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-bark">{submission.name}</h2>
        <p className="text-sm text-bark-light">Submitted {submitted}</p>
      </div>
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
        <DetailRow label="Injuries" value={submission.hasInjuries} />
        <DetailRow label="Injury Details" value={submission.injuryDetails} />
        <DetailRow label="Surgeries" value={submission.hasSurgeries} />
        <DetailRow label="Surgery Details" value={submission.surgeryDetails} />
        <DetailRow label="Medical Conditions" value={submission.medicalConditions} />
        <DetailRow label="Pregnant" value={submission.isPregnant} />
        <DetailRow label="Pregnancy Details" value={submission.pregnancyDetails} />
        <DetailRow label="Allergies" value={submission.allergies} />
        <DetailRow label="Bodywork Preference" value={submission.bodyworkPreference} />
        <DetailRow label="Areas to Avoid" value={submission.areasToAvoid} />
        <DetailRow label="Service" value={submission.service} />
        <DetailRow label="Duration" value={submission.serviceDuration ? `${submission.serviceDuration} min` : ""} />
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
      </dl>
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

  if (selected) {
    return (
      <IntakeDetail
        submission={selected}
        onBack={() => setSelected(null)}
        onDelete={() => handleDelete(selected.id)}
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
            <p className="text-bark font-medium">{item.name}</p>
            <p className="text-sm text-bark-light">
              {item.service} · {item.serviceDuration} min · {new Date(item.submittedAt).toLocaleDateString()}
            </p>
            {item.phone && <p className="text-sm text-bark-light">{item.phone}</p>}
          </div>
          <Btn small variant="secondary" onClick={() => openDetail(item.id)}>View</Btn>
        </div>
      ))}
    </div>
  );
}
