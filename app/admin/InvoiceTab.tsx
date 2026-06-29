"use client";

import { useMemo, useState } from "react";

/* ──────────────────────────────────────────────────────────────────────────
   Contractor Invoice tool
   Jane bills a studio (e.g. Trio Wellness) from their bi-monthly report.
   Amount Due per line = Sales + Gratuity.
   Generates a branded, printable invoice → Print / Save as PDF.
   ────────────────────────────────────────────────────────────────────────── */

// ── types ─────────────────────────────────────────────────────────────────
interface LineItem {
  date: string;
  description: string;
  sales: string;     // dollars, as typed
  gratuity: string;  // dollars, as typed
}
interface Party { name: string; line2: string; address: string; phone: string; email: string }
interface InvoiceState {
  from: Party;
  billTo: Party;
  invoiceNo: string;
  invoiceDate: string;
  items: LineItem[];
  notes: string;
}

// ── defaults ──────────────────────────────────────────────────────────────
const emptyParty: Party = { name: "", line2: "", address: "", phone: "", email: "" };
const JANE: Party = {
  name: "Jane's Therapy",
  line2: "Jane Zhang, CMT · Massage Therapist",
  address: "Palo Alto, CA",
  phone: "(669) 292-4472",
  email: "janezhang.therapist@gmail.com",
};
const TRIO: Party = {
  name: "Trio Wellness Management, LLC",
  line2: "Attn: Edward & Kathy Cefalu",
  address: "1585 The Alameda, San Jose, CA 95126",
  phone: "(408) 985-1544",
  email: "",
};

function emptyState(): InvoiceState {
  return {
    from: { ...emptyParty },
    billTo: { ...emptyParty },
    invoiceNo: "",
    invoiceDate: "",
    items: [{ date: "", description: "", sales: "", gratuity: "" }],
    notes: "",
  };
}

// ── money helpers ─────────────────────────────────────────────────────────
const num = (s: string) => { const n = parseFloat(s); return isNaN(n) ? 0 : n; };
const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
function rowDue(it: LineItem) {
  return num(it.sales) + num(it.gratuity);
}

// ── small UI helpers (match admin styling) ────────────────────────────────
const inputCls = "w-full border border-brand-light rounded-lg px-3 py-2 text-sm text-bark focus:outline-none focus:ring-2 focus:ring-brand";
const cellCls = "w-full border border-brand-light rounded-md px-2 py-1.5 text-sm text-bark focus:outline-none focus:ring-2 focus:ring-brand";

