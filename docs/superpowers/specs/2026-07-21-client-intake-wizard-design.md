# Client Intake & Consent Wizard — Design

**Date:** 2026-07-21
**Surface:** `client.janestherapy.com` — an in-studio tablet the client fills out on arrival.
**Client-facing language:** English only. Admin stays bilingual, matching the rest of `/admin`.

## Why

Clients sometimes arrive without disclosing conditions that make massage unsafe —
hypertension, diabetes, blood thinners, recent surgery. Today's `/intake` form asks about
health in free-text boxes and collects no consent and no signature, so there is nothing on
file showing what the client was told or what they claimed.

The goal is an evidence trail: the client affirmatively reviews a named list of conditions,
separately agrees to six consent clauses, and signs. If they conceal a condition, the record
shows a specific misrepresentation rather than an omission.

Honest scope: under California law a liability waiver does not cover gross negligence. This
reduces exposure; it is not immunity. The consent text below is a **draft** and must be
reviewed by a California attorney before real use — especially the arbitration clause.

## Deployment reality

The site is hosted on **Vercel**; Cloudflare only provides DNS and CDN for the zone. The
subdomain is therefore a second domain on the *same* Vercel project, wired with host-based
rules in `next.config.ts` — no new project, no migration.

- `client.janestherapy.com/` → rewrites to `/intake`
- `client.janestherapy.com/<anything else>` → redirects back to `/`
- `janestherapy.com/intake` → 301 to `https://client.janestherapy.com/`
- `/admin` stays on the apex domain only

## The six steps

Original spec had 13 pages; on-site that is 8–12 minutes of tapping. Six steps runs 4–5
minutes with no loss of legal weight, because each consent clause is still an independent,
individually timestamped checkbox.

1. **Welcome** — logo, one line, Start.
2. **Personal** — name, DOB, phone, email, address, occupation, emergency contact
   (name/relationship/phone), referral source.
3. **Health** — 17 named conditions as checkboxes, conditional detail fields, medications,
   allergies, physician, plus a required attestation that the list was reviewed honestly.
4. **Today's visit** — goals, pressure, pain level 0–10, body diagram (reuses existing
   `BodyDiagram.tsx`), areas to avoid, communication/music/temperature preferences.
5. **Agreements** — six clauses, six checkboxes, expandable full text.
6. **Signature** — canvas signature, printed name, submit.

## Evidence recorded per submission

| Stored | Why |
| --- | --- |
| Signature PNG + printed name | The client's own hand |
| Server-side timestamp | The tablet's clock is not trusted |
| Per-clause agreement timestamps | Proves six separate acts of assent |
| Consent version string | Old records keep pointing at the old version |
| **Full consent text snapshot** | The exact wording shown, frozen into the record |
| IP + user agent | Corroborates it was signed on the studio tablet |
| Raw condition checkboxes | "He checked 'no high blood pressure'" |

## Tablet (kiosk) rules

- Submit → thank-you → 5s → back to Welcome with all state destroyed.
- Leaving the wizard mid-flow or revisiting a submission requires a 4-digit staff PIN,
  verified server-side against `KIOSK_PIN` (never shipped in the bundle).
- `autoComplete="off"` throughout — browser autofill would surface the previous client's
  name and phone.
- Local draft per step, destroyed on submit or after 30 idle minutes.
- Operationally: add-to-home-screen, plus iPad Guided Access / Android screen pinning.

## Admin

The existing `客户登记 Intake` tab gains: signature and consent display in the detail view,
a health-alert dot in the list for flagged conditions, and a Print/Save-PDF button reusing
the same `window.print()` approach as `InvoiceTab`.

## Deferred

Returning-client short form. It needs a safe way to identify a client without letting anyone
type a phone number and read someone's medical history, so it gets its own design pass. Jane
would initiate it from admin rather than the client self-identifying.
