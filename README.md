This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Client intake, consent, and signature

`client.janestherapy.com` is the studio tablet's only address: a six-step wizard
(welcome → about you → health → session → agreements → signature) that a client
fills in on arrival. It is the same Vercel project as the marketing site; the
hosts are separated by the rules in `next.config.ts`:

- `client.janestherapy.com/` rewrites to `/intake`
- any other path on that host bounces back to `/`
- `janestherapy.com/intake` 301s to the subdomain
- the marketing chrome lives in the `app/(site)` route group, so the wizard has
  no header, no footer, and no link that could take a client out of the kiosk

To wire the subdomain: add `client.janestherapy.com` in Vercel → Project →
Domains, then add the CNAME Vercel gives you in Cloudflare DNS.

### What a signed submission stores

Beyond the answers: the signature PNG, the printed name, a server-stamped
submission time, a timestamp per consent clause, the consent version, a verbatim
snapshot of the clause text that was shown, and the requesting IP and user agent.
The snapshot is the point — editing `content/consents.json` later never changes
what an already-signed record says the client agreed to.

Jane reviews and prints these under admin → `客户登记 Intake`; the Print button
reuses the invoice tool's approach (render a sheet in a new window, then the
browser's own Save as PDF).

### Consent text

`content/consents.json` holds all six clauses plus a `version`. **The current
text is a draft and has not been reviewed by an attorney** — have a California
attorney review it, especially the `dispute` (arbitration) clause, before using
it with real clients. The cancellation, late-arrival, no-show, and refund numbers
in the `policies` clause are placeholders to confirm. After editing, bump
`version`; existing records keep their own snapshot.

### Tablet configuration

- `KIOSK_PIN` — 4-digit staff PIN, verified server-side by `/api/kiosk/pin`. It
  gates the "Staff" control that clears an abandoned form. With no value set the
  gate refuses everything rather than opening.
- On the tablet: open the URL and add it to the home screen for a full-screen,
  address-bar-free app, then lock it there with iPad Guided Access or Android
  screen pinning.
- The wizard clears itself five seconds after submitting, expires an abandoned
  draft after 30 idle minutes, and turns off autocomplete everywhere so the
  browser cannot suggest the previous client's name and phone number.

## Square availability calendar

`/availability` shows a read-only, day-level heatmap of the Square Appointments
calendar (next 4 weeks), regenerated every 30 minutes. Configuration
(server-side env vars, in Vercel and `.env.local`):

- `SQUARE_ACCESS_TOKEN` — access token from a Square Developer application
  (developer.squareup.com → your app → Credentials → Production Access Token)
- `SQUARE_LOCATION_ID` — `L148MHX709ZSA`
- `SQUARE_ENV` — `production` (anything else targets the Square sandbox)
- `SQUARE_MOCK=1` — local development only: renders fake data without credentials

Unset/invalid credentials degrade gracefully: the page hides the calendar and
keeps the Book Now button.
