"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import RichEditor from "./RichEditor";
import IntakeTab from "./IntakeTab";
import InvoiceTab from "./InvoiceTab";
import { AdminLangProvider, useAdminLang } from "./i18n";

// ── types ────────────────────────────────────────────────────────────────────
interface Pricing { duration: string; price: string }
interface Service { name: string; badge: string; description: string; pricing: Pricing[]; details: string[] }
interface Addon   { name: string; description: string; pricing: Pricing[] }
interface Hour    { day: string; time: string }
interface Post    { slug: string; title: string; date: string; excerpt: string; content: string }

// ── github helpers ────────────────────────────────────────────────────────────
/**
 * A failed content call used to surface as an empty tab: the promise rejected,
 * nothing caught it, and the page looked like a studio with no services. These
 * report which side said no, so the screen can say so too.
 */
function contentFailure(status: number): Error {
  return new Error(status === 401 ? "session-expired" : "load-failed");
}

async function ghGet(path: string) {
  const r = await fetch(`/api/admin/content?path=${encodeURIComponent(path)}`);
  if (!r.ok) throw contentFailure(r.status);
  return r.json();
}
async function ghSave(path: string, content: string) {
  const r = await fetch("/api/admin/content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, content }),
  });
  if (!r.ok) throw contentFailure(r.status);
}
async function ghDelete(path: string) {
  const r = await fetch("/api/admin/content", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });
  if (!r.ok) throw contentFailure(r.status);
}

