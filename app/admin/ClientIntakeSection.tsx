"use client";

import { useEffect, useState } from "react";
import type { IntakeLink } from "@/app/lib/client-types";
import type { IntakeSubmission } from "@/app/lib/intake-types";
import { IntakeDetail } from "./IntakeTab";
import { buildIntakeHTML } from "./intakePrint";
import { useAdminLang } from "./i18n";
import { buttonClass, controlClass, panelClass } from "./ClientForms";

/** Signed intake belongs to the client page, alongside notes and massage records. */
export default function ClientIntakeSection({
  links,
}: {
  links: IntakeLink[];
}) {
  const { lang } = useAdminLang();
  const zh = lang === "zh";
  const ordered = [...links].sort((a, b) =>
    (b.submittedAt || b.createdAt).localeCompare(a.submittedAt || a.createdAt),
  );
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(ordered[0]?.intakeId ?? "");
  const [submission, setSubmission] = useState<IntakeSubmission | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [popupBlocked, setPopupBlocked] = useState(false);
  useEffect(() => {
    if (!open || !selectedId) return;
    let cancelled = false;
    setSubmission(null);
    setError(false);
    async function load() {
      try {
        const response = await fetch("/api/admin/intake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: selectedId }),
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Unable to load");
        const data = await response.json();
        if (!cancelled) setSubmission(data.submission);
      } catch {
        if (!cancelled) setError(true);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, selectedId, retry]);
  function print() {
    if (!submission) return;
    const windowRef = window.open("", "_blank");
    if (!windowRef) {
      setPopupBlocked(true);
      return;
    }
    setPopupBlocked(false);
    windowRef.document.write(buildIntakeHTML(submission));
    windowRef.document.close();
  }
  return (
    <section
      className={panelClass}
      aria-label={zh ? "客户登记表" : "Client intake"}
    >
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h3 className="font-bold text-lg">
            {zh ? "登记表" : "Intake form"}
            {links.length ? ` (${links.length})` : ""}
          </h3>
          <p className="text-sm text-slate-600">
            {links.length
              ? zh
                ? "已关联此客户，保留原始健康申报和签署记录。"
                : "Linked to this client, with original health disclosures and signing records."
              : zh
                ? "此客户尚未填写登记表。"
                : "No intake form for this client yet."}
          </p>
        </div>
        {links.length > 0 && (
          <button
            className={buttonClass}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open
              ? zh
                ? "收起登记表"
                : "Hide intake"
              : zh
                ? "查看登记表"
                : "View intake"}
          </button>
        )}
      </div>
      {open && (
        <div className="space-y-4">
          {links.length > 1 && (
            <label className="block space-y-1">
              <span>{zh ? "登记日期" : "Submission date"}</span>
              <select
                className={controlClass}
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {ordered.map((link, index) => (
                  <option key={link.intakeId} value={link.intakeId}>
                    {index + 1}.{" "}
                    {new Date(
                      link.submittedAt || link.createdAt,
                    ).toLocaleString(zh ? "zh-CN" : "en-US")}
                  </option>
                ))}
              </select>
            </label>
          )}
          {error ? (
            <div role="alert" className="text-red-800">
              <p>
                {zh
                  ? "登记表读取失败，请重试；登录过期时请重新登录。"
                  : "Could not load the intake. Retry, or sign in again if your session expired."}
              </p>
              <button
                className={buttonClass}
                onClick={() => setRetry((v) => v + 1)}
              >
                {zh ? "重试" : "Retry"}
              </button>
            </div>
          ) : submission ? (
            <IntakeDetail submission={submission} onPrint={print} />
          ) : (
            <p role="status">{zh ? "正在读取登记表…" : "Loading intake…"}</p>
          )}
          {popupBlocked && (
            <p role="alert">
              {zh
                ? "请允许弹出窗口后重试打印。"
                : "Allow popups and retry printing."}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
