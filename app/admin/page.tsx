"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import RichEditor from "./RichEditor";
import IntakeTab from "./IntakeTab";
import InvoiceTab from "./InvoiceTab";

// ── types ────────────────────────────────────────────────────────────────────
interface Pricing { duration: string; price: string }
interface Service { name: string; badge: string; description: string; pricing: Pricing[]; details: string[] }
interface Addon   { name: string; description: string; pricing: Pricing[] }
interface Hour    { day: string; time: string }
interface Post    { slug: string; title: string; date: string; excerpt: string; content: string }

// ── github helpers ────────────────────────────────────────────────────────────
async function ghGet(path: string) {
  const r = await fetch(`/api/admin/github?path=${encodeURIComponent(path)}`);
  if (!r.ok) throw new Error(`Failed to load ${path}`);
  return r.json();
}
async function ghSave(path: string, content: string, sha?: string) {
  const r = await fetch("/api/admin/github", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, content, sha }),
  });
  if (!r.ok) throw new Error(await r.text());
}
async function ghDelete(path: string, sha: string) {
  const r = await fetch("/api/admin/github", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, sha }),
  });
  if (!r.ok) throw new Error("Delete failed");
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
  return (
    <div className="flex items-center gap-3">
      <Btn onClick={onSave} disabled={saving}>
        {saving ? "保存中… Saving…" : "保存并发布 Save & Publish"}
      </Btn>
      {saved && <span className="text-sage text-sm">✓ 已保存！网站将在约2分钟后更新。</span>}
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
  const [announcement, setAnnouncement] = useState("");
  const [hours, setHours] = useState<Hour[]>([]);
  const [sha, setSha] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    ghGet("content/siteConfig.json").then(({ content, sha }) => {
      const d = JSON.parse(content);
      setAnnouncement(d.announcement ?? "");
      setHours(d.hours ?? []);
      setSha(sha);
    });
  }, []);

  async function save() {
    setSaving(true); setSaved(false);
    const content = JSON.stringify({ announcement, hours }, null, 2);
    await ghSave("content/siteConfig.json", content, sha);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 5000);
  }

  return (
    <div className="space-y-8">
      <div>
        <label className="block text-sm font-medium text-bark mb-2">公告横幅 <span className="font-normal text-bark-light">Announcement Banner</span></label>
        <textarea value={announcement} onChange={e => setAnnouncement(e.target.value)} rows={3}
          placeholder="留空则隐藏公告 / Leave blank to hide the banner"
          className="w-full border border-brand-light rounded-lg px-4 py-2.5 text-bark focus:outline-none focus:ring-2 focus:ring-brand resize-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-bark mb-3">营业时间 <span className="font-normal text-bark-light">Business Hours</span></label>
        <div className="space-y-2">
          {hours.map((h, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-28 text-sm text-bark font-medium">{h.day}</span>
              <input value={h.time} onChange={e => {
                const next = [...hours]; next[i] = { ...h, time: e.target.value }; setHours(next);
              }} placeholder='如：9:30 AM – 8:00 PM 或 "Closed"'
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
  const [services, setServices] = useState<Service[]>([]);
  const [sha, setSha] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const canDrag = useRef(false);

  useEffect(() => {
    ghGet("content/services.json").then(({ content, sha }) => {
      setServices(JSON.parse(content).items ?? []);
      setSha(sha);
    });
  }, []);

  async function save() {
    setSaving(true); setSaved(false);
    await ghSave("content/services.json", JSON.stringify({ items: services }, null, 2), sha);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 5000);
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
    if (!confirm("确认删除此服务？Remove this service?")) return;
    setServices(s => s.filter((_, idx) => idx !== i));
    setOpen(null);
  }

  return (
    <div className="space-y-2">
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
              <span className="font-medium text-bark">{svc.name || "未命名 Untitled"}</span>
            </button>
            <span className="text-bark-light text-sm pr-4">{open === i ? "▲" : "▼"}</span>
          </div>
          {open === i && (
            <div className="p-5 bg-white border-t border-brand-light space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="服务名称 Service Name" value={svc.name} onChange={v => update(i, { name: v })} />
                <Field label="标签（可选）Badge" value={svc.badge} onChange={v => update(i, { badge: v })} placeholder="如：Signature 👍" />
              </div>
              <TextArea label="描述 Description" value={svc.description} onChange={v => update(i, { description: v })} />
              <div>
                <label className="block text-sm font-medium text-bark mb-2">价格 <span className="font-normal text-bark-light">Pricing</span></label>
                {svc.pricing.map((p, pi) => (
                  <div key={pi} className="flex gap-2 mb-2">
                    <input value={p.duration} onChange={e => {
                      const next = [...svc.pricing]; next[pi] = { ...p, duration: e.target.value }; update(i, { pricing: next });
                    }} placeholder="时长 / 60 minutes" className={inputCls} />
                    <input value={p.price} onChange={e => {
                      const next = [...svc.pricing]; next[pi] = { ...p, price: e.target.value }; update(i, { pricing: next });
                    }} placeholder="价格 / $120" className={inputCls} />
                    <Btn small variant="danger" onClick={() => update(i, { pricing: svc.pricing.filter((_, x) => x !== pi) })}>✕</Btn>
                  </div>
                ))}
                <Btn small variant="secondary" onClick={() => update(i, { pricing: [...svc.pricing, { duration: "", price: "" }] })}>+ 添加价格 Add Price</Btn>
              </div>
              <div>
                <label className="block text-sm font-medium text-bark mb-2">附加说明（可选）<span className="font-normal text-bark-light">Extra Details</span></label>
                {svc.details.map((d, di) => (
                  <div key={di} className="flex gap-2 mb-2">
                    <input value={d} onChange={e => {
                      const next = [...svc.details]; next[di] = e.target.value; update(i, { details: next });
                    }} className={inputCls} />
                    <Btn small variant="danger" onClick={() => update(i, { details: svc.details.filter((_, x) => x !== di) })}>✕</Btn>
                  </div>
                ))}
                <Btn small variant="secondary" onClick={() => update(i, { details: [...svc.details, ""] })}>+ 添加说明 Add Detail</Btn>
              </div>
              <Btn variant="danger" small onClick={() => removeService(i)}>删除服务 Remove Service</Btn>
            </div>
          )}
        </div>
      ))}
      <div className="flex flex-wrap gap-3 pt-2">
        <Btn variant="secondary" onClick={addService}>+ 添加服务 Add Service</Btn>
        <SaveBar onSave={save} saving={saving} saved={saved} />
      </div>
    </div>
  );
}