// ── small UI helpers ─────────────────────────────────────────────────────────
function Btn({ onClick, children, variant = "primary", disabled, small }: {
  onClick?: () => void; children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger"; disabled?: boolean; small?: boolean
}) {
  const base = small ? "admin-button px-4 py-2 text-sm rounded-lg font-semibold" : "admin-button px-6 py-3 rounded-lg font-bold";
  const cls = {
    primary: "bg-slate-900 text-white hover:bg-slate-700",
    secondary: "border-2 border-slate-600 text-slate-900 bg-white hover:bg-slate-100",
    danger: "bg-red-50 text-red-800 border-2 border-red-300 hover:bg-red-100",
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${base} ${cls} transition-colors disabled:opacity-40`}>
      {children}
    </button>
  );
}

function SaveBar({ onSave, saving, saved }: { onSave: () => void; saving: boolean; saved: boolean }) {
  const { t } = useAdminLang();
  return (
    <div className="flex items-center gap-3">
      <Btn onClick={onSave} disabled={saving}>
        {saving ? t("common.saving") : t("common.save")}
      </Btn>
      {saved && <span className="text-sage text-sm">{t("common.savedNotice")}</span>}
    </div>
  );
}

/** Says which failure happened, in the language the admin is set to. */
function LoadError({ code }: { code: string }) {
  const { t } = useAdminLang();
  if (!code) return null;
  return (
    <div role="alert" className="mb-5 rounded-lg border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      {t(code === "session-expired" ? "error.sessionExpired" : code === "save-failed" ? "error.saveFailed" : "error.loadFailed")}
    </div>
  );
}

function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="text-bark-light/50 group-hover:text-bark-light transition-colors">
      <rect x="2" y="1" width="10" height="2" rx="1" />
      <rect x="2" y="6" width="10" height="2" rx="1" />
      <rect x="2" y="11" width="10" height="2" rx="1" />
    </svg>
  );
}

// ── SETTINGS TAB ─────────────────────────────────────────────────────────────
function SettingsTab() {
  const { t } = useAdminLang();
  const [announcement, setAnnouncement] = useState("");
  const [hours, setHours] = useState<Hour[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    ghGet("siteConfig.json").then(({ content }: { content: string }) => {
      const d = JSON.parse(content);
      setAnnouncement(d.announcement ?? "");
      setHours(d.hours ?? []);
    }).catch((e: Error) => setError(e.message));
  }, []);

  async function save() {
    setSaving(true); setSaved(false); setError("");
    const content = JSON.stringify({ announcement, hours }, null, 2);
    try {
      await ghSave("siteConfig.json", content);
      setSaved(true);
      setTimeout(() => setSaved(false), 5000);
    } catch (e) {
      setError((e as Error).message === "github-auth" ? "github-auth" : "save-failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <LoadError code={error} />
      <div>
        <label className="block text-sm font-medium text-bark mb-2">{t("settings.announcement")}</label>
        <textarea value={announcement} onChange={e => setAnnouncement(e.target.value)} rows={3}
          placeholder={t("settings.announcementPlaceholder")}
          className="w-full border border-brand-light rounded-lg px-4 py-2.5 text-bark focus:outline-none focus:ring-2 focus:ring-brand resize-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-bark mb-3">{t("settings.hours")}</label>
        <div className="space-y-2">
          {hours.map((h, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-28 text-sm text-bark font-medium">{h.day}</span>
              <input value={h.time} onChange={e => {
                const next = [...hours]; next[i] = { ...h, time: e.target.value }; setHours(next);
              }} placeholder={t("settings.hoursPlaceholder")}
                className="flex-1 border border-brand-light rounded-lg px-3 py-1.5 text-sm text-bark focus:outline-none focus:ring-2 focus:ring-brand" />
            </div>
          ))}
        </div>
      </div>
      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  );
}

// ── SERVICES TAB ─────────────────────────────────────────────────────────────
function ServicesTab() {
  const { t } = useAdminLang();
  const [services, setServices] = useState<Service[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const canDrag = useRef(false);

  const [error, setError] = useState("");

  useEffect(() => {
    ghGet("services.json").then(({ content }: { content: string }) => {
      setServices(JSON.parse(content).items ?? []);
    }).catch((e: Error) => setError(e.message));
  }, []);

  async function save() {
    setSaving(true); setSaved(false); setError("");
    try {
      await ghSave("services.json", JSON.stringify({ items: services }, null, 2));
      setSaved(true);
      setTimeout(() => setSaved(false), 5000);
    } catch (e) {
      setError((e as Error).message === "github-auth" ? "github-auth" : "save-failed");
    } finally {
      setSaving(false);
    }
  }

  function update(i: number, patch: Partial<Service>) {
    setServices(s => s.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  }

  function handleDrop(toIdx: number) {
    if (dragIdx === null || dragIdx === toIdx) { setDragIdx(null); setDragOver(null); return; }
    setServices(s => {
      const next = [...s];
      const [item] = next.splice(dragIdx, 1);
      next.splice(toIdx, 0, item);
      return next;
    });
    setOpen(o => {
      if (o === null) return null;
      if (o === dragIdx) return toIdx;
      if (dragIdx < toIdx && o > dragIdx && o <= toIdx) return o - 1;
      if (dragIdx > toIdx && o < dragIdx && o >= toIdx) return o + 1;
      return o;
    });
    setDragIdx(null); setDragOver(null);
  }

  function addService() {
    setServices(s => [...s, { name: "New Service", badge: "", description: "", pricing: [{ duration: "", price: "" }], details: [] }]);
    setOpen(services.length);
  }
  function removeService(i: number) {
    if (!confirm(t("services.confirmRemove"))) return;
    setServices(s => s.filter((_, idx) => idx !== i));
    setOpen(null);
  }

  return (
    <div className="space-y-2">
      <LoadError code={error} />
      {services.map((svc, i) => (
        <div key={i}
          draggable
          onDragStart={e => { if (!canDrag.current) { e.preventDefault(); return; } setDragIdx(i); e.dataTransfer.effectAllowed = "move"; }}
          onDragOver={e => { e.preventDefault(); setDragOver(i); }}
          onDrop={() => handleDrop(i)}
          onDragEnd={() => { canDrag.current = false; setDragIdx(null); setDragOver(null); }}
          className={`border rounded-xl overflow-hidden transition-opacity ${dragIdx === i ? "opacity-40" : "opacity-100"} ${dragOver === i && dragIdx !== i ? "border-brand border-2" : "border-brand-light"}`}>
          <div className="w-full flex items-center bg-white hover:bg-brand-light/60">
            <span
              className="group pl-3 pr-2 py-3.5 cursor-grab active:cursor-grabbing touch-none select-none"
              onMouseDown={() => { canDrag.current = true; }}
              onMouseUp={() => { canDrag.current = false; }}
            >
              <GripIcon />
            </span>
            <button onClick={() => setOpen(open === i ? null : i)}
              className="flex-1 flex items-center px-2 py-3 text-left">
              <span className="font-medium text-bark">{svc.name || t("common.untitled")}</span>
            </button>
            <span className="text-bark-light text-sm pr-4">{open === i ? "▲" : "▼"}</span>
          </div>
          {open === i && (
            <div className="p-5 bg-white border-t border-brand-light space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label={t("services.name")} value={svc.name} onChange={v => update(i, { name: v })} />
                <Field label={t("services.badge")} value={svc.badge} onChange={v => update(i, { badge: v })} placeholder={t("services.badgePlaceholder")} />
              </div>
              <TextArea label={t("common.description")} value={svc.description} onChange={v => update(i, { description: v })} />
              <div>
                <label className="block text-sm font-medium text-bark mb-2">{t("common.pricing")}</label>
                {svc.pricing.map((p, pi) => (
                  <div key={pi} className="flex gap-2 mb-2">
                    <input value={p.duration} onChange={e => {
                      const next = [...svc.pricing]; next[pi] = { ...p, duration: e.target.value }; update(i, { pricing: next });
                    }} placeholder={t("services.durationPlaceholder")} className={inputCls} />
                    <input value={p.price} onChange={e => {
                      const next = [...svc.pricing]; next[pi] = { ...p, price: e.target.value }; update(i, { pricing: next });
                    }} placeholder={t("services.pricePlaceholder")} className={inputCls} />
                    <Btn small variant="danger" onClick={() => update(i, { pricing: svc.pricing.filter((_, x) => x !== pi) })}>✕</Btn>
                  </div>
                ))}
                <Btn small variant="secondary" onClick={() => update(i, { pricing: [...svc.pricing, { duration: "", price: "" }] })}>{t("common.addPrice")}</Btn>
              </div>
              <div>
                <label className="block text-sm font-medium text-bark mb-2">{t("services.extraDetails")}</label>
                {svc.details.map((d, di) => (
                  <div key={di} className="flex gap-2 mb-2">
                    <input value={d} onChange={e => {
                      const next = [...svc.details]; next[di] = e.target.value; update(i, { details: next });
                    }} className={inputCls} />
                    <Btn small variant="danger" onClick={() => update(i, { details: svc.details.filter((_, x) => x !== di) })}>✕</Btn>
                  </div>
                ))}
                <Btn small variant="secondary" onClick={() => update(i, { details: [...svc.details, ""] })}>{t("services.addDetail")}</Btn>
              </div>
              <Btn variant="danger" small onClick={() => removeService(i)}>{t("services.remove")}</Btn>
            </div>
          )}
        </div>
      ))}
      <div className="flex flex-wrap gap-3 pt-2">
        <Btn variant="secondary" onClick={addService}>{t("services.add")}</Btn>
        <SaveBar onSave={save} saving={saving} saved={saved} />
      </div>
    </div>
  );
}

// ── ADDONS TAB ───────────────────────────────────────────────────────────────
function AddonsTab() {
  const { t } = useAdminLang();
  const [addons, setAddons] = useState<Addon[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const canDrag = useRef(false);

  const [error, setError] = useState("");

  useEffect(() => {
    ghGet("addons.json").then(({ content }: { content: string }) => {
      setAddons(JSON.parse(content).items ?? []);
    }).catch((e: Error) => setError(e.message));
  }, []);

  async function save() {
    setSaving(true); setSaved(false); setError("");
    try {
      await ghSave("addons.json", JSON.stringify({ items: addons }, null, 2));
      setSaved(true);
      setTimeout(() => setSaved(false), 5000);
    } catch (e) {
      setError((e as Error).message === "github-auth" ? "github-auth" : "save-failed");
    } finally {
      setSaving(false);
    }
  }

  function update(i: number, patch: Partial<Addon>) {
    setAddons(a => a.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  }

  function handleDrop(toIdx: number) {
    if (dragIdx === null || dragIdx === toIdx) { setDragIdx(null); setDragOver(null); return; }
    setAddons(a => {
      const next = [...a];
      const [item] = next.splice(dragIdx, 1);
      next.splice(toIdx, 0, item);
      return next;
    });
    setOpen(o => {
      if (o === null) return null;
      if (o === dragIdx) return toIdx;
      if (dragIdx < toIdx && o > dragIdx && o <= toIdx) return o - 1;
      if (dragIdx > toIdx && o < dragIdx && o >= toIdx) return o + 1;
      return o;
    });
    setDragIdx(null); setDragOver(null);
  }

  function removeAddon(i: number) {
    if (!confirm(t("addons.confirmRemove"))) return;
    setAddons(a => a.filter((_, idx) => idx !== i));
    setOpen(null);
  }

  return (
    <div className="space-y-2">
      <LoadError code={error} />
      {addons.map((addon, i) => (
        <div key={i}
          draggable
          onDragStart={e => { if (!canDrag.current) { e.preventDefault(); return; } setDragIdx(i); e.dataTransfer.effectAllowed = "move"; }}
          onDragOver={e => { e.preventDefault(); setDragOver(i); }}
          onDrop={() => handleDrop(i)}
          onDragEnd={() => { canDrag.current = false; setDragIdx(null); setDragOver(null); }}
          className={`border rounded-xl overflow-hidden transition-opacity ${dragIdx === i ? "opacity-40" : "opacity-100"} ${dragOver === i && dragIdx !== i ? "border-brand border-2" : "border-brand-light"}`}>
          <div className="w-full flex items-center bg-white hover:bg-brand-light/60">
            <span
              className="group pl-3 pr-2 py-3.5 cursor-grab active:cursor-grabbing touch-none select-none"
              onMouseDown={() => { canDrag.current = true; }}
              onMouseUp={() => { canDrag.current = false; }}
            >
              <GripIcon />
            </span>
            <button onClick={() => setOpen(open === i ? null : i)}
              className="flex-1 flex items-center px-2 py-3 text-left">
              <span className="font-medium text-bark">{addon.name || t("common.untitled")}</span>
            </button>
            <span className="text-bark-light text-sm pr-4">{open === i ? "▲" : "▼"}</span>
          </div>
          {open === i && (
            <div className="p-5 bg-white border-t border-brand-light space-y-4">
              <Field label={t("addons.name")} value={addon.name} onChange={v => update(i, { name: v })} />
              <TextArea label={t("common.description")} value={addon.description} onChange={v => update(i, { description: v })} />
              <div>
                <label className="block text-sm font-medium text-bark mb-2">{t("common.pricing")}</label>
                {addon.pricing.map((p, pi) => (
                  <div key={pi} className="flex gap-2 mb-2">
                    <input value={p.duration} onChange={e => {
                      const next = [...addon.pricing]; next[pi] = { ...p, duration: e.target.value }; update(i, { pricing: next });
                    }} placeholder={t("addons.durationPlaceholder")} className={inputCls} />
                    <input value={p.price} onChange={e => {
                      const next = [...addon.pricing]; next[pi] = { ...p, price: e.target.value }; update(i, { pricing: next });
                    }} placeholder={t("addons.pricePlaceholder")} className={inputCls} />
                    <Btn small variant="danger" onClick={() => update(i, { pricing: addon.pricing.filter((_, x) => x !== pi) })}>✕</Btn>
                  </div>
                ))}
                <Btn small variant="secondary" onClick={() => update(i, { pricing: [...addon.pricing, { duration: "", price: "" }] })}>{t("common.addPrice")}</Btn>
              </div>
              <Btn variant="danger" small onClick={() => removeAddon(i)}>{t("addons.remove")}</Btn>
            </div>
          )}
        </div>
      ))}
      <div className="flex flex-wrap gap-3 pt-2">
        <Btn variant="secondary" onClick={() => {
          setAddons(a => [...a, { name: "New Add-on", description: "", pricing: [{ duration: "", price: "" }] }]);
          setOpen(addons.length);
        }}>{t("addons.add")}</Btn>
        <SaveBar onSave={save} saving={saving} saved={saved} />
      </div>
    </div>
  );
}

// ── BLOG TAB ─────────────────────────────────────────────────────────────────
function BlogTab() {
  const { t } = useAdminLang();
  const [posts, setPosts] = useState<{ slug: string }[]>([]);
  const [editing, setEditing] = useState<Post | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [error, setError] = useState("");

  const loadList = useCallback(async () => {
    const res = await ghGet("content/blog").catch((e: Error) => { setError(e.message); return null; });
    if (!res?.files) return;
    setPosts(res.files.map((f: { name: string }) => ({ slug: f.name.replace(/\.md$/, "") })));
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  async function openPost(slug: string) {
    const { content } = await ghGet(`blog/${slug}.md`);
    const [, fm, body = ""] = content.split(/^---\s*$/m);
    const get = (key: string) => (fm.match(new RegExp(`^${key}:\\s*(.+)$`, "m")) ?? [])[1]?.replace(/^["']|["']$/g, "").trim() ?? "";
    setEditing({ slug, title: get("title"), date: get("date"), excerpt: get("excerpt"), content: body.trim() });
    setIsNew(false);
    setEditorKey(k => k + 1);
  }

  function newPost() {
    const today = new Date().toISOString().slice(0, 10);
    setEditing({ slug: "", title: "", date: today, excerpt: "", content: "" });
    setIsNew(true);
    setEditorKey(k => k + 1);
  }

  async function savePost() {
    if (!editing) return;
    setSaving(true); setSaved(false); setError("");
    const slug = isNew
      ? editing.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `post-${Date.now()}`
      : editing.slug;
    const fm = `---\ntitle: "${editing.title}"\ndate: ${editing.date}\nexcerpt: "${editing.excerpt}"\n---\n\n`;
    try {
        await ghSave(`blog/${slug}.md`, fm + editing.content);
      setSaved(true);
      setTimeout(() => setSaved(false), 5000);
      if (isNew) { setIsNew(false); setEditing(p => p ? { ...p, slug } : p); await loadList(); }
    } catch (e) {
      setError((e as Error).message === "github-auth" ? "github-auth" : "save-failed");
    } finally {
      setSaving(false);
    }
  }

  async function deletePost(slug: string) {
    if (!confirm(`${t("blog.confirmDelete")} "${slug}"?`)) return;
    await ghDelete(`blog/${slug}.md`).catch((e: Error) => setError(e.message));
    if (editing?.slug === slug) setEditing(null);
    await loadList();
  }

  if (editing) {
    return (
      <div className="space-y-4">
        <LoadError code={error} />
        <button onClick={() => setEditing(null)} className="text-brand text-sm hover:underline">{t("blog.back")}</button>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t("blog.title")} value={editing.title} onChange={v => setEditing(p => p ? { ...p, title: v } : p)} />
          <Field label={t("blog.date")} value={editing.date} onChange={v => setEditing(p => p ? { ...p, date: v } : p)} placeholder="YYYY-MM-DD" />
        </div>
        <TextArea label={t("blog.excerpt")} value={editing.excerpt} onChange={v => setEditing(p => p ? { ...p, excerpt: v } : p)} rows={2} />
        <div>
          <label className="block text-sm font-medium text-bark mb-1">{t("blog.content")}</label>
          <RichEditor
            key={editorKey}
            initialContent={editing.content}
            onChange={v => setEditing(p => p ? { ...p, content: v } : p)}
          />
        </div>
        <SaveBar onSave={savePost} saving={saving} saved={saved} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <LoadError code={error} />
      <Btn onClick={newPost}>{t("blog.new")}</Btn>
      {posts.length === 0 && <p className="text-bark-light text-sm">{t("blog.empty")}</p>}
      {posts.map(p => (
        <div key={p.slug} className="flex items-center justify-between bg-white border border-brand-light rounded-xl px-5 py-3">
          <span className="text-bark font-medium">{p.slug}</span>
          <div className="flex gap-2">
            <Btn small variant="secondary" onClick={() => openPost(p.slug)}>{t("common.edit")}</Btn>
            <Btn small variant="danger" onClick={() => deletePost(p.slug)}>{t("common.delete")}</Btn>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── shared field components ───────────────────────────────────────────────────
const inputCls = "admin-control flex-1 border-2 border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-950 bg-white focus:outline-none focus:ring-4 focus:ring-sky-200 focus:border-slate-800";

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-bold text-bark mb-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="admin-control w-full border-2 border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-950 bg-white focus:outline-none focus:ring-4 focus:ring-sky-200 focus:border-slate-800" />
    </div>
  );
}
function TextArea({ label, value, onChange, rows = 4, mono, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; mono?: boolean; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-bark mb-1">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        className={`admin-control w-full border-2 border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-950 bg-white focus:outline-none focus:ring-4 focus:ring-sky-200 focus:border-slate-800 resize-y ${mono ? "font-mono" : ""}`} />
    </div>
  );
}

// ── ROOT PAGE ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: "settings", label: "nav.settings" },
  { key: "services", label: "nav.services" },
  { key: "addons", label: "nav.addons" },
  { key: "blog", label: "nav.blog" },
  { key: "intake", label: "nav.intake" },
  { key: "invoice", label: "nav.invoice" },
] as const;
type Tab = typeof TABS[number]["key"];
type FontSize = "small" | "medium" | "large";
const FONT_SIZE_OPTIONS = [
  { value: "small", label: "shell.font.small" },
  { value: "medium", label: "shell.font.medium" },
  { value: "large", label: "shell.font.large" },
] as const;

export default function AdminPage() {
  return (
    <AdminLangProvider>
      <AdminShell />
    </AdminLangProvider>
  );
}

function AdminShell() {
  const { t, lang, setLang } = useAdminLang();
  const [tab, setTab] = useState<Tab>("settings");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [fontSize, setFontSize] = useState<FontSize>("medium");
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className={`admin-readable min-h-screen flex admin-font-${fontSize}`}>
      <style>{`
        .admin-readable {
          background: #f7f9fb;
          color: #1f2933;
        }
        .admin-readable label,
        .admin-readable .text-bark {
          color: #1f2933;
        }
        .admin-readable .text-bark-light,
        .admin-readable .text-bark-light\\/80,
        .admin-readable .text-bark-light\\/50 {
          color: #3e4c59;
        }
        .admin-readable .text-brand,
        .admin-readable .text-brand-dark {
          color: #243b53;
        }
        .admin-readable .border-brand-light {
          border-color: #b6c2cf;
        }
        .admin-readable .bg-brand-light,
        .admin-readable .hover\\:bg-brand-light:hover,
        .admin-readable .hover\\:bg-brand-light\\/60:hover,
        .admin-readable .hover\\:bg-brand-light\\/70:hover {
          background-color: #e9eef5;
        }
        .admin-readable .focus\\:ring-brand:focus {
          --tw-ring-color: #93c5fd;
        }
        .admin-button {
          min-height: 3rem;
          letter-spacing: 0;
        }
        .admin-control {
          min-height: 3.25rem;
          box-shadow: inset 0 1px 0 rgba(31, 41, 51, 0.04);
        }
        .admin-control::placeholder {
          color: #52606d;
          opacity: 1;
        }
        .admin-font-small { font-size: 14px; }
        .admin-font-medium { font-size: 18px; }
        .admin-font-large { font-size: 21px; }
        .admin-font-small .text-xs { font-size: 0.875rem; line-height: 1.35rem; }
        .admin-font-medium .text-xs { font-size: 1rem; line-height: 1.5rem; }
        .admin-font-large .text-xs { font-size: 1.125rem; line-height: 1.7rem; }
        .admin-font-small .text-sm { font-size: 1rem; line-height: 1.55rem; }
        .admin-font-medium .text-sm { font-size: 1.125rem; line-height: 1.75rem; }
        .admin-font-large .text-sm { font-size: 1.3125rem; line-height: 2rem; }
        .admin-font-small .text-xl { font-size: 1.35rem; line-height: 1.95rem; }
        .admin-font-medium .text-xl { font-size: 1.55rem; line-height: 2.15rem; }
        .admin-font-large .text-xl { font-size: 1.85rem; line-height: 2.45rem; }
      `}</style>
      <aside className={`${sidebarOpen ? "w-80" : "w-24"} min-h-screen shrink-0 border-r-2 border-slate-300 bg-white transition-[width] duration-300 ease-in-out flex flex-col`}>
        <div className="min-h-24 px-4 border-b-2 border-slate-300 flex items-center gap-3">
          <button
            type="button"
            aria-label="Toggle admin sidebar"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(open => !open)}
            className="admin-button h-14 w-14 shrink-0 rounded-lg border-2 border-slate-400 text-slate-950 bg-white hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-sky-200 transition-colors text-xl font-bold"
          >
            {sidebarOpen ? "<" : ">"}
          </button>
          {sidebarOpen && (
            <div className="min-w-0">
              <h1 className="font-bold text-slate-950 leading-tight truncate">Jane&apos;s Therapy</h1>
              <p className="text-sm text-slate-700 mt-1">{t("shell.admin")}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-5 space-y-2">
          {TABS.map(item => {
            const label = t(item.label);
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                title={sidebarOpen ? undefined : label}
                className={`w-full min-h-14 rounded-lg px-4 text-sm font-bold transition-colors flex items-center border-2 ${sidebarOpen ? "justify-start text-left" : "justify-center"} ${tab === item.key ? "bg-slate-900 border-slate-900 text-white shadow-sm" : "bg-white border-transparent text-slate-800 hover:text-slate-950 hover:bg-slate-100 hover:border-slate-300"}`}
              >
                {sidebarOpen ? label : label.slice(0, 1)}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-5 border-t-2 border-slate-300">
          {sidebarOpen && <p className="text-sm font-bold text-slate-800 mb-3">{t("shell.language")}</p>}
          <div className={`grid gap-2 ${sidebarOpen ? "grid-cols-2" : "grid-cols-1"}`}>
            {([
              { value: "zh", label: "中文" },
              { value: "en", label: "English" },
            ] as const).map(option => (
              <button
                key={option.value}
                type="button"
                aria-pressed={lang === option.value}
                title={option.label}
                onClick={() => setLang(option.value)}
                className={`admin-button min-h-14 rounded-lg border-2 px-2 text-sm font-bold transition-colors focus:outline-none focus:ring-4 focus:ring-sky-200 ${
                  lang === option.value
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-400 bg-white text-slate-900 hover:bg-slate-100"
                }`}
              >
                {sidebarOpen ? option.label : option.value === "zh" ? "中" : "EN"}
              </button>
            ))}
          </div>
        </div>

        <div className="px-3 py-5 border-t-2 border-slate-300">
          {sidebarOpen && <p className="text-sm font-bold text-slate-800 mb-3">{t("shell.fontSize")}</p>}
          <div className={`grid gap-2 ${sidebarOpen ? "grid-cols-3" : "grid-cols-1"}`}>
            {FONT_SIZE_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                aria-pressed={fontSize === option.value}
                title={`${t("shell.fontSize")} ${t(option.label)}`}
                onClick={() => setFontSize(option.value)}
                className={`admin-button min-h-14 rounded-lg border-2 px-2 text-sm font-bold transition-colors focus:outline-none focus:ring-4 focus:ring-sky-200 ${
                  fontSize === option.value
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-400 bg-white text-slate-900 hover:bg-slate-100"
                }`}
              >
                {t(option.label)}
              </button>
            ))}
          </div>
        </div>

        <div className="px-3 py-5 border-t-2 border-slate-300">
          <button
            type="button"
            onClick={logout}
            title={sidebarOpen ? undefined : t("shell.logout")}
            className={`admin-button w-full min-h-14 rounded-lg px-4 text-sm font-bold text-slate-800 bg-white border-2 border-slate-300 hover:text-slate-950 hover:bg-slate-100 transition-colors flex items-center ${sidebarOpen ? "justify-start" : "justify-center"}`}
          >
            {sidebarOpen ? t("shell.logout") : "X"}
          </button>
        </div>
      </aside>

      {/* No page title and no panel around the tab: the highlighted item in the
          sidebar already says where you are, and every tab draws its own cards. */}
      <main className="flex-1 min-w-0 px-5 py-6 lg:px-10 lg:py-10 transition-[padding] duration-300">
        {tab === "settings" && <SettingsTab />}
        {tab === "services" && <ServicesTab />}
        {tab === "addons" && <AddonsTab />}
        {tab === "blog" && <BlogTab />}
        {tab === "intake" && <IntakeTab />}
        {tab === "invoice" && <InvoiceTab />}
      </main>
    </div>
  );
}
