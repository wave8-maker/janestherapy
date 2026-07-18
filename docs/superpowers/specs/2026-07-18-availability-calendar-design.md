# Read-Only Availability Calendar — Design

**Date:** 2026-07-18
**Status:** Approved by Bo (design conversation, 2026-07-18)
**Supersedes:** the full custom booking flow
(`2026-07-18-square-bookings-custom-flow-design.md`) is **paused**; this is the
lightweight alternative. Booking itself stays on the Square-hosted page.

## Goal

A page on janestherapy.com showing an at-a-glance, day-level view of Jane's
availability for the next 4 weeks, sourced from the Square Appointments
calendar. It is explicitly approximate: a disclaimer points visitors to the
Square booking page for exact times, and a prominent Book Now button links
there. No booking, no payment, no customer data — read-only.

## Page: `/availability`

- Title plus one-line explanation ("Jane's approximate availability over the
  next 4 weeks").
- A 4-week calendar grid, one cell per day, three states:
  - **Open** (3+ bookable slots)
  - **Few left** (1–2 slots)
  - **Fully booked** (0 slots)
  - States are encoded with the site's eucalyptus/sage scale **plus a pattern
    or glyph** so they are distinguishable without color.
- Disclaimer near the calendar: "仅供参考 — for exact times, see the booking
  page", plus "Updated N minutes ago".
- Large Book Now button → the Square-hosted booking URL from
  `content/serviceModes.json`.
- A nav link to the page.
- Styling follows the existing site system (Tailwind v4, `app/globals.css`
  tokens, existing component idioms).

## Data: server-side loader (`app/lib/square-availability.ts`)

The page is a server component that calls the loader directly and is cached
with ISR (`export const revalidate = 1800`) — no separate API route is needed
because there is no client-side interactivity. (Revised at planning time from
the original `GET /api/availability` route-handler sketch: same behavior,
fewer moving parts.) The loader:

1. Resolve a **baseline service**: list appointments services from the Square
   Catalog, pick a 60-minute service variation (closest to 60 if none exact).
   Also resolve the bookable team member. Both cached.
2. Call Bookings `SearchAvailability` for the next 28 days (split into two
   ~14-day windows to stay well under the per-query range cap) for
   `SQUARE_LOCATION_ID`.
3. Reduce slots to per-day counts → per-day state (0 / 1–2 / 3+).
4. Returns `{ days: [{ date, state }], updatedAt, baselineDurationMinutes }`,
   or `null` on any failure. Page-level ISR (30 minutes) is the cache.

Env vars (server-only): `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`,
`SQUARE_ENV` (`sandbox` | `production`).

### Failure behavior

Any Square error, or missing env configuration, returns an empty-days
response. The page then hides the calendar entirely and shows only the intro
text and the Book Now button. The page must never show stale-looking errors or
fabricated availability.

## Rollout

1. Build the page against mock data locally (env unset → route handler serves
   nothing in production semantics; a dev-only mock flag feeds the UI during
   development).
2. Bo creates a Square Developer application and provides the access token
   (step-by-step instructions to be provided); env vars added to Vercel and
   `.env.local`.
3. Switch to live data, verify counts against the real Square calendar, ship.

## Notes & constraints

- Availability is duration-dependent; the page states the 60-minute baseline
  in small print.
- `SearchAvailability` read is buyer-level (`APPOINTMENTS_READ`) and works on
  the free Appointments plan; API calls are free.
- This repo's Next.js is a custom fork (per `AGENTS.md`): read
  `node_modules/next/dist/docs/` before writing code; route handler and
  caching conventions may differ from upstream.

## Testing

- Unit tests for the reduction logic (slots → day states) and the loader with
  mocked Square responses (injected fetch), in the existing `tests/`
  conventions.
- Pre-launch manual check: page states match the real Square calendar for a
  few spot-checked days; error path verified by unsetting the token locally.
