"use client";

// box for picking the area to measure
import { useRef, useState } from "react";

export type Roi = { x: number; y: number; w: number; h: number };
export const DEFAULT_ROI: Roi = { x: 30, y: 30, w: 40, h: 25 };
const MIN = 8;
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi));

export function RoiOverlay({ roi, onChange }: { roi: Roi; onChange: (r: Roi) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ mode: "move" | "resize"; x: number; y: number; roi: Roi } | null>(null);

  const start = (mode: "move" | "resize") => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ mode, x: e.clientX, y: e.clientY, roi });
  };
  const move = (e: React.PointerEvent) => {
    if (!drag || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const dx = ((e.clientX - drag.x) / r.width) * 100;
    const dy = ((e.clientY - drag.y) / r.height) * 100;
    if (drag.mode === "move") onChange({ ...drag.roi, x: clamp(drag.roi.x + dx, 0, 100 - drag.roi.w), y: clamp(drag.roi.y + dy, 0, 100 - drag.roi.h) });
    else onChange({ ...drag.roi, w: clamp(drag.roi.w + dx, MIN, 100 - drag.roi.x), h: clamp(drag.roi.h + dy, MIN, 100 - drag.roi.y) });
  };
  const key = (e: React.KeyboardEvent) => {
    const d: Record<string, [number, number]> = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] };
    const v = d[e.key];
    if (!v) return;
    e.preventDefault();
    if (e.shiftKey) onChange({ ...roi, w: clamp(roi.w + v[0], MIN, 100 - roi.x), h: clamp(roi.h + v[1], MIN, 100 - roi.y) });
    else onChange({ ...roi, x: clamp(roi.x + v[0], 0, 100 - roi.w), y: clamp(roi.y + v[1], 0, 100 - roi.h) });
  };

  return (
    <div ref={ref} className="absolute inset-0 touch-none" onPointerMove={move} onPointerUp={() => setDrag(null)} onPointerCancel={() => setDrag(null)}>
      <div
        role="group"
        tabIndex={0}
        aria-label="Measurement region. Drag to move, or use arrow keys; hold Shift with arrows to resize."
        className="absolute cursor-move border-2 border-white shadow-[0_0_0_9999px_rgba(11,61,46,0.45)] outline-offset-4"
        style={{ left: `${roi.x}%`, top: `${roi.y}%`, width: `${roi.w}%`, height: `${roi.h}%` }}
        onPointerDown={start("move")}
        onKeyDown={key}
      >
        <span className="absolute -top-6 left-0 rounded-[3px] bg-surface px-1.5 py-0.5 font-mono text-[0.68rem] uppercase tracking-wider text-heading">Region</span>
        <button
          type="button"
          aria-label="Resize region"
          onPointerDown={start("resize")}
          className="absolute -right-3 -bottom-3 size-7 cursor-nwse-resize rounded-full border-2 border-white bg-green"
        />
      </div>
    </div>
  );
}
