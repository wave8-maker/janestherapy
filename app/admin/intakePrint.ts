import type { IntakeSubmission } from "@/app/lib/intake-types";
import { bodyDiagramSvg, hasBodyMarkers } from "@/app/lib/body-diagram";

/**
 * Builds the printable copy of a signed intake — the document Jane hands to an
 * insurer or an attorney. It deliberately reproduces the consent text that was
 * stored with the submission rather than today's `content/consents.json`, so the
 * printout always shows what this client actually agreed to.
 *
 * Same delivery route as the invoice: render into a new window and let the
 * browser's own Save-as-PDF do the work, so no PDF library is needed.
 */
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function row(label: string, value: string | boolean | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const display = typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
  return `<tr><th>${esc(label)}</th><td>${esc(display).replace(/\n/g, "<br>")}</td></tr>`;
}

function stamp(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export function buildIntakeHTML(s: IntakeSubmission): string {
  const heard = [...s.hearAboutUs, s.hearAboutUsOther ? `Other: ${s.hearAboutUsOther}` : ""]
    .filter(Boolean)
    .join(", ");
  const emergency = [s.emergencyContact.name, s.emergencyContact.relationship, s.emergencyContact.phone]
    .filter(Boolean)
    .join(" · ");
  const conditions = [...s.conditions, s.conditionsOther ? `Other: ${s.conditionsOther}` : ""]
    .filter(Boolean)
    .join(", ");
  const goals = [...s.goals, s.goalsOther ? `Other: ${s.goalsOther}` : ""].filter(Boolean).join(", ");

  const consentBlocks = s.consentSnapshot
    .map((item) => {
      const at = s.consents[item.key];
      return `<section class="clause">
        <h3>${esc(item.title)}</h3>
        ${item.body.map((p) => `<p>${esc(p)}</p>`).join("")}
        <p class="agreed">${at ? "☑" : "☐"} ${esc(item.acknowledgement)}${
          at ? ` — agreed ${esc(stamp(at))}` : " — NOT AGREED"
        }</p>
      </section>`;
    })
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><title>Intake — ${esc(s.name)}</title>
<style>
  :root{--brand:#a87c5f;--brand-dark:#855c40;--brand-light:#efe5d9;--cream:#faf6f0;
        --bark:#2c2018;--bark-light:#4e3d2e;--line:#c9b69e;--sage:#5c7059;}
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;}
  body{font-family:Helvetica,Arial,sans-serif;color:var(--bark);font-size:12.5px;line-height:1.55;
       -webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .sheet{max-width:760px;margin:0 auto;padding:40px 44px;}
  .top{display:flex;justify-content:space-between;align-items:flex-start;}
  .biz{font-size:22px;font-weight:700;}
  .biz-sub{font-size:11.5px;color:var(--bark-light);margin-top:3px;}
  .word{font-size:17px;font-weight:700;color:var(--brand);letter-spacing:1px;text-align:right;}
  .word small{display:block;font-size:11px;font-weight:400;color:var(--bark-light);letter-spacing:0;}
  .rule{height:2px;background:var(--brand);margin:13px 0 22px;}
  h2{font-size:12px;letter-spacing:.8px;color:var(--brand-dark);text-transform:uppercase;
     margin:26px 0 8px;padding-bottom:4px;border-bottom:1px solid var(--line);}
  table.kv{width:100%;border-collapse:collapse;}
  table.kv th{width:33%;text-align:left;font-weight:700;color:var(--bark-light);
     padding:5px 10px 5px 0;vertical-align:top;font-size:12px;}
  table.kv td{padding:5px 0;vertical-align:top;}
  table.kv tr:not(:last-child) th,table.kv tr:not(:last-child) td{border-bottom:1px solid #e8ddcd;}
  .alert{background:var(--brand-light);border-left:3px solid var(--brand);padding:9px 12px;margin-top:8px;}
  .alert b{color:var(--brand-dark);}
  .clause{margin-top:14px;page-break-inside:avoid;}
  .clause h3{font-size:13px;margin:0 0 5px;}
  .clause p{margin:0 0 5px;color:var(--bark-light);}
  .clause .agreed{margin-top:7px;padding:6px 9px;background:var(--cream);border:1px solid var(--line);
     color:var(--bark);font-weight:700;}
  .figures{display:flex;gap:36px;margin-top:6px;page-break-inside:avoid;}
  .figures svg{width:150px;height:auto;}
  .sig{display:flex;gap:26px;align-items:flex-end;margin-top:14px;}
  .sig img{max-height:110px;max-width:330px;border-bottom:1px solid var(--bark);}
  .sig .who{font-size:12px;color:var(--bark-light);}
  .sig .who b{display:block;font-size:14px;color:var(--bark);}
  .evidence{margin-top:22px;background:var(--cream);border:1px solid var(--line);padding:11px 14px;
     font-size:11px;color:var(--bark-light);}
  .evidence b{color:var(--bark);}
  @media print{.sheet{padding:0;} @page{margin:14mm;}}
</style></head>
<body><div class="sheet">
  <div class="top">
    <div>
      <div class="biz">Jane's Therapy</div>
      <div class="biz-sub">Client Intake, Health Disclosure &amp; Consent</div>
    </div>
    <div class="word">SIGNED RECORD
      <small>Submitted ${esc(stamp(s.submittedAt))}</small>
      <small>Record ${esc(s.id)}</small>
    </div>
  </div>
  <div class="rule"></div>

  <h2>Client</h2>
  <table class="kv">
    ${row("Name", s.name)}
    ${row("Date on form", s.date)}
    ${row("Phone", s.phone)}
    ${row("Email", s.email)}
    ${row("Address", s.address)}
    ${row("Date of birth", s.birthday)}
    ${row("Occupation", s.occupation)}
    ${row("Emergency contact", emergency)}
    ${row("Referred by", s.referredBy)}
    ${row("Heard about us", heard)}
  </table>

  <h2>Health disclosure</h2>
  <table class="kv">
    ${row("Conditions reported", conditions || "None checked")}
    ${row("Injuries", s.hasInjuries)}
    ${row("Injury details", s.injuryDetails)}
    ${row("Surgeries", s.hasSurgeries)}
    ${row("Surgery details", s.surgeryDetails)}
    ${row("Pregnant", s.isPregnant)}
    ${row("Pregnancy details", s.pregnancyDetails)}
    ${row("Other health notes", s.medicalConditions)}
    ${/* legacy — the form stopped asking these, older records still carry them */ ""}
    ${row("Medications", s.medications)}
    ${row("Allergies", s.allergies)}
    ${row("Primary physician", s.physician)}
  </table>
  <div class="alert">
    <b>${s.healthAttested ? "☑" : "☐"} Client attested:</b> "I have reviewed the list above and
    disclosed every condition that applies to me. The health information I have given is complete
    and accurate."
  </div>

  <h2>Session</h2>
  <table class="kv">
    ${row("Goals", goals)}
    ${row("Preferred pressure", s.pressure)}
    ${row("Pain level", s.painLevel === null ? "" : `${s.painLevel} / 10`)}
    ${row("Communication", s.sessionPreference)}
    ${row("Areas to avoid", s.areasToAvoid)}
    ${/* legacy — dropped from the form, still printed for records that have them */ ""}
    ${row("Service", s.service)}
    ${row("Duration", s.serviceDuration ? `${s.serviceDuration} min` : "")}
    ${row("Focus preference", s.bodyworkPreference)}
    ${row("Music", s.musicPreference)}
    ${row("Room temperature", s.roomTemperature)}
    ${row("Enhancements", s.enhancements.join(", "))}
  </table>

  ${
    hasBodyMarkers(s.painMarkersFront, s.painMarkersBack)
      ? `<h2>Marked discomfort</h2>
  <div class="figures">
    ${bodyDiagramSvg(s.painMarkersFront ?? [], "Front")}
    ${bodyDiagramSvg(s.painMarkersBack ?? [], "Back")}
  </div>`
      : ""
  }

  <h2>Agreements — version ${esc(s.consentVersion || "n/a")}</h2>
  ${consentBlocks || "<p>No consent record stored with this submission.</p>"}

  <h2>Signature</h2>
  <div class="sig">
    ${s.signatureDataUrl ? `<img src="${s.signatureDataUrl}" alt="Client signature">` : "<span>No signature on file.</span>"}
    <div class="who">
      <b>${esc(s.printedName || s.name)}</b>
      Signed ${esc(stamp(s.submittedAt))}
    </div>
  </div>

  <div class="evidence">
    <b>Record details.</b> Submitted ${esc(stamp(s.submittedAt))} (server time) ·
    Terms version ${esc(s.consentVersion || "n/a")} ·
    IP ${esc(s.meta.ip || "not recorded")} ·
    Device ${esc(s.meta.userAgent || "not recorded")}
  </div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print();},400);};</script>
</body></html>`;
}
