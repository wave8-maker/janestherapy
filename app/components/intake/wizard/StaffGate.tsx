"use client";

import { useState } from "react";

/**
 * Staff-only escape hatch. A client should not be able to abandon the form
 * halfway and start browsing, and should not be able to wipe someone else's
 * in-progress answers by accident, so both actions sit behind a PIN that is
 * verified on the server (never shipped in the page bundle).
 */
export default function StaffGate({
  onClose,
  onStartOver,
}: {
  onClose: () => void;
  onStartOver: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setError("");
    try {
      const res = await fetch("/api/kiosk/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        setUnlocked(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "That PIN didn't match. Try again.");
        setPin("");
      }
    } catch {
      setError("Couldn't reach the server. Check the connection and try again.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-bark/40 p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Staff access"
    >
      <div className="w-full max-w-sm rounded-2xl border border-brand-light bg-white p-6 shadow-xl">
        {unlocked ? (
          <>
            <h2 className="font-display text-xl text-bark">Staff options</h2>
            <p className="mt-1 text-sm text-bark-light">
              Starting over erases everything typed so far.
            </p>
            <div className="mt-5 space-y-3">
              <button type="button" onClick={onStartOver} className="btn btn-primary w-full py-3.5">
                Start over with a blank form
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary w-full py-3.5"
              >
                Back to the form
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={submit}>
            <h2 className="font-display text-xl text-bark">Staff access</h2>
            <p className="mt-1 text-sm text-bark-light">Enter the studio PIN.</p>
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
              className="mt-4 w-full rounded-xl border border-brand-light bg-cream/60 px-4 py-3.5 text-center text-2xl tracking-[0.4em] text-bark focus:border-sage focus:bg-white focus:outline-none focus:ring-[3px] focus:ring-sage/20"
              aria-label="Studio PIN"
            />
            {error && (
              <p role="alert" className="mt-3 text-sm text-[#9c3f24]">
                {error}
              </p>
            )}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary flex-1 py-3.5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={checking || pin.length < 4}
                className="btn btn-primary flex-1 py-3.5 disabled:opacity-50"
              >
                {checking ? "Checking…" : "Unlock"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
