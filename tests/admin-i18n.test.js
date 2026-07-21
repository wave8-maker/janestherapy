const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const i18n = read("app/admin/i18n.tsx");
const adminPage = read("app/admin/page.tsx");
const invoiceTab = read("app/admin/InvoiceTab.tsx");
const intakeTab = read("app/admin/IntakeTab.tsx");
const richEditor = read("app/admin/RichEditor.tsx");
const intakePrint = read("app/admin/intakePrint.ts");

const CJK = /[一-鿿]/;

// ── every entry carries both languages ────────────────────────────────────────
const entries = [...i18n.matchAll(/^\s{2}"([\w.]+)":\s*\[([\s\S]*?)\],$/gm)];
assert.ok(entries.length > 100, `expected a full dictionary, found ${entries.length} entries`);
for (const [, key, body] of entries) {
  const values = [...body.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
  assert.strictEqual(values.length, 2, `${key} must have exactly [中文, English]`);
  assert.ok(values[0].trim(), `${key} is missing the Chinese string`);
  assert.ok(values[1].trim(), `${key} is missing the English string`);
  assert.doesNotMatch(values[1], CJK, `${key}: the English string still contains Chinese`);
}

// ── one language on screen at a time ──────────────────────────────────────────
// The switcher's own buttons stay 中文 / English in both modes — that is how a
// language picker is supposed to read — so they are the only allowed exception.
for (const [name, source] of [
  ["InvoiceTab", invoiceTab],
  ["IntakeTab", intakeTab],
  ["RichEditor", richEditor],
]) {
  assert.doesNotMatch(source, CJK, `${name} should take its wording from the dictionary`);
}
const strayChinese = adminPage
  .split("\n")
  .filter((line) => CJK.test(line) && !line.includes('"zh"'));
assert.deepStrictEqual(strayChinese, [], "page.tsx should only keep Chinese in the language switcher");

// ── the toggle is wired up ────────────────────────────────────────────────────
assert.match(adminPage, /<AdminLangProvider>/, "the admin tree must provide the language");
assert.match(adminPage, /setLang\(option\.value\)/, "the sidebar must switch language");
assert.match(i18n, /localStorage\.setItem\(STORAGE_KEY/, "the choice must survive a reload");

// ── documents that leave the studio stay English ──────────────────────────────
assert.doesNotMatch(intakePrint, CJK, "the printed intake record goes to insurers and attorneys");
const printedInvoice = invoiceTab.slice(
  invoiceTab.indexOf("function buildInvoiceHTML"),
  invoiceTab.indexOf("// ── main component")
);
assert.doesNotMatch(printedInvoice, CJK, "the printed invoice goes to the studio being billed");
assert.doesNotMatch(printedInvoice, /\bt\(/, "the printed invoice must not depend on the UI language");

console.log("admin i18n checks passed");
