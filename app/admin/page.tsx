"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

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
  const base = small ? "px-3 py-1 text-sm rounded-full font-medium" : "px-5 py-2 rounded-full font-semibold";
  const cls = {
    primary: "bg-brand text-white hover:bg-brand-dark",
    secondary: "border border-brand-light text-bark hover:bg-brand-light",
    danger: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100",
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
  function move(i: number, dir: -1 | 1) {
    setServices(s => {
      const next = [...s];
      [next[i], next[i + dir]] = [next[i + dir], next[i]];
      return next;
    });
    setOpen(o => o === i ? i + dir : o === i + dir ? i : o);
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
    <div className="space-y-4">
      {services.map((svc, i) => (
        <div key={i} className="border border-brand-light rounded-xl overflow-hidden">
          <div className="w-full flex items-center bg-white hover:bg-brand-light">
            <button onClick={() => setOpen(open === i ? null : i)}
              className="flex-1 flex items-center px-5 py-3 text-left">
              <span className="font-medium text-bark">{svc.name || "未命名 Untitled"}</span>
            </button>
            <div className="flex items-center gap-0.5 pr-3">
              <button onClick={() => move(i, -1)} disabled={i === 0}
                className="p-1.5 text-bark-light hover:text-bark disabled:opacity-25 text-base leading-none" title="上移">↑</button>
              <button onClick={() => move(i, 1)} disabled={i === services.length - 1}
                className="p-1.5 text-bark-light hover:text-bark disabled:opacity-25 text-base leading-none" title="下移">↓</button>
              <span className="text-bark-light text-sm ml-1">{open === i ? "▲" : "▼"}</span>
            </div>
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
      <div className="flex flex-wrap gap-3">
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
  function move(i: number, dir: -1 | 1) {
    setAddons(a => {
      const next = [...a];
      [next[i], next[i + dir]] = [next[i + dir], next[i]];
      return next;
    });
    setOpen(o => o === i ? i + dir : o === i + dir ? i : o);
  }
  function removeAddon(i: number) {
    if (!confirm("确认删除此附加服务？Remove this add-on?")) return;
    setAddons(a => a.filter((_, idx) => idx !== i));
    setOpen(null);
  }

  return (
    <div className="space-y-4">
      {addons.map((addon, i) => (
        <div key={i} className="border border-brand-light rounded-xl overflow-hidden">
          <div className="w-full flex items-center bg-white hover:bg-brand-light">
            <button onClick={() => setOpen(open === i ? null : i)}
              className="flex-1 flex items-center px-5 py-3 text-left">
              <span className="font-medium text-bark">{addon.name || "未命名 Untitled"}</span>
            </button>
            <div className="flex items-center gap-0.5 pr-3">
              <button onClick={() => move(i, -1)} disabled={i === 0}
                className="p-1.5 text-bark-light hover:text-bark disabled:opacity-25 text-base leading-none" title="上移">↑</button>
              <button onClick={() => move(i, 1)} disabled={i === addons.length - 1}
                className="p-1.5 text-bark-light hover:text-bark disabled:opacity-25 text-base leading-none" title="下移">↓</button>
              <span className="text-bark-light text-sm ml-1">{open === i ? "▲" : "▼"}</span>
            </div>
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
      <div className="flex flex-wrap gap-3">
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

  const loadList = useCallback(async () => {
    const { files } = await ghGet("content/blog");
    setPosts(files.filter((f: { name: string }) => f.name.endsWith(".md")).map((f: { name: string; sha: string }) => ({
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
  }

  function newPost() {
    const today = new Date().toISOString().slice(0, 10);
    setEditing({ slug: "", title: "", date: today, excerpt: "", content: "" });
    setEditSha(undefined);
    setIsNew(true);
  }

  async function savePost() {
    if (!editing) return;
    setSaving(true); setSaved(false);
    const slug = isNew
      ? editing.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
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
        <TextArea label="内容（Markdown 格式）Content" value={editing.content} onChange={v => setEditing(p => p ? { ...p, content: v } : p)} rows={16} mono />
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
const inputCls = "flex-1 border border-brand-light rounded-lg px-3 py-1.5 text-sm text-bark focus:outline-none focus:ring-2 focus:ring-brand";

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-bark mb-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-brand-light rounded-lg px-3 py-2 text-sm text-bark focus:outline-none focus:ring-2 focus:ring-brand" />
    </div>
  );
}
function TextArea({ label, value, onChange, rows = 4, mono, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; mono?: boolean; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-bark mb-1">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        className={`w-full border border-brand-light rounded-lg px-3 py-2 text-sm text-bark focus:outline-none focus:ring-2 focus:ring-brand resize-y ${mono ? "font-mono" : ""}`} />
    </div>
  );
}

// ── ROOT PAGE ─────────────────────────────────────────────────────────────────
const TABS = ["设置 Settings", "服务项目 Services", "附加服务 Add-ons", "博客 Blog"] as const;
type Tab = typeof TABS[number];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("设置 Settings");
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white border-b border-brand-light px-6 py-4 flex items-center justify-between">
        <h1 className="font-semibold text-bark">Jane&apos;s Therapy 管理后台</h1>
        <button onClick={logout} className="text-sm text-bark-light hover:text-brand">退出登录 Log out</button>
      </header>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex gap-1 mb-8 bg-white border border-brand-light rounded-xl p-1">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t ? "bg-brand text-white" : "text-bark-light hover:text-bark"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="bg-white border border-brand-light rounded-xl p-6">
          {tab === "设置 Settings" && <SettingsTab />}
          {tab === "服务项目 Services" && <ServicesTab />}
          {tab === "附加服务 Add-ons" && <AddonsTab />}
          {tab === "博客 Blog" && <BlogTab />}
        </div>
      </div>
    </div>
  );
}