function Btn({ onClick, children, variant = "primary", small, disabled }: {
  onClick?: () => void; children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger"; small?: boolean; disabled?: boolean;
}) {
  const base = small ? "px-3 py-1 text-sm rounded-full font-medium" : "px-5 py-2 rounded-full font-semibold";
  const cls = {
    primary: "bg-brand text-white hover:bg-brand-dark",
    secondary: "border border-brand-light text-bark hover:bg-brand-light",
    danger: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100",
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${base} ${cls} transition-colors disabled:opacity-40`}>{children}</button>
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-bark mb-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
    </div>
  );
}

function PartyEditor({ title, party, onChange }: { title: React.ReactNode; party: Party; onChange: (p: Party) => void }) {
  const set = (k: keyof Party) => (v: string) => onChange({ ...party, [k]: v });
  return (
    <div className="border border-brand-light rounded-xl p-4 space-y-3 bg-white">
      <p className="text-sm font-semibold text-brand-dark">{title}</p>
      <Field label="名称 Name" value={party.name} onChange={set("name")} />
      <Field label="第二行 Line 2" value={party.line2} onChange={set("line2")} placeholder="如：联系人 / 头衔 Attn / title" />
      <Field label="地址 Address" value={party.address} onChange={set("address")} />
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="电话 Phone" value={party.phone} onChange={set("phone")} />
        <Field label="邮箱 Email" value={party.email} onChange={set("email")} />
      </div>
    </div>
  );
}

// ── printable invoice HTML (mirrors the PDF design) ────────────────────────
function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function buildInvoiceHTML(inv: InvoiceState): string {
  const items = inv.items.filter(it => it.date || it.description || it.sales || it.gratuity);
  const tSales = items.reduce((a, it) => a + num(it.sales), 0);
  const tGrat = items.reduce((a, it) => a + num(it.gratuity), 0);
  const tDue = items.reduce((a, it) => a + rowDue(it), 0);

  const partyHTML = (p: Party) => [p.name, p.line2, p.address, p.phone, p.email]
    .filter(Boolean).map((l, i) =>
      `<div class="${i === 0 ? "pname" : "pl"}">${esc(l)}</div>`).join("");

  const rowsHTML = items.map(it => `
    <tr>
      <td>${esc(it.date)}</td>
      <td class="desc">${esc(it.description)}</td>
      <td class="r">${money(num(it.sales))}</td>
      <td class="r">${money(num(it.gratuity))}</td>
      <td class="r b">${money(rowDue(it))}</td>
    </tr>`).join("");

  const metaRow = (label: string, val: string) => val
    ? `<tr><td class="ml">${label}</td><td class="mv">${esc(val)}</td></tr>` : "";

  const calcNote = `Amount Due is calculated as sales income plus gratuities collected on Jane's behalf. Calculation: ${money(tSales)} sales + ${money(tGrat)} gratuity = <b>${money(tDue)}</b>.`;

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(inv.invoiceNo || "Invoice")}</title>
<style>
  :root{--brand:#a87c5f;--brand-dark:#855c40;--brand-light:#efe5d9;--cream:#faf6f0;
        --bark:#2c2018;--bark-light:#6e5c4e;--sage:#5c7059;}
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;}
  body{font-family:Helvetica,Arial,sans-serif;color:var(--bark);
       -webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .sheet{max-width:760px;margin:0 auto;padding:42px 46px;}
  .top{display:flex;justify-content:space-between;align-items:flex-start;}
  .biz{font-size:24px;font-weight:700;letter-spacing:.2px;}
  .biz-sub{font-size:11px;color:var(--bark-light);margin-top:3px;line-height:1.5;}
  .word{font-size:34px;font-weight:700;color:var(--brand);letter-spacing:1px;}
  .rule{height:2px;background:var(--brand);margin:14px 0 20px;}
  .cols{display:flex;justify-content:space-between;gap:30px;}
  .pname{font-size:12.5px;font-weight:700;color:var(--bark);line-height:1.6;}
  .pl{font-size:12px;color:var(--bark);line-height:1.6;}
  .blocklbl{font-size:10px;font-weight:700;letter-spacing:.6px;color:var(--brand-dark);margin-bottom:5px;}
  table.meta{border-collapse:collapse;min-width:260px;}
  table.meta td{padding:5px 0;font-size:11.5px;}
  table.meta .ml{color:var(--bark-light);font-weight:700;letter-spacing:.4px;padding-right:18px;}
  table.meta .mv{text-align:right;color:var(--bark);}
  table.meta tr:not(:last-child) td{border-bottom:1px solid var(--brand-light);}
  table.items{width:100%;border-collapse:collapse;margin-top:26px;}
  table.items thead th{background:var(--brand-dark);color:#fff;font-size:11px;
       letter-spacing:.4px;padding:9px 9px;text-align:left;}
  table.items thead th.r{text-align:right;}
  table.items tbody td{padding:9px 9px;font-size:12px;border-bottom:1px solid var(--brand-light);vertical-align:top;}
  table.items tbody tr:nth-child(even){background:var(--cream);}
  table.items td.r{text-align:right;}
  table.items td.b{font-weight:700;}
  table.items td.desc{color:var(--bark);}
  table.items tfoot td{padding:10px 9px;font-size:12px;font-weight:700;background:var(--brand-light);border-top:2px solid var(--brand);}
  table.items tfoot td.r{text-align:right;}
  .due{display:flex;justify-content:flex-end;margin-top:18px;}
  .due-band{background:var(--sage);color:#fff;border-radius:6px;display:flex;align-items:center;
       gap:26px;padding:13px 22px;}
  .due-band .lbl{font-size:12px;font-weight:700;letter-spacing:1px;}
  .due-band .amt{font-size:20px;font-weight:700;}
  .foot{margin-top:30px;border-top:1px solid var(--brand-light);padding-top:12px;}
  .foot h4{margin:0 0 4px;font-size:11px;color:var(--bark);}
  .foot p{margin:0 0 8px;font-size:11px;color:var(--bark-light);line-height:1.6;}
  @media print{.sheet{padding:0;} @page{margin:14mm;}}
</style></head>
<body><div class="sheet">
  <div class="top">
    <div>
      <div class="biz">${esc(inv.from.name)}</div>
      <div class="biz-sub">${[inv.from.line2, inv.from.address, [inv.from.email, inv.from.phone].filter(Boolean).join(" · ")].filter(Boolean).map(esc).join("<br>")}</div>
    </div>
    <div class="word">INVOICE</div>
  </div>
  <div class="rule"></div>
  <div class="cols">
    <div>
      <div class="blocklbl">BILL TO</div>
      ${partyHTML(inv.billTo)}
    </div>
    <table class="meta">
      ${metaRow("INVOICE #", inv.invoiceNo)}
      ${metaRow("INVOICE DATE", inv.invoiceDate)}
    </table>
  </div>
  <table class="items">
    <thead><tr>
      <th>Date</th><th>Description</th>
      <th class="r">Sales</th><th class="r">Gratuity</th>
      <th class="r">Amount Due</th>
    </tr></thead>
    <tbody>${rowsHTML}</tbody>
    <tfoot><tr>
      <td></td><td>Totals</td>
      <td class="r">${money(tSales)}</td><td class="r">${money(tGrat)}</td>
      <td class="r">${money(tDue)}</td>
    </tr></tfoot>
  </table>
  <div class="due"><div class="due-band"><span class="lbl">AMOUNT DUE</span><span class="amt">${money(tDue)}</span></div></div>
  <div class="foot">
    <h4>How this is calculated</h4>
    <p>${calcNote}</p>
    ${inv.notes ? `<p>${esc(inv.notes)}</p>` : ""}
    <p>Thank you! Please remit payment to ${esc(inv.from.name)}. Questions: ${esc(inv.from.email)}${inv.from.phone ? " / " + esc(inv.from.phone) : ""}.</p>
  </div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print();},250);};</script>
