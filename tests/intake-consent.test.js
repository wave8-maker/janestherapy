const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const consents = JSON.parse(read("content/consents.json"));
const intakeRoute = read("app/api/intake/route.ts");
const storage = read("app/lib/intake-storage.ts");
const wizard = read("app/components/intake/wizard/IntakeWizard.tsx");
const stepConsents = read("app/components/intake/wizard/StepConsents.tsx");
const fields = read("app/components/intake/wizard/fields.tsx");
const types = read("app/lib/intake-types.ts");
const printRecord = read("app/admin/intakePrint.ts");
const siteLayout = read("app/(site)/layout.tsx");
const intakeLayout = read("app/intake/layout.tsx");

// ── the consent bundle ────────────────────────────────────────────────────────
// These clauses are the point of the whole flow; losing one silently would gut it.
const keys = consents.items.map((i) => i.key);
assert.deepStrictEqual(
  keys,
  ["treatment", "health", "boundaries", "policies", "privacy", "dispute"],
  "all six consent clauses must be present, in order"
);
assert.ok(consents.version, "the consent bundle must carry a version string");
for (const item of consents.items) {
  assert.ok(item.title && item.summary && item.acknowledgement, `${item.key} needs title, summary, acknowledgement`);
  assert.ok(Array.isArray(item.body) && item.body.length > 0, `${item.key} needs body text`);
}
// The health clause is what turns a concealed condition into a provable misstatement.
const healthBody = consents.items.find((i) => i.key === "health").body.join(" ");
for (const condition of ["high or low blood pressure", "diabetes", "heart disease", "pregnancy", "blood thinners"]) {
  assert.ok(
    healthBody.toLowerCase().includes(condition),
    `health disclosure must name "${condition}" explicitly`
  );
}

// ── named conditions, not a free-text box ─────────────────────────────────────
for (const condition of ["High Blood Pressure", "Diabetes", "Heart Disease", "Blood Thinners", "Pregnancy"]) {
  assert.ok(types.includes(condition), `HEALTH_CONDITIONS must list "${condition}"`);
}
assert.match(types, /ALERT_CONDITIONS/, "conditions needing a heads-up should be flagged for admin");

// ── the server, not the tablet, decides what was signed ───────────────────────
assert.match(intakeRoute, /consentKeys\.filter\(\(key\) => !data\.consents\?\.\[key\]\)/, "every clause must be required server-side");
assert.match(intakeRoute, /signatureDataUrl\?\.startsWith\("data:image\/png"\)/, "a signature is required server-side");
assert.match(intakeRoute, /consentSnapshot: bundle\.items/, "the clauses shown must be frozen into the record");
assert.match(intakeRoute, /consentVersion: bundle\.version/, "the record must name the version it was signed under");
assert.match(intakeRoute, /x-forwarded-for/, "the record should capture the requesting IP");
assert.match(storage, /submittedAt: new Date\(\)\.toISOString\(\)/, "the submission time must be stamped by the server");

// ── evidence survives a later edit of consents.json ───────────────────────────
assert.match(printRecord, /s\.consentSnapshot/, "the printout must use the stored snapshot, not today's text");
assert.doesNotMatch(printRecord, /getConsentBundle/, "the printout must not read live consent text");
assert.match(types, /normalizeSubmission/, "records written before signatures existed must still load");

// ── kiosk hygiene ─────────────────────────────────────────────────────────────
assert.match(fields, /autoComplete="off"/, "form fields must not offer the previous client's answers");
assert.match(wizard, /localStorage\.removeItem\(DRAFT_KEY\)/, "the draft must be destroyed on submit and on reset");
assert.match(wizard, /DRAFT_TTL_MS = 30 \* 60 \* 1000/, "an abandoned draft must expire");
assert.match(wizard, /setTimeout\(reset, RESET_DELAY_MS\)/, "the thank-you screen must reset the tablet itself");
assert.match(stepConsents, /new Date\(\)\.toISOString\(\)/, "each clause records when it was ticked");

// ── the wizard has no way out ─────────────────────────────────────────────────
assert.match(siteLayout, /book\.squareup\.com/, "the booking link belongs to the marketing chrome");
assert.doesNotMatch(intakeLayout, /<header|<nav|Link/, "the intake shell must not render navigation");

console.log("intake consent and kiosk checks passed");
