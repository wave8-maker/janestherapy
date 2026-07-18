import type { Metadata } from "next";
import Link from "next/link";
import {
  getAvailabilitySummary,
  BUSINESS_TIMEZONE,
  type AvailabilityDay,
  type DayState,
} from "../lib/square-availability";
import { getServiceModes } from "../lib/content";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Availability",
  description:
    "An at-a-glance look at Jane's approximate openings over the next four weeks. For exact times, use the booking page.",
  alternates: { canonical: "/availability" },
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATE_STYLES: Record<DayState, { cell: string; label: string; glyph: string }> = {
  open: { cell: "bg-sage/15 ring-1 ring-sage/40 text-sage-dark", label: "openings", glyph: "●" },
  few: { cell: "bg-sage/5 ring-1 ring-sage/25 text-sage-dark", label: "a few openings left", glyph: "◐" },
  unavailable: { cell: "bg-brand-light/40 text-bark-light/50", label: "unavailable", glyph: "" },
};

function weekdayIndex(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

function dayOfMonth(date: string): number {
  return Number(date.slice(8, 10));
}

function monthLabel(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
}

function formatUpdatedAt(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: BUSINESS_TIMEZONE,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function CalendarGrid({ days }: { days: AvailabilityDay[] }) {
  const leadingBlanks = weekdayIndex(days[0].date);
  return (
    <div>
      <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs uppercase tracking-widest text-bark-light">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <span key={`blank-${i}`} aria-hidden="true" />
        ))}
        {days.map((day) => {
          const style = STATE_STYLES[day.state];
          const showMonth = day === days[0] || dayOfMonth(day.date) === 1;
          return (
            <div
              key={day.date}
              aria-label={`${day.date}: ${style.label}`}
              className={`rounded-lg py-2.5 flex flex-col items-center gap-0.5 text-sm ${style.cell}`}
            >
              <span className="font-medium">
                {showMonth ? `${monthLabel(day.date)} ` : ""}
                {dayOfMonth(day.date)}
              </span>
              <span aria-hidden="true" className="text-[0.55rem] leading-none min-h-[0.55rem]">
                {style.glyph}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-5 text-xs text-bark-light">
        <span><span aria-hidden="true" className="text-sage-dark">●</span> Openings</span>
        <span><span aria-hidden="true" className="text-sage-dark">◐</span> A few left</span>
        <span><span aria-hidden="true" className="inline-block w-2.5 h-2.5 rounded-sm bg-brand-light align-middle" /> Unavailable</span>
      </div>
    </div>
  );
}

export default async function AvailabilityPage() {
  const summary = await getAvailabilitySummary();
  const { bookingUrl } = getServiceModes();

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <p className="eyebrow mb-3">Plan your visit</p>
      <h1 className="font-display text-4xl text-bark mb-4">Jane&apos;s availability</h1>
      <p className="text-bark-light leading-relaxed mb-8 max-w-prose">
        A rough look at the next four weeks — approximate only. Exact times, services, and
        booking live on the booking page.
      </p>

      {summary ? (
        <>
          <CalendarGrid days={summary.days} />
          <p className="text-xs text-bark-light mt-4">
            Based on {summary.baselineDurationMinutes}-minute sessions · Updated{" "}
            {formatUpdatedAt(summary.updatedAt)} · Approximate — see the booking page for
            exact times.
          </p>
        </>
      ) : (
        <p className="text-bark-light bg-brand-light/40 rounded-lg px-5 py-4">
          The live calendar is taking a break right now — the booking page below always has
          Jane&apos;s exact openings.
        </p>
      )}

      <div className="mt-10">
        <Link
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
        >
          Book Now
        </Link>
      </div>
    </div>
  );
}
