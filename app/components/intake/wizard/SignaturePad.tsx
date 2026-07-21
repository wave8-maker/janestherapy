"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Finger-drawn signature on a canvas, exported as a PNG data URL.
 *
 * Deliberately dependency-free: the whole job is pointer events plus
 * `toDataURL`, and a library would only add bundle weight to the one page a
 * client uses on a tablet.
 */
export default function SignaturePad({
  value,
  onChange,
}: {
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(Boolean(value));

  /** Size the backing store to the device pixel ratio so strokes aren't blurry. */
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#2c2018";
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  function pointIn(e: React.PointerEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    canvasRef.current!.setPointerCapture(e.pointerId);
    drawing.current = true;
    const { x, y } = pointIn(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e: React.PointerEvent) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pointIn(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasInk(true);
  }

  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (!canvas || !hasInk) return;
    onChange(canvas.toDataURL("image/png"));
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    onChange("");
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-brand-light bg-white">
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          onPointerCancel={end}
          className="block h-44 w-full touch-none"
          aria-label="Signature area — sign with your finger"
        />
        {!hasInk && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[15px] text-bark-light/50">
            Sign here with your finger
          </span>
        )}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 bottom-9 border-b border-brand-light"
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-bark-light">
          {hasInk ? "Signature captured." : "Your signature is required to submit."}
        </p>
        <button
          type="button"
          onClick={clear}
          className="rounded-full border border-brand-light px-4 py-2 text-sm font-semibold text-bark-light transition-colors hover:border-brand/50 hover:text-bark"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
