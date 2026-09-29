"use client";

import { styles } from "./ClientLayout";
import { useState } from "react";
import { useAdminLang } from "./i18n";
import type {
  ClientProfile,
  ClientSummary,
  SessionInput,
} from "@/app/lib/client-types";
import { matchesClient } from "@/app/lib/client-types";

export const buttonClass = `admin-button ${styles.button}`;
export const primaryClass = `${buttonClass} ${styles.primary}`;
export const panelClass = `admin-panel ${styles.card} space-y-4`;
export const controlClass =
  "admin-control w-full rounded-lg border-2 border-slate-500 bg-white px-3 py-2 text-slate-950 focus:outline-none focus:ring-4 focus:ring-sky-200";
export const emptyProfile: ClientProfile = {
  name: "",
  phone: "",
  email: "",
  birthday: "",
  precautions: "",
};
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function emptySession(): SessionInput {
  return {
    date: today(),
    service: "",
    duration: "",
    concerns: "",
    treatment: "",
    feedback: "",
    nextVisit: "",
    notes: "",
  };
}
export function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  multiline?: boolean;
}) {
  return (
    <label className="block space-y-1 text-sm font-semibold">
      <span>{label}</span>
      {multiline ? (
        <textarea
          className={controlClass}
          rows={3}
          value={value}
          maxLength={10000}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      ) : (
        <input
          className={controlClass}
          type={type}
          value={value}
          maxLength={type === "email" ? 254 : 200}
          min={type === "number" ? 1 : undefined}
          max={type === "number" ? 1440 : undefined}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      )}
    </label>
  );
}
type FormProps<T> = {
  initial: T;
  onSave: (value: T) => Promise<void>;
  onCancel: () => void;
  busy: boolean;
  onDirty: () => void;
};
function Actions({ busy, onCancel }: { busy: boolean; onCancel: () => void }) {
  const { lang } = useAdminLang();
  return (
    <div className="flex gap-3">
      <button className={primaryClass} disabled={busy} type="submit">
        {busy
          ? lang === "zh"
            ? "保存中…"
            : "Saving…"
          : lang === "zh"
            ? "保存"
            : "Save"}
      </button>
      <button
        className={buttonClass}
        disabled={busy}
        type="button"
        onClick={onCancel}
      >
        {lang === "zh" ? "取消" : "Cancel"}
      </button>
    </div>
  );
}
export function ProfileForm({
  initial,
  onSave,
  onCancel,
  busy,
  onDirty,
  clients,
  currentId,
  onUseClient,
}: FormProps<ClientProfile> & {
  clients: ClientSummary[];
  currentId?: string;
  onUseClient?: (id: string) => void;
}) {
  const { lang } = useAdminLang();
  const zh = lang === "zh";
  const [value, setValue] = useState(initial);
  const update = (key: keyof ClientProfile, v: string) => {
    setValue((old) => ({ ...old, [key]: v }));
    onDirty();
  };
  const duplicates = clients.filter(
    (c) =>
      c.id !== currentId &&
      ((value.phone.replace(/\D/g, "").length >= 7 &&
        matchesClient(c, value.phone)) ||
        (value.email.includes("@") &&
          c.email.toLowerCase() === value.email.toLowerCase()) ||
        (value.name.trim() &&
          c.name.toLowerCase() === value.name.trim().toLowerCase())),
  );
  return (
    <form
      className={panelClass}
      onSubmit={(e) => {
        e.preventDefault();
        void onSave(value);
      }}
    >
      <h3 className="font-bold text-lg">
        {zh ? "客户基本信息" : "Client information"}
      </h3>
      <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
        <Field
          label={zh ? "姓名 *" : "Name *"}
          value={value.name}
          onChange={(v) => update("name", v)}
          required
        />
        <Field
          label={zh ? "电话" : "Phone"}
          value={value.phone}
          onChange={(v) => update("phone", v)}
          type="tel"
        />
        <Field
          label={zh ? "邮箱" : "Email"}
          value={value.email}
          onChange={(v) => update("email", v)}
          type="email"
        />
        <Field
          label={zh ? "生日" : "Birthday"}
          value={value.birthday}
          onChange={(v) => update("birthday", v)}
          type="date"
        />
        <div className="sm:col-span-2">
          <Field
            label={
              zh ? "长期注意事项 / 偏好" : "Ongoing precautions / preferences"
            }
            value={value.precautions}
            onChange={(v) => update("precautions", v)}
            multiline
          />
        </div>
      </fieldset>
      {duplicates.length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-300 p-3">
          <p>
            {zh
              ? "可能已有档案，请核对："
              : "Possible existing clients — please check:"}
          </p>
          {duplicates.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 mt-2">
              <span>
                {c.name} · {c.phone || c.email}
              </span>
              {onUseClient && (
                <button
                  type="button"
                  disabled={busy}
                  className={buttonClass}
                  onClick={() => onUseClient(c.id)}
                >
                  {zh ? "使用已有档案" : "Use existing client"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <Actions busy={busy} onCancel={onCancel} />
    </form>
  );
}
export function SessionForm({
  initial,
  onSave,
  onCancel,
  busy,
  onDirty,
}: FormProps<SessionInput>) {
  const { lang } = useAdminLang();
  const zh = lang === "zh";
  const [value, setValue] = useState(initial);
  const update = (key: keyof SessionInput, v: string) => {
    setValue((old) => ({ ...old, [key]: v }));
    onDirty();
  };
  const fields: [keyof SessionInput, string, string][] = [
    ["concerns", "本次情况 / 主要诉求", "Current concerns"],
    ["treatment", "按摩处理 / 部位 / 力度", "Treatment / areas / pressure"],
    ["feedback", "客户反馈", "Client feedback"],
    ["nextVisit", "下次注意事项", "Next visit"],
    ["notes", "本次备注", "Session notes"],
  ];
  return (
    <form
      className={panelClass}
      onSubmit={(e) => {
        e.preventDefault();
        void onSave(value);
      }}
    >
      <h3 className="font-bold text-lg">
        {zh ? "按摩记录" : "Massage record"}
      </h3>
      <p className="text-sm text-slate-600">
        {zh
          ? "日期必填；其余可按需填写，也可以只写本次备注。"
          : "Date is required. Add details as needed, or just session notes."}
      </p>
      <fieldset disabled={busy} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label={zh ? "服务日期 *" : "Service date *"}
            type="date"
            value={value.date}
            onChange={(v) => update("date", v)}
            required
          />
          <Field
            label={zh ? "项目" : "Service"}
            value={value.service}
            onChange={(v) => update("service", v)}
          />
          <Field
            label={zh ? "时长（分钟）" : "Duration (minutes)"}
            type="number"
            value={value.duration}
            onChange={(v) => update("duration", v)}
          />
        </div>
        {fields.map(([key, cn, en]) => (
          <Field
            key={key}
            label={zh ? cn : en}
            value={value[key]}
            onChange={(v) => update(key, v)}
            multiline
          />
        ))}
      </fieldset>
      <Actions busy={busy} onCancel={onCancel} />
    </form>
  );
}
