"use client";

import { useMemo, useState } from "react";
import { useAdminLang } from "./i18n";

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
  address: "San Jose, CA",
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
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ── small UI helpers (match admin styling) ────────────────────────────────
function Btn({ onClick, children, variant = "primary", small, disabled }: {
  onClick?: () => void; children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger"; small?: boolean; disabled?: boolean;
}) {
  const base = small ? "admin-button px-4 py-2 text-sm rounded-lg font-semibold" : "admin-button px-6 py-3 rounded-lg font-bold";
  const cls = {
    primary: "bg-slate-900 text-white hover:bg-slate-700",
    secondary: "border-2 border-slate-600 text-slate-900 bg-white hover:bg-slate-100",
    danger: "bg-red-50 text-red-800 border-2 border-red-300 hover:bg-red-100",
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${base} ${cls} transition-colors disabled:opacity-40`}>{children}</button>
  );
}

/* ── WYSIWYG sheet styling ─────────────────────────────────────────────────
   The editor renders the same layout as the printed invoice, so every field
   sits exactly where it will land on the PDF. Scoped `inv-` classes keep the
   brand colours intact under the admin's high-contrast overrides. */
const SHEET_CSS = `
.inv-shell{background:#e7e2da;border-radius:12px;padding:20px;overflow-x:auto;}
.inv-sheet{background:#fff;color:#2c2018;font-family:Helvetica,Arial,sans-serif;
  font-size:clamp(15px,0.88em,20px);line-height:1.5;min-width:660px;max-width:820px;margin:0 auto;
  padding:34px 38px 30px;border-radius:4px;box-shadow:0 6px 22px rgba(44,32,24,.18);}
.inv-sheet input,.inv-sheet textarea{font:inherit;color:inherit;background:transparent;
  border:0;border-bottom:1px dashed #cfc2ae;border-radius:2px;padding:2px 4px;width:100%;
  transition:background-color .12s,border-color .12s;}
.inv-sheet input::placeholder,.inv-sheet textarea::placeholder{color:#a9998a;font-weight:400;}
.inv-sheet input:hover,.inv-sheet textarea:hover{background:#f7f2ea;border-bottom-color:#a87c5f;}
.inv-sheet input:focus,.inv-sheet textarea:focus{outline:none;background:#fdf7ef;
  border-bottom:1px solid #855c40;box-shadow:0 0 0 3px rgba(168,124,95,.22);}
.inv-top{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;}
.inv-from{flex:1;min-width:0;}
.inv-name input{font-size:1.5em;font-weight:700;letter-spacing:.2px;}
.inv-sub input{font-size:.8em;color:#4e3d2e;}
.inv-word{font-size:2.1em;font-weight:700;color:#a87c5f;letter-spacing:1px;white-space:nowrap;padding-top:4px;}
.inv-rule{height:2px;background:#a87c5f;margin:14px 0 18px;}
.inv-cols{display:flex;justify-content:space-between;gap:30px;align-items:flex-start;}
.inv-billto{flex:1;min-width:0;max-width:60%;}
.inv-lbl{font-size:.7em;font-weight:700;letter-spacing:.6px;color:#855c40;margin-bottom:5px;}
.inv-billto .inv-p0 input{font-size:.88em;font-weight:700;}
.inv-billto .inv-p input{font-size:.85em;}
.inv-meta{border-collapse:collapse;min-width:290px;}
.inv-meta td{padding:4px 0;font-size:.8em;vertical-align:middle;}
.inv-meta tr:not(:last-child) td{border-bottom:1px solid #c9b69e;}
.inv-meta .ml{color:#4e3d2e;font-weight:700;letter-spacing:.4px;padding-right:14px;white-space:nowrap;}
.inv-meta .mv{text-align:right;}
.inv-meta .mv-wrap{display:flex;align-items:center;gap:6px;}
.inv-meta .mv input{text-align:right;}
.inv-mini{font-size:.85em;font-weight:700;color:#855c40;background:#f3ebe0;border:1px solid #d8c6b0;
  border-radius:999px;padding:3px 10px;white-space:nowrap;cursor:pointer;}
.inv-mini:hover{background:#e8dbc9;}
.inv-items{width:100%;border-collapse:collapse;margin-top:24px;}
.inv-items th{background:#855c40;color:#fff;font-size:.78em;letter-spacing:.4px;padding:8px 8px;text-align:left;font-weight:700;}
.inv-items th.r{text-align:right;}
.inv-items th.x{width:34px;background:#fff;}
.inv-items td{padding:4px 6px;font-size:.85em;border-bottom:1px solid #c9b69e;vertical-align:middle;}
.inv-items tbody tr:nth-child(even) td{background:#faf6f0;}
.inv-items td.r,.inv-items td.r input{text-align:right;}
.inv-items td.due{font-weight:700;white-space:nowrap;padding-right:8px;}
.inv-items td.x{border-bottom:0;background:#fff !important;text-align:center;}
.inv-items tfoot td{padding:9px 8px;font-size:.85em;font-weight:700;background:#efe5d9 !important;border-top:2px solid #a87c5f;border-bottom:0;}
.inv-items tfoot td.r{text-align:right;}
.inv-items tfoot td.x{background:#fff !important;border-top:0;}
.inv-del{color:#c07a72;font-size:1.15em;line-height:1;padding:2px 4px;border-radius:4px;cursor:pointer;}
.inv-del:hover{color:#a33;background:#fbeceb;}
.inv-del:disabled{opacity:.25;cursor:default;}
.inv-add{margin-top:8px;font-size:.85em;font-weight:700;color:#855c40;background:#f7f2ea;
  border:1px dashed #c9b69e;border-radius:6px;padding:7px 12px;cursor:pointer;width:100%;text-align:left;}
.inv-add:hover{background:#f0e6d8;border-color:#a87c5f;}
.inv-due{display:flex;justify-content:flex-end;margin-top:16px;}
.inv-band{background:#5c7059;color:#fff;border-radius:6px;display:flex;align-items:center;gap:24px;padding:12px 20px;}
.inv-band .l{font-size:.78em;font-weight:700;letter-spacing:1px;}
.inv-band .a{font-size:1.3em;font-weight:700;}
.inv-foot{margin-top:26px;border-top:1px solid #c9b69e;padding-top:12px;}
.inv-foot h4{margin:0 0 4px;font-size:.78em;font-weight:700;}
.inv-foot p{margin:0 0 8px;font-size:.78em;color:#4e3d2e;line-height:1.6;}
.inv-foot textarea{font-size:.8em;resize:vertical;min-height:2.6em;}
`;

/** Inline field that reads as printed text until you hover or focus it. */
function Cell({ value, onChange, placeholder, label, className, inputMode }: {
  value: string; onChange: (v: string) => void; placeholder?: string; label: string;
  className?: string; inputMode?: "decimal" | "text";
}) {
  return (
    <div className={className}>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        aria-label={label} title={label} inputMode={inputMode} />
    </div>
  );
}

/** The From / Bill To blocks: one line per printed line, in print order. */
function PartyBlock({ party, onChange, who, nameHint }: {
  party: Party; onChange: (p: Party) => void; who: string; nameHint: string;
}) {
  const { t } = useAdminLang();
  const set = (k: keyof Party) => (v: string) => onChange({ ...party, [k]: v });
  return (
    <>
      <Cell className="inv-p0" label={`${who} · ${t("invoice.name")}`} value={party.name} onChange={set("name")} placeholder={nameHint} />
      <Cell className="inv-p" label={`${who} · ${t("invoice.line2")}`} value={party.line2} onChange={set("line2")} placeholder={t("invoice.attnPlaceholder")} />
      <Cell className="inv-p" label={`${who} · ${t("field.address")}`} value={party.address} onChange={set("address")} placeholder={t("field.address")} />
      <Cell className="inv-p" label={`${who} · ${t("field.phone")}`} value={party.phone} onChange={set("phone")} placeholder={t("field.phone")} />
      <Cell className="inv-p" label={`${who} · ${t("field.email")}`} value={party.email} onChange={set("email")} placeholder={t("field.email")} />
    </>
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
        --bark:#2c2018;--bark-light:#4e3d2e;--line:#c9b69e;--sage:#5c7059;}
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;}
  body{font-family:Helvetica,Arial,sans-serif;color:var(--bark);
       -webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .sheet{max-width:760px;margin:0 auto;padding:42px 46px;}
  .top{display:flex;justify-content:space-between;align-items:flex-start;}
  .biz{font-size:24px;font-weight:700;letter-spacing:.2px;}
  .biz-sub{font-size:12px;color:var(--bark-light);margin-top:3px;line-height:1.5;}
  .word{font-size:34px;font-weight:700;color:var(--brand);letter-spacing:1px;}
  .rule{height:2px;background:var(--brand);margin:14px 0 20px;}
  .cols{display:flex;justify-content:space-between;gap:30px;}
  .pname{font-size:13.5px;font-weight:700;color:var(--bark);line-height:1.6;}
  .pl{font-size:13px;color:var(--bark);line-height:1.6;}
  .blocklbl{font-size:11px;font-weight:700;letter-spacing:.6px;color:var(--brand-dark);margin-bottom:5px;}
  table.meta{border-collapse:collapse;min-width:260px;}
  table.meta td{padding:5px 0;font-size:12.5px;}
  table.meta .ml{color:var(--bark-light);font-weight:700;letter-spacing:.4px;padding-right:18px;}
  table.meta .mv{text-align:right;color:var(--bark);}
  table.meta tr:not(:last-child) td{border-bottom:1px solid var(--line);}
  table.items{width:100%;border-collapse:collapse;margin-top:26px;}
  table.items thead th{background:var(--brand-dark);color:#fff;font-size:12px;
       letter-spacing:.4px;padding:9px 9px;text-align:left;}
  table.items thead th.r{text-align:right;}
  table.items tbody td{padding:9px 9px;font-size:13px;border-bottom:1px solid var(--line);vertical-align:top;}
  table.items tbody tr:nth-child(even){background:var(--cream);}
  table.items td.r{text-align:right;}
  table.items td.b{font-weight:700;}
  table.items td.desc{color:var(--bark);}
  table.items tfoot td{padding:10px 9px;font-size:13px;font-weight:700;background:var(--brand-light);border-top:2px solid var(--brand);}
  table.items tfoot td.r{text-align:right;}
  .due{display:flex;justify-content:flex-end;margin-top:18px;}
  .due-band{background:var(--sage);color:#fff;border-radius:6px;display:flex;align-items:center;
       gap:26px;padding:13px 22px;}
  .due-band .lbl{font-size:12px;font-weight:700;letter-spacing:1px;}
  .due-band .amt{font-size:20px;font-weight:700;}
  .foot{margin-top:30px;border-top:1px solid var(--line);padding-top:12px;}
  .foot h4{margin:0 0 4px;font-size:12px;color:var(--bark);}
  .foot p{margin:0 0 8px;font-size:12px;color:var(--bark-light);line-height:1.6;}
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
  const { t } = useAdminLang();
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
      alert(t("invoice.defaultsError"));
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

  function setTodayInvoiceDate() {
    patch({ invoiceDate: todayISO() });
  }

  function generate() {
    const html = buildInvoiceHTML(inv);
    const w = window.open("", "_blank");
    if (!w) { alert(t("invoice.popupBlocked")); return; }
    w.document.write(html);
    w.document.close();
  }

  return (
    <div className="space-y-5">
      <style>{SHEET_CSS}</style>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-bark">{t("invoice.title")}</p>
          <p className="text-sm text-bark-light mt-1 max-w-xl">{t("invoice.intro")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn variant="secondary" small onClick={loadDefaults}>{t("invoice.loadDefaults")}</Btn>
          <Btn variant="secondary" small onClick={saveDefaults}>{t("invoice.saveDefaults")}</Btn>
          {defaultsSaved && <span className="text-sm text-sage self-center">{t("invoice.saved")}</span>}
          <Btn variant="secondary" small onClick={() => setInv(emptyState())}>{t("invoice.reset")}</Btn>
        </div>
      </div>

      {/* ── the sheet: same layout as the generated PDF ───────────────────── */}
      <div className="inv-shell">
        <div className="inv-sheet">
          <div className="inv-top">
            <div className="inv-from">
              <div className="inv-name">
                <Cell label={t("invoice.fromName")} value={inv.from.name}
                  onChange={v => patch({ from: { ...inv.from, name: v } })} placeholder={t("invoice.fromName")} />
              </div>
              <div className="inv-sub">
                <Cell label={t("invoice.fromTitle")} value={inv.from.line2}
                  onChange={v => patch({ from: { ...inv.from, line2: v } })} placeholder="Jane Zhang, CMT · Massage Therapist" />
                <Cell label={t("invoice.fromAddress")} value={inv.from.address}
                  onChange={v => patch({ from: { ...inv.from, address: v } })} placeholder={t("invoice.cityPlaceholder")} />
                <Cell label={t("invoice.fromEmail")} value={inv.from.email}
                  onChange={v => patch({ from: { ...inv.from, email: v } })} placeholder={t("field.email")} />
                <Cell label={t("invoice.fromPhone")} value={inv.from.phone}
                  onChange={v => patch({ from: { ...inv.from, phone: v } })} placeholder={t("field.phone")} />
              </div>
            </div>
            <div className="inv-word">INVOICE</div>
          </div>

          <div className="inv-rule" />

          <div className="inv-cols">
            <div className="inv-billto">
              <div className="inv-lbl">{t("invoice.billTo").toUpperCase()}</div>
              <PartyBlock who={t("invoice.billTo")} nameHint={t("invoice.studioName")}
                party={inv.billTo} onChange={p => patch({ billTo: p })} />
            </div>
            <table className="inv-meta">
              <tbody>
                <tr>
                  <td className="ml">{t("invoice.invoiceNo")}</td>
                  <td className="mv">
                    <div className="mv-wrap">
                      <input value={inv.invoiceNo} onChange={e => patch({ invoiceNo: e.target.value })}
                        placeholder="TRIO-2026-0615" aria-label={t("invoice.invoiceNo")} />
                      <button type="button" className="inv-mini" onClick={autoInvoiceNo}>{t("invoice.auto")}</button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="ml">{t("invoice.invoiceDate")}</td>
                  <td className="mv">
                    <div className="mv-wrap">
                      <input type="date" value={inv.invoiceDate} onChange={e => patch({ invoiceDate: e.target.value })}
                        aria-label={t("invoice.invoiceDate")} />
                      <button type="button" className="inv-mini" onClick={setTodayInvoiceDate}>{t("invoice.today")}</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <table className="inv-items">
            <thead>
              <tr>
                <th style={{ width: "15%" }}>{t("invoice.colDate")}</th>
                <th>{t("invoice.colDescription")}</th>
                <th className="r" style={{ width: "14%" }}>{t("invoice.colSales")}</th>
                <th className="r" style={{ width: "14%" }}>{t("invoice.colGratuity")}</th>
                <th className="r" style={{ width: "19%" }}>{t("invoice.colDue")}</th>
                <th className="x" />
              </tr>
            </thead>
            <tbody>
              {inv.items.map((it, i) => (
                <tr key={i}>
                  <td><input value={it.date} onChange={e => setItem(i, { date: e.target.value })}
                    placeholder="6/3/26" aria-label={`${t("invoice.row")} ${i + 1} · ${t("invoice.colDate")}`} /></td>
                  <td><input value={it.description} onChange={e => setItem(i, { description: e.target.value })}
                    placeholder="60-min Prenatal Massage" aria-label={`${t("invoice.row")} ${i + 1} · ${t("invoice.colDescription")}`} /></td>
                  <td className="r"><input value={it.sales} onChange={e => setItem(i, { sales: e.target.value })}
                    placeholder="110" inputMode="decimal" aria-label={`${t("invoice.row")} ${i + 1} · ${t("invoice.colSales")}`} /></td>
                  <td className="r"><input value={it.gratuity} onChange={e => setItem(i, { gratuity: e.target.value })}
                    placeholder="20" inputMode="decimal" aria-label={`${t("invoice.row")} ${i + 1} · ${t("invoice.colGratuity")}`} /></td>
                  <td className="r due">{money(rowDue(it))}</td>
                  <td className="x">
                    <button type="button" className="inv-del" onClick={() => removeRow(i)}
                      title={t("invoice.removeLine")} aria-label={`${t("invoice.removeLine")} — ${t("invoice.row")} ${i + 1}`}
                      disabled={inv.items.length <= 1}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td />
                <td>{t("invoice.totals")}</td>
                <td className="r">{money(totals.sales)}</td>
                <td className="r">{money(totals.grat)}</td>
                <td className="r">{money(totals.due)}</td>
                <td className="x" />
              </tr>
            </tfoot>
          </table>

          <button type="button" className="inv-add" onClick={addRow}>{t("invoice.addLine")}</button>

          <div className="inv-due">
            <div className="inv-band">
              <span className="l">{t("invoice.amountDue").toUpperCase()}</span>
              <span className="a">{money(totals.due)}</span>
            </div>
          </div>

          <div className="inv-foot">
            <h4>How this is calculated</h4>
            <p>
              Amount Due is calculated as sales income plus gratuities collected on Jane&apos;s behalf.
              Calculation: {money(totals.sales)} sales + {money(totals.grat)} gratuity = <b>{money(totals.due)}</b>.
            </p>
            <textarea value={inv.notes} onChange={e => patch({ notes: e.target.value })}
              aria-label={t("invoice.notes")}
              placeholder={t("invoice.notesPlaceholder")} />
            <p style={{ marginTop: 8 }}>
              Thank you! Please remit payment to {inv.from.name || "…"}. Questions: {inv.from.email || "…"}
              {inv.from.phone ? ` / ${inv.from.phone}` : ""}.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 flex-wrap">
        <span className="text-sm text-bark-light">{t("invoice.reviewThen")}</span>
        <Btn onClick={generate} disabled={totals.due === 0}>{t("invoice.generate")}</Btn>
      </div>
    </div>
  );
}