// ── ADDONS TAB ───────────────────────────────────────────────────────────────
function AddonsTab() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [sha, setSha] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const canDrag = useRef(false);

  useEffect(() => {
    ghGet("content/addons.json").then(({ content, sha }) => {
      setAddons(JSON.parse(content).items ?? []);
      setSha(sha);
    });
  }, []);

  async function save() {
    setSaving(true); setSaved(false);
    await ghSave("content/addons.json", JSON.stringify({ items: addons }, null, 2), sha);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 5000);
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
    if (!confirm("确认删除此附加服务？Remove this add-on?")) return;
    setAddons(a => a.filter((_, idx) => idx !== i));
    setOpen(null);
  }

  return (
    <div className="space-y-2">
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
              <span className="font-medium text-bark">{addon.name || "未命名 Untitled"}</span>
            </button>
            <span className="text-bark-light text-sm pr-4">{open === i ? "▲" : "▼"}</span>
          </div>
          {open === i && (
            <div className="p-5 bg-white border-t border-brand-light space-y-4">
              <Field label="附加服务名称 Add-on Name" value={addon.name} onChange={v => update(i, { name: v })} />
              <TextArea label="描述 Description" value={addon.description} onChange={v => update(i, { description: v })} />
              <div>
                <label className="block text-sm font-medium text-bark mb-2">价格 <span className="font-normal text-bark-light">Pricing</span></label>
                {addon.pricing.map((p, pi) => (
                  <div key={pi} className="flex gap-2 mb-2">
                    <input value={p.duration} onChange={e => {
                      const next = [...addon.pricing]; next[pi] = { ...p, duration: e.target.value }; update(i, { pricing: next });
                    }} placeholder="时长（无则留空）/ Duration" className={inputCls} />
                    <input value={p.price} onChange={e => {
                      const next = [...addon.pricing]; next[pi] = { ...p, price: e.target.value }; update(i, { pricing: next });
                    }} placeholder="价格 / $30" className={inputCls} />
                    <Btn small variant="danger" onClick={() => update(i, { pricing: addon.pricing.filter((_, x) => x !== pi) })}>✕</Btn>
                  </div>
                ))}
                <Btn small variant="secondary" onClick={() => update(i, { pricing: [...addon.pricing, { duration: "", price: "" }] })}>+ 添加价格 Add Price</Btn>
              </div>
              <Btn variant="danger" small onClick={() => removeAddon(i)}>删除附加服务 Remove Add-on</Btn>
            </div>
          )}
        </div>
      ))}
      <div className="flex flex-wrap gap-3 pt-2">
        <Btn variant="secondary" onClick={() => {
          setAddons(a => [...a, { name: "New Add-on", description: "", pricing: [{ duration: "", price: "" }] }]);
          setOpen(addons.length);
        }}>+ 添加附加服务 Add Add-on</Btn>
        <SaveBar onSave={save} saving={saving} saved={saved} />
      </div>
    </div>
  );
}

