# Custom Booking Flow via Square Bookings API — Design

**Date:** 2026-07-18
**Status:** Approved by Bo (design conversation, 2026-07-18)

## Goal

Replace the outbound link to the Square-hosted booking page
(`book.squareup.com/appointments/329wktefrjoh21/location/L148MHX709ZSA/services`)
with a fully in-site booking flow at `/book`, built on the Square Bookings API.
Bookings land in the existing Square Appointments calendar; Square continues to
send confirmation notifications.

**Cost constraint:** must stay on the free Square Appointments plan. Buyer-level
bookings via API are supported on the free plan; API calls themselves are free.
No payment is collected at booking time, so no processing fees are involved.

## Scope

**In scope (v1):**
- `/book` page with a four-step wizard: service mode → service → date/time → contact info
- Both service modes: in-studio and mobile (customer location)
- Mobile bookings collect the customer's address and show the travel-fee rules
  ($50 flat, $25 for sessions of 2 hours or longer) — sourced from
  `content/serviceModes.json`
- Server-side route handlers proxying Square Catalog / Bookings / Customers APIs
- Repoint all existing "Book Now" links to `/book`

**Out of scope (v1):**
- Online payment or deposits (clients pay after the session, as today)
- Self-service reschedule/cancel (handled via phone/SMS as today)
- Staff selection (Jane is the only provider; the server binds the sole bookable
  team member automatically)
- Any change to how the travel fee is charged in Square at checkout
  ($50 service + manual −$25 discount stays as is)

## Architecture

### Frontend

`app/book/page.tsx` — a single-page, client-side wizard with four steps:

1. **Mode** — In studio / Mobile. Copy reuses `content/serviceModes.json`
   (descriptions, service-area city list, travel-fee note).
2. **Service** — list fetched live from Square Catalog (name, duration, price),
   grouped by category. No duplicate service definitions kept in the repo.
3. **Time** — date picker + available slots for the selected day, from Square
   availability search (next 30 days).
4. **Details** — name, phone, email, optional note; mobile bookings additionally
   require an address (city constrained to the service-area list). Submit →
   success screen with booking details and a note that Square will send a
   confirmation.

Styling follows the existing site (Tailwind v4, existing component idioms).

### Backend (Next.js route handlers, following `app/api/intake` patterns)

- `GET /api/booking/services` — Square Catalog list (appointments services),
  returns service-variation id, name, duration, price. Cached ~10 minutes.
- `GET /api/booking/availability?serviceVariationId=…&date=…` — Square
  `SearchAvailability` for that service/day.
- `POST /api/booking` — find-or-create the Square customer by email/phone, then
  `CreateBooking` with the chosen slot. Mobile bookings use
  `location_type: CUSTOMER_LOCATION` plus the address; if that proves
  unavailable on the free plan, fall back to recording the address in the
  booking note.

Square credentials live only in server-side env vars:
`SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID` (`L148MHX709ZSA`), `SQUARE_ENV`
(`sandbox` | `production`). Uses the official `square` npm SDK. The bookable
team member is resolved server-side (`ListTeamMemberBookingProfiles`, first
bookable member) and cached alongside the services list.

## Error handling

- Square API failure → retry button plus a fallback link to the old
  Square-hosted booking page (kept in `serviceModes.json`).
- Slot taken between selection and submit (CreateBooking conflict) → message to
  pick a new time; slots for that day are refreshed.
- Validation: name, phone, and email required; address required for mobile.

## Risks & mitigations

- **Buyer-level vs seller-level classification.** Square determines the level
  by OAuth scope. A full-permission personal access token might be classified
  seller-level, which the free plan rejects for writes. Mitigation: the first
  implementation step is a spike — verify `CreateBooking` in sandbox and with
  one real production booking. If rejected, authorize the app to the account
  via OAuth with buyer-level scopes only (still free).
- **This repo's Next.js is a custom fork** (per `AGENTS.md`): read
  `node_modules/next/dist/docs/` before writing any code; route handler and
  caching conventions may differ from upstream.

## Testing

- Unit tests for the three route handlers with mocked Square responses, in the
  existing `tests/` directory and following its conventions.
- Pre-launch: one real production booking created and then cancelled, verifying
  calendar entry, confirmation notification, and address visibility end to end.

## Operational prerequisites (Bo)

1. Create an application in the Square Developer Dashboard (developer.squareup.com),
   grab the production access token (step-by-step instructions will be provided
   during implementation).
2. Add the env vars to Vercel (and `.env.local` for local dev).
