"use client";

import { useEffect, useState } from "react";
import { useAdminLang } from "./i18n";
import { ClientIcon, styles } from "./ClientLayout";
import ClientIntakeSection from "./ClientIntakeSection";
import type {
  ClientRecord,
  ClientSummary,
  IntakeLink,
  ClientProfile,
  SessionInput,
  MassageSession,
} from "@/app/lib/client-types";
import { matchesClient, summarizeClient } from "@/app/lib/client-types";
import {
  ProfileForm,
  SessionForm,
  emptyProfile,
  emptySession,
  buttonClass,
  primaryClass,
  panelClass,
  controlClass,
} from "./ClientForms";

type Editor =
  | { kind: "profile"; initial: ClientProfile }
  | { kind: "session"; id: string; initial: SessionInput };
async function api(url: string, method = "GET", body?: unknown) {
  const response = await fetch(url, {
    method,
    cache: "no-store",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      response.status === 401 ? "unauthorized" : data.error || "storage",
    );
  return data;
}
export default function ClientsTab({
  onDirtyChange,
}: {
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const { lang } = useAdminLang();
  const zh = lang === "zh";
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [links, setLinks] = useState<IntakeLink[]>([]);
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [screen, setScreen] = useState<"list" | "detail" | "new">("list");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [newId, setNewId] = useState("");
  const [newProfile, setNewProfile] = useState<ClientProfile>(emptyProfile);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    if (!dirty) return;
    const before = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [dirty]);
  async function load() {
    // Sync is explicit authenticated POST work; GET remains read-only.
    let syncError: unknown;
    try {
      await api("/api/admin/clients", "POST", { action: "syncIntakes" });
    } catch (error) {
      syncError = error;
    }
    const data = await api("/api/admin/clients");
    setClients(data.clients);
    setLinks(data.links);
    if (syncError) throw syncError;
  }
  useEffect(() => {
    load()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  const message: Record<string, string> = {
    invalid: zh
      ? "请检查姓名、日期、邮箱和记录内容；按摩记录至少填写一项内容。"
      : "Check the name, dates, email, and record details. Add at least one session detail.",
    conflict: zh
      ? "这份档案已被修改，或上次保存已经成功。你的输入仍保留在表单中，请复制需要的内容，再取消编辑并重新打开档案核对。"
      : "This record changed, or your previous save succeeded. Your input is preserved. Copy any needed text, then cancel and reopen the client to review.",
    unauthorized: zh
      ? "登录已过期，请在另一个标签页重新登录后重试，当前输入会保留。"
      : "Your login expired. Sign in in another tab, then retry. Your input is preserved.",
    alreadyLinked: zh
      ? "这份 Intake 已关联其他客户，请刷新后核对。"
      : "This intake is already linked to another client. Refresh to review.",
    notFound: zh
      ? "记录不存在，请刷新后重试。"
      : "Record not found. Refresh and retry.",
    storage: zh
      ? "读取或保存失败，请重试。尚未保存的输入仍保留。"
      : "Unable to load or save. Please retry. Unsaved input is preserved.",
  };
  async function run(task: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : "storage");
    } finally {
      setBusy(false);
    }
  }
  function canLeave() {
    if (busy) return false;
    if (
      dirty &&
      !confirm(zh ? "有未保存的内容，确定放弃？" : "Discard unsaved changes?")
    )
      return false;
    setDirty(false);
    setEditor(null);
    setError("");
    setNotice("");
    return true;
  }
  async function openClient(id: string) {
    await run(async () => {
      const data = await api(`/api/admin/clients?id=${encodeURIComponent(id)}`);
      setClient(data.client);
      setLinks((old) => [
        ...old.filter((link) => link.clientId !== id),
        ...data.links,
      ]);
      setScreen("detail");
      setEditor(null);
      setDirty(false);
    });
  }
  function startNew() {
    setNewId(crypto.randomUUID());
    setNewProfile({ ...emptyProfile });
    setScreen("new");
    setDirty(false);
  }
  async function create(profile: ClientProfile) {
    await run(async () => {
      const data = await api("/api/admin/clients", "POST", {
        id: newId,
        profile,
      });
      setClient(data.client);
      setClients((old) => [summarizeClient(data.client), ...old]);
      setDirty(false);
      setScreen("detail");
      setNotice(zh ? "客户档案已建立。" : "Client created.");
    });
  }
  async function save(
    action: "profile" | "session",
    data: ClientProfile | SessionInput,
  ) {
    if (!client || !editor) return;
    await run(async () => {
      const result = await api("/api/admin/clients", "PATCH", {
        id: client.id,
        revision: client.revision,
        action,
        recordId: "id" in editor ? editor.id : undefined,
        data,
      });
      setClient(result.client);
      setClients((old) =>
        old.map((c) =>
          c.id === result.client.id ? summarizeClient(result.client) : c,
        ),
      );
      setEditor(null);
      setDirty(false);
      setNotice(zh ? "已保存。" : "Saved.");
    });
  }
  function begin(value: Editor) {
    if (canLeave()) {
      setEditor(value);
    }
  }
  const dateTime = (value: string) =>
    new Date(value).toLocaleString(zh ? "zh-CN" : "en-US");
  const linked = client ? links.filter((l) => l.clientId === client.id) : [];
  const sortSessions = (items: MassageSession[]) =>
    [...items].sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
    );
  return (
    <div className={styles.page}>
      {screen !== "list" && (
        <button
          type="button"
          disabled={busy}
          className={styles.backLink}
          onClick={() => {
            if (canLeave()) {
              setScreen("list");
              void run(load);
            }
          }}
        >
          {zh ? "← 返回客户列表" : "← Back to client list"}
        </button>
      )}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.title}>{zh ? "客户档案" : "Clients"}</h2>
          <p className={styles.subtitle}>
            {zh
              ? "查看和管理客户的基本信息、登记记录和按摩记录。"
              : "Manage client information, intake forms, and massage records."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={busy}
            className={`${primaryClass} ${styles.refresh}`}
            onClick={() => {
              if (canLeave()) {
                void run(load);
              }
            }}
          >
            <ClientIcon kind="refresh" />
            {zh ? "刷新" : "Refresh"}
          </button>
        </div>
      </div>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-900"
        >
          {message[error] ||
            (error === "popup"
              ? zh
                ? "请允许弹出窗口后重试。"
                : "Allow popups and retry."
              : message.storage)}{" "}
          {screen === "list" && (
            <button
              className={buttonClass}
              disabled={busy}
              onClick={() => void run(load)}
            >
              {zh ? "重试" : "Retry"}
            </button>
          )}
        </div>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-emerald-900"
        >
          {notice}
        </p>
      )}
      {loading ? (
        <p>{zh ? "正在读取客户档案…" : "Loading clients…"}</p>
      ) : (
        <>
          {screen === "list" && (
            <>
              <div className="flex flex-wrap gap-3">
                <label className="flex-1 min-w-48">
                  <span className="sr-only">
                    {zh ? "搜索客户" : "Search clients"}
                  </span>
                  <input
                    className={controlClass}
                    placeholder={
                      zh
                        ? "搜索姓名、电话、邮箱"
                        : "Search name, phone, or email"
                    }
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <button
                  disabled={busy}
                  className={primaryClass}
                  onClick={() => startNew()}
                >
                  {zh ? "＋ 新建客户" : "＋ New client"}
                </button>
              </div>
              <p className="text-sm text-slate-600">
                {zh
                  ? "登记表已直接归入客户档案，打开客户即可查看并添加按摩记录。"
                  : "Intake forms are included in client profiles. Open a client to review the form and add massage records."}
              </p>
              {clients.filter((c) => matchesClient(c, query)).length === 0 && (
                <div className={panelClass}>
                  {zh
                    ? "没有找到客户，可点击「新建客户」建立档案。"
                    : "No clients found. Choose New client to create a profile."}
                </div>
              )}
              {clients
                .filter((c) => matchesClient(c, query))
                .map((c) => (
                  <button
                    disabled={busy}
                    key={c.id}
                    className={`${panelClass} w-full text-left hover:border-slate-700 flex flex-wrap items-center justify-between gap-3`}
                    onClick={() => void openClient(c.id)}
                  >
                    <div>
                      <p className="text-lg font-bold">{c.name}</p>
                      <p className="text-sm text-slate-600">
                        {[c.phone, c.email].filter(Boolean).join(" · ") ||
                          (zh ? "未填写联系方式" : "No contact details")}
                      </p>
                    </div>
                    <div className="text-sm text-slate-600">
                      <p>
                        {zh ? "登记表：" : "Intake: "}
                        {links.filter((link) => link.clientId === c.id)
                          .length || (zh ? "暂无" : "None")}
                      </p>
                      <p>
                        {zh ? "最近按摩：" : "Last visit: "}
                        {c.lastVisit || (zh ? "暂无" : "None")}
                      </p>
                      <p>
                        {c.sessionCount} {zh ? "次按摩" : "visits"}
                        {c.precautions
                          ? ` · ${zh ? "有注意事项" : "Precautions noted"}`
                          : ""}
                      </p>
                    </div>
                  </button>
                ))}
            </>
          )}
          {screen === "new" && (
            <ProfileForm
              key={newId}
              initial={newProfile}
              clients={clients}
              busy={busy}
              onDirty={() => setDirty(true)}
              onSave={create}
              onCancel={() => {
                if (canLeave()) setScreen("list");
              }}
              onUseClient={(id) => {
                if (canLeave()) void openClient(id);
              }}
            />
          )}
          {screen === "detail" && client && (
            <>
              <section
                className={`${styles.card} ${styles.profile}`}
                aria-label={zh ? "客户基本信息" : "Client information"}
              >
                <div className={styles.profileHeader}>
                  <div className={styles.profileText}>
                    <h3 className={styles.clientName}>{client.name}</h3>
                    <div className={styles.contact}>
                      {[client.phone, client.email]
                        .filter(Boolean)
                        .map((value) => (
                          <span key={value}>{value}</span>
                        ))}
                    </div>
                    {client.birthday && (
                      <p className={styles.meta}>
                        {zh ? "出生日期：" : "Date of birth: "}
                        {client.birthday}
                      </p>
                    )}
                    <p className={styles.meta}>
                      {zh ? "档案更新：" : "Updated: "}
                      {dateTime(client.updatedAt)}
                    </p>
                  </div>
                  <button
                    disabled={busy}
                    className={buttonClass}
                    onClick={() => begin({ kind: "profile", initial: client })}
                  >
                    <ClientIcon kind="edit" />
                    {zh ? "编辑档案" : "Edit profile"}
                  </button>
                </div>
                {client.precautions && (
                  <div className={styles.precautions}>
                    <strong>
                      {zh ? "长期注意事项 / 偏好" : "Precautions / preferences"}
                    </strong>
                    <p>{client.precautions}</p>
                  </div>
                )}
                {editor?.kind === "profile" && (
                  <div className={styles.formArea}>
                    <ProfileForm
                      key="profile"
                      initial={editor.initial}
                      currentId={client.id}
                      clients={clients}
                      busy={busy}
                      onDirty={() => setDirty(true)}
                      onSave={(v) => save("profile", v)}
                      onCancel={() => {
                        canLeave();
                      }}
                    />
                  </div>
                )}
              </section>
              <ClientIntakeSection
                key={client.id + linked.map((link) => link.intakeId).join(",")}
                links={linked}
              />
              <section
                className={`${styles.card} ${styles.records}`}
                aria-label={zh ? "按摩记录" : "Massage records"}
              >
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>
                    <ClientIcon kind="records" />
                    {zh ? "按摩记录" : "Massage records"} (
                    {client.sessions.length})
                  </h3>
                  {editor?.kind !== "session" && (
                    <button
                      disabled={busy}
                      className={primaryClass}
                      onClick={() =>
                        begin({
                          kind: "session",
                          id: crypto.randomUUID(),
                          initial: emptySession(),
                        })
                      }
                    >
                      <ClientIcon kind="plus" />
                      {zh ? "按摩记录" : "Massage record"}
                    </button>
                  )}
                </div>
                {editor?.kind === "session" ? (
                  <div className={styles.formArea}>
                    <SessionForm
                      key={editor.id}
                      initial={editor.initial}
                      busy={busy}
                      onDirty={() => setDirty(true)}
                      onSave={(v) => save("session", v)}
                      onCancel={() => {
                        canLeave();
                      }}
                    />
                  </div>
                ) : (
                  <>
                    {!client.sessions.length && (
                      <div className={styles.empty}>
                        <ClientIcon kind="document" />
                        <h4>
                          {zh ? "还没有按摩记录" : "No massage records yet"}
                        </h4>
                        <p>
                          {zh
                            ? "点击右上方「＋ 按摩记录」开始。"
                            : "Choose ＋ Massage record above to get started."}
                        </p>
                      </div>
                    )}
                    {sortSessions(client.sessions).map((s) => (
                      <article key={s.id} className={styles.record}>
                        <div className="flex justify-between gap-3">
                          <h4 className="font-bold">
                            {s.date} · {s.service || (zh ? "按摩" : "Massage")}
                            {s.duration ? ` · ${s.duration} min` : ""}
                          </h4>
                          <button
                            className={buttonClass}
                            disabled={busy}
                            onClick={() =>
                              begin({ kind: "session", id: s.id, initial: s })
                            }
                          >
                            {zh ? "编辑" : "Edit"}
                          </button>
                        </div>
                        {(
                          [
                            ["concerns", "本次情况", "Concerns"],
                            ["treatment", "按摩处理", "Treatment"],
                            ["feedback", "客户反馈", "Feedback"],
                            ["nextVisit", "下次注意事项", "Next visit"],
                            ["notes", "本次备注", "Session notes"],
                          ] as const
                        ).map(
                          ([key, cn, en]) =>
                            s[key] && (
                              <div key={key}>
                                <p className="text-sm font-bold text-slate-500">
                                  {zh ? cn : en}
                                </p>
                                <p className="whitespace-pre-wrap break-words">
                                  {s[key]}
                                </p>
                              </div>
                            ),
                        )}
                        <p className="text-xs text-slate-500">
                          {zh ? "创建：" : "Created: "}
                          {dateTime(s.createdAt)}
                          {s.updatedAt !== s.createdAt &&
                            ` · ${zh ? "更新：" : "Updated: "}${dateTime(s.updatedAt)}`}
                        </p>
                      </article>
                    ))}
                  </>
                )}
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