// ── BLOG TAB ─────────────────────────────────────────────────────────────────
function BlogTab() {
  const [posts, setPosts] = useState<{ name: string; slug: string; sha: string }[]>([]);
  const [editing, setEditing] = useState<Post | null>(null);
  const [editSha, setEditSha] = useState<string | undefined>();
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  const loadList = useCallback(async () => {
    const res = await ghGet("content/blog");
    if (!res.files) return;
    setPosts(res.files.filter((f: { name: string }) => f.name.endsWith(".md")).map((f: { name: string; sha: string }) => ({
      name: f.name,
      slug: f.name.replace(/\.md$/, ""),
      sha: f.sha,
    })));
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  async function openPost(slug: string) {
    const { content, sha } = await ghGet(`content/blog/${slug}.md`);
    const [, fm, body = ""] = content.split(/^---\s*$/m);
    const get = (key: string) => (fm.match(new RegExp(`^${key}:\\s*(.+)$`, "m")) ?? [])[1]?.replace(/^["']|["']$/g, "").trim() ?? "";
    setEditing({ slug, title: get("title"), date: get("date"), excerpt: get("excerpt"), content: body.trim() });
    setEditSha(sha);
    setIsNew(false);
    setEditorKey(k => k + 1);
  }

  function newPost() {
    const today = new Date().toISOString().slice(0, 10);
    setEditing({ slug: "", title: "", date: today, excerpt: "", content: "" });
    setEditSha(undefined);
    setIsNew(true);
    setEditorKey(k => k + 1);
  }

  async function savePost() {
    if (!editing) return;
    setSaving(true); setSaved(false);
    const slug = isNew
      ? editing.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `post-${Date.now()}`
      : editing.slug;
    const fm = `---\ntitle: "${editing.title}"\ndate: ${editing.date}\nexcerpt: "${editing.excerpt}"\n---\n\n`;
    await ghSave(`content/blog/${slug}.md`, fm + editing.content, editSha);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 5000);
    if (isNew) { setIsNew(false); setEditing(p => p ? { ...p, slug } : p); await loadList(); }
  }

  async function deletePost(slug: string, sha: string) {
    if (!confirm(`确认删除 "${slug}"？`)) return;
    await ghDelete(`content/blog/${slug}.md`, sha);
    if (editing?.slug === slug) setEditing(null);
    await loadList();
  }

  if (editing) {
    return (
      <div className="space-y-4">
        <button onClick={() => setEditing(null)} className="text-brand text-sm hover:underline">← 返回文章列表 Back to posts</button>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="标题 Title" value={editing.title} onChange={v => setEditing(p => p ? { ...p, title: v } : p)} />
          <Field label="日期 Date" value={editing.date} onChange={v => setEditing(p => p ? { ...p, date: v } : p)} placeholder="YYYY-MM-DD" />
        </div>
        <TextArea label="摘要（显示在博客列表）Excerpt" value={editing.excerpt} onChange={v => setEditing(p => p ? { ...p, excerpt: v } : p)} rows={2} />
        <div>
          <label className="block text-sm font-medium text-bark mb-1">内容 Content</label>
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
      <Btn onClick={newPost}>+ 新建文章 New Post</Btn>
      {posts.length === 0 && <p className="text-bark-light text-sm">暂无文章。No posts yet.</p>}
      {posts.map(p => (
        <div key={p.slug} className="flex items-center justify-between bg-white border border-brand-light rounded-xl px-5 py-3">
          <span className="text-bark font-medium">{p.slug}</span>
          <div className="flex gap-2">
            <Btn small variant="secondary" onClick={() => openPost(p.slug)}>编辑 Edit</Btn>
            <Btn small variant="danger" onClick={() => deletePost(p.slug, p.sha)}>删除 Delete</Btn>
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
const TABS = ["设置 Settings", "服务项目 Services", "附加服务 Add-ons", "博客编辑 Blog Editor", "客户登记 Intake", "发票 Invoice"] as const;
type Tab = typeof TABS[number];
type FontSize = "small" | "medium" | "large";
const FONT_SIZE_OPTIONS: { value: FontSize; label: "小" | "中" | "大" }[] = [
  { value: "small", label: "小" },
  { value: "medium", label: "中" },
  { value: "large", label: "大" },
];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("设置 Settings");
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
        .admin-panel {
          background: #ffffff;
          border: 2px solid #b6c2cf;
          box-shadow: 0 1px 2px rgba(31, 41, 51, 0.08);
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
        .admin-font-small .text-2xl { font-size: 1.6rem; line-height: 2.15rem; }
        .admin-font-medium .text-2xl { font-size: 1.9rem; line-height: 2.45rem; }
        .admin-font-large .text-2xl { font-size: 2.25rem; line-height: 2.85rem; }
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
              <p className="text-sm text-slate-700 mt-1">管理后台 Admin</p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-5 space-y-2">
          {TABS.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              title={sidebarOpen ? undefined : t}
              className={`w-full min-h-14 rounded-lg px-4 text-sm font-bold transition-colors flex items-center border-2 ${sidebarOpen ? "justify-start text-left" : "justify-center"} ${tab === t ? "bg-slate-900 border-slate-900 text-white shadow-sm" : "bg-white border-transparent text-slate-800 hover:text-slate-950 hover:bg-slate-100 hover:border-slate-300"}`}
            >
              {sidebarOpen ? t : t.slice(0, 1)}
            </button>
          ))}
        </nav>

        <div className="px-3 py-5 border-t-2 border-slate-300">
          {sidebarOpen && <p className="text-sm font-bold text-slate-800 mb-3">字号</p>}
          <div className={`grid gap-2 ${sidebarOpen ? "grid-cols-3" : "grid-cols-1"}`}>
            {FONT_SIZE_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                aria-pressed={fontSize === option.value}
                title={`字号 ${option.label}`}
                onClick={() => setFontSize(option.value)}
                className={`admin-button min-h-14 rounded-lg border-2 px-2 text-sm font-bold transition-colors focus:outline-none focus:ring-4 focus:ring-sky-200 ${
                  fontSize === option.value
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-400 bg-white text-slate-900 hover:bg-slate-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-3 py-5 border-t-2 border-slate-300">
          <button
            type="button"
            onClick={logout}
            title={sidebarOpen ? undefined : "退出登录 Log out"}
            className={`admin-button w-full min-h-14 rounded-lg px-4 text-sm font-bold text-slate-800 bg-white border-2 border-slate-300 hover:text-slate-950 hover:bg-slate-100 transition-colors flex items-center ${sidebarOpen ? "justify-start" : "justify-center"}`}
          >
            {sidebarOpen ? "退出登录 Log out" : "X"}
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 px-5 py-6 lg:px-10 lg:py-10 transition-[padding] duration-300">
        <div className="mb-7">
          <p className="text-sm text-slate-700 font-semibold">当前页面 Current</p>
          <h2 className="text-2xl font-bold text-slate-950">{tab}</h2>
        </div>

        <div className="admin-panel w-full rounded-lg p-6 lg:p-8">
          {tab === "设置 Settings" && <SettingsTab />}
          {tab === "服务项目 Services" && <ServicesTab />}
          {tab === "附加服务 Add-ons" && <AddonsTab />}
          {tab === "博客编辑 Blog Editor" && <BlogTab />}
          {tab === "客户登记 Intake" && <IntakeTab />}
          {tab === "发票 Invoice" && <InvoiceTab />}
        </div>
      </main>
    </div>
  );
}
