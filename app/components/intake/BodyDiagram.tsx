"use client";

import Image from "next/image";
import { useCallback, useRef } from "react";
import type { PainMarker } from "@/app/lib/intake-types";

interface BodyDiagramProps {
  markers: PainMarker[];
  onChange: (markers: PainMarker[]) => void;
}

export default function BodyDiagram({ markers, onChange }: BodyDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTap = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      onChange([...markers, { x, y }]);
    },
    [markers, onChange]
  );

  return (
    <div>
      <p className="text-sm text-bark-light mb-4">
        Tap on the body diagram to mark areas where you are experiencing pain or discomfort.
      </p>
      <div className="space-y-2">
        <div
          ref={containerRef}
          className="relative mx-auto w-full max-w-[280px] cursor-crosshair touch-none select-none"
          onPointerDown={handleTap}
        >
          <Image
            src="/intake/body-back.jpg"
            alt="Back body diagram"
            width={280}
            height={320}
            className="w-full h-auto pointer-events-none"
            draggable={false}
          />
          {markers.map((m, i) => (
            <span
              key={i}
              className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full bg-red-500/80 border-2 border-white shadow"
              style={{ left: `${m.x}%`, top: `${m.y}%` }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => onChange([])}
          className="text-sm text-bark-light hover:text-brand underline"
        >
          Clear marks
        </button>
      </div>
    </div>
  );
}