</body></html>`;
}

// ── main component ─────────────────────────────────────────────────────────
const LS_KEY = "janeInvoiceDefaults_v1";

export default function InvoiceTab() {
  const [inv, setInv] = useState<InvoiceState>(emptyState);
  const [defaultsSaved, setDefaultsSaved] = useState(false);

  const totals = useMemo(() => {
    const its = inv.items;
    return {
      sales: its.reduce((a, it) => a + num(it.sales), 0),
      grat: its.reduce((a, it) => a + num(it.gratuity), 0),
      due: its.reduce((a, it) => a + rowDue(it), 0),
    };
  }, [inv.items]);

  function patch(p: Partial<InvoiceState>) { setInv(s => ({ ...s, ...p })); }
  function setItem(i: number, p: Partial<LineItem>) {
    setInv(s => ({ ...s, items: s.items.map((it, idx) => idx === i ? { ...it, ...p } : it) }));
  }
  function addRow() {
    setInv(s => ({ ...s, items: [...s.items, { date: "", description: "", sales: "", gratuity: "" }] }));
  }
  function removeRow(i: number) {
    setInv(s => ({ ...s, items: s.items.length > 1 ? s.items.filter((_, idx) => idx !== i) : s.items }));
  }

  function saveDefaults() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ from: inv.from, billTo: inv.billTo }));
      setDefaultsSaved(true);
      window.setTimeout(() => setDefaultsSaved(false), 3000);
    } catch {
      alert("无法保存常用信息。Could not save defaults.");
    }
  }

  function loadDefaults() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const d = raw ? JSON.parse(raw) : { from: JANE, billTo: TRIO };
      setInv(s => ({
        ...s,
        from: d.from ?? JANE,
        billTo: d.billTo ?? TRIO,
      }));
    } catch {
      setInv(s => ({ ...s, from: { ...JANE }, billTo: { ...TRIO } }));
    }
  }

  function autoInvoiceNo() {
    const d = new Date(inv.invoiceDate || Date.now());
    if (isNaN(d.getTime())) return;
    const studio = inv.billTo.name.match(/trio/i) ? "TRIO" : (inv.billTo.name.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, "") || "INV");
    const mmdd = `${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    patch({ invoiceNo: `${studio}-${d.getFullYear()}-${mmdd}` });
  }

  function generate() {
    const html = buildInvoiceHTML(inv);
    const w = window.open("", "_blank");
    if (!w) { alert("请允许弹出窗口以生成发票。Please allow pop-ups to generate the invoice."); return; }
    w.document.write(html);
    w.document.close();
  }

  return (
    <div className="space-y-7">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-bark">承包发票生成器 <span className="font-normal text-bark-light">Contractor Invoice Generator</span></p>
          <p className="text-sm text-bark-light mt-1 max-w-xl">
            按工作室的双月报表给 Trio Wellness（或其他工作室）开票。每行应付金额 = 销售额 + 小费。<br />
            <span className="text-bark-light/80">Bill a studio from their bi-monthly report. Amount Due = Sales + Gratuity.</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn variant="secondary" small onClick={loadDefaults}>套用常用信息 Load Defaults</Btn>
          <Btn variant="secondary" small onClick={() => setInv(emptyState())}>清空重填 Reset</Btn>
        </div>
      </div>

      {/* parties */}
      <div className="grid md:grid-cols-2 gap-4">
        <PartyEditor title={<>开票方 <span className="font-normal text-bark-light">From (Jane)</span></>} party={inv.from} onChange={p => patch({ from: p })} />
        <PartyEditor title={<>收票方 <span className="font-normal text-bark-light">Bill To (Studio)</span></>} party={inv.billTo} onChange={p => patch({ billTo: p })} />
      </div>

      {/* meta */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-bark mb-1">发票号 Invoice #</label>
          <div className="flex gap-2">
            <input value={inv.invoiceNo} onChange={e => patch({ invoiceNo: e.target.value })} placeholder="TRIO-2026-0615" className={inputCls} />
            <Btn small variant="secondary" onClick={autoInvoiceNo}>自动 Auto</Btn>
          </div>
        </div>
        <Field label="开票日期 Invoice Date" value={inv.invoiceDate} onChange={v => patch({ invoiceDate: v })} placeholder="YYYY-MM-DD" />
      </div>

      {/* line items */}
      <div>
        <label className="block text-sm font-medium text-bark mb-2">服务明细 <span className="font-normal text-bark-light">Line Items</span></label>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-separate border-spacing-y-1.5">
            <thead>
              <tr className="text-left text-xs text-bark-light">
                <th className="font-medium px-1 w-24">日期 Date</th>
                <th className="font-medium px-1">服务说明 Description</th>
                <th className="font-medium px-1 w-24 text-right">销售 Sales</th>
                <th className="font-medium px-1 w-24 text-right">小费 Grat.</th>
                <th className="font-medium px-1 w-24 text-right">应付 Due</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((it, i) => (
                <tr key={i} className="align-top">
                  <td className="px-1"><input value={it.date} onChange={e => setItem(i, { date: e.target.value })} placeholder="6/3/26" className={cellCls} /></td>
                  <td className="px-1"><input value={it.description} onChange={e => setItem(i, { description: e.target.value })} placeholder="60-min Prenatal (w/ ...)" className={cellCls} /></td>
                  <td className="px-1"><input value={it.sales} onChange={e => setItem(i, { sales: e.target.value })} placeholder="110" inputMode="decimal" className={`${cellCls} text-right`} /></td>
                  <td className="px-1"><input value={it.gratuity} onChange={e => setItem(i, { gratuity: e.target.value })} placeholder="20" inputMode="decimal" className={`${cellCls} text-right`} /></td>
                  <td className="px-1 text-right text-sm text-bark font-semibold pt-2.5 whitespace-nowrap">{money(rowDue(it))}</td>
                  <td className="px-1 pt-1.5 text-center">
                    <button onClick={() => removeRow(i)} title="删除 Remove"
                      className="text-red-400 hover:text-red-600 text-lg leading-none disabled:opacity-30"
                      disabled={inv.items.length <= 1}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="text-sm font-semibold text-bark">
                <td className="px-1 pt-2"></td>
                <td className="px-1 pt-2">合计 Totals</td>
                <td className="px-1 pt-2 text-right">{money(totals.sales)}</td>
                <td className="px-1 pt-2 text-right">{money(totals.grat)}</td>
                <td className="px-1 pt-2 text-right">{money(totals.due)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="mt-2"><Btn small variant="secondary" onClick={addRow}>+ 添加一行 Add Line</Btn></div>
      </div>

      <Field label="备注（可选）Notes (optional)" value={inv.notes} onChange={v => patch({ notes: v })} placeholder="如：付款方式 / Payment method, Venmo, etc." />

      {/* amount due + actions */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-t border-brand-light pt-5">
        <div className="bg-sage text-white rounded-xl px-5 py-3 flex items-center gap-5">
          <span className="text-sm font-semibold tracking-wide">应付金额 AMOUNT DUE</span>
          <span className="text-xl font-bold">{money(totals.due)}</span>
        </div>
        <div className="flex items-center gap-3">
          <Btn variant="secondary" onClick={saveDefaults}>保存常用信息 Save Defaults</Btn>
          {defaultsSaved && <span className="text-sm text-sage">已保存 Saved</span>}
          <Btn onClick={generate} disabled={totals.due === 0}>生成 / 打印 PDF · Generate PDF</Btn>
        </div>
      </div>
    </div>
  );
}
