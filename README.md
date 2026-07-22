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

## Admin login

One password, no username — there is one person behind the door, so a username
was a field to fill in that proved nothing. Configure it as a scrypt hash:

```bash
node scripts/admin-hash.js 'your passphrase'   # prints ADMIN_PASSWORD_HASH=…
```

Put the printed line in `.env.local` and in the hosting environment variables,
then delete `ADMIN_USERS`, `ADMIN_USERNAME` and `ADMIN_PASSWORD` — those are
still accepted (any password they hold logs in, username ignored) purely so an
existing deployment keeps working until the hash is set.

Since the password is the entire credential, use a long one, and a wrong attempt
deliberately takes about a second to answer — with scrypt on top, that holds an
online guesser to roughly one try per second.

## Where editable content lives

Announcement, hours, services, add-ons, and blog posts are edited in `/admin` and
stored in the **`janestherapy-intake` Vercel Blob store** under `content/`. The
files in this repo's `content/` folder are the defaults they were seeded from and
the fallback whenever the store has nothing to say — local development, a fresh
store, or a store that refuses the request. A failing store degrades to those
files; it never takes the build down.

This replaced a route that committed to GitHub with a personal access token.
The token expired after 67 days and every content tab went silently blank. Blob's
credential is injected and rotated by Vercel, so nothing here expires.

Two details that are easy to get wrong and are covered by
`tests/content-store.test.js`:

- reads pass `useCache: false`, because Blob serves its CDN cache by default and
  would hand a just-saved page its previous wording
- writes pass `allowOverwrite: true`, because Blob rejects a repeat write to the
  same pathname and an editor's second save is exactly that

Saving calls `revalidatePath("/", "layout")`, so an edit reaches the site on the
next visit rather than waiting for a rebuild. The version being replaced is kept
under `content-history/<name>.<timestamp>` — the rollback that git commits used
to provide. There is no UI for it; restore with the Blob CLI or SDK.

`scripts/seed-content-blob.mjs` copies the repo's `content/` into the store. It
is idempotent and only needed when starting a new store.

`content/reviews.json` and `content/serviceModes.json` are not editable in the
admin, so they stay plain repo files and are read from disk.

## Client intake, consent, and signature

`/intake` is a six-step wizard (welcome → about you → health → session →
agreements → signature) that a client fills in on the studio tablet on arrival.

The marketing chrome lives in the `app/(site)` route group, so the wizard renders
with no header, no footer, and no Book Now link — nothing a client could tap to
leave the form and end up in Square. The page is `noindex` and `/intake` is
disallowed in `robots.ts`.

### What a signed submission stores

Beyond the answers: the signature PNG, the printed name, a server-stamped
submission time, a timestamp per consent clause, the consent version, a verbatim
snapshot of the clause text that was shown, and the requesting IP and user agent.
The snapshot is the point — editing `content/consents.json` later never changes
what an already-signed record says the client agreed to.

Jane reviews and prints these under admin → `客户登记 Intake`; the Print button
reuses the invoice tool's approach (render a sheet in a new window, then the
browser's own Save as PDF).

### Where records live

Production writes to the **`janestherapy-intake` Vercel Blob store** (private
access), connected to the project so `BLOB_READ_WRITE_TOKEN` is injected
automatically. Nothing to renew, nothing that expires.

Local development writes plain JSON to `data/intakes/` (gitignored) — keeping
test submissions out of the real store. `.env.local` carries a commented-out
`BLOB_READ_WRITE_TOKEN`; uncomment it only to inspect production data locally.

There is no filesystem fallback in production: the deployed disk is read-only,
so a missing token throws with its own name in the message rather than failing
at the last step of a signed form.

### Consent text

`content/consents.json` holds all six clauses plus a `version`. **The current
text is a draft and has not been reviewed by an attorney** — have a California
attorney review it, especially the `dispute` (arbitration) clause, before using
it with real clients. The cancellation, late-arrival, no-show, and refund numbers
in the `policies` clause are placeholders to confirm. After editing, bump
`version`; existing records keep their own snapshot.

### Tablet configuration

- A quiet "Start over" link clears the form and returns to the welcome screen —
  for the client who changes their mind and for Jane when someone walked away
  mid-form. It asks first if anything was typed. There is no PIN on it: it only
  destroys, never reveals, and gating it made Jane type a code to clean up after
  a client who had already left.
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
