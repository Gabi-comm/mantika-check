import { useRef, useState } from "react";

export type Roi = { x: number; y: number; w: number; h: number }; // percentages 0-100

type Props = {
  roi: Roi;
  onChange: (roi: Roi) => void;
};

const MIN_SIZE = 8;

export function RoiOverlay({ roi, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ mode: "move" | "resize"; startX: number; startY: number; roi: Roi } | null>(null);

  function startDrag(mode: "move" | "resize") {
    return (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDrag({ mode, startX: e.clientX, startY: e.clientY, roi });
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return;
    const rect = containerRef.current!.getBoundingClientRect();
    const dxPct = ((e.clientX - drag.startX) / rect.width) * 100;
    const dyPct = ((e.clientY - drag.startY) / rect.height) * 100;

    if (drag.mode === "move") {
      const x = clamp(drag.roi.x + dxPct, 0, 100 - drag.roi.w);
      const y = clamp(drag.roi.y + dyPct, 0, 100 - drag.roi.h);
      onChange({ ...drag.roi, x, y });
    } else {
      const w = clamp(drag.roi.w + dxPct, MIN_SIZE, 100 - drag.roi.x);
      const h = clamp(drag.roi.h + dyPct, MIN_SIZE, 100 - drag.roi.y);
      onChange({ ...drag.roi, w, h });
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const step = 2;
    const d: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const v = d[e.key];
    if (!v) return;
    e.preventDefault();
    if (e.shiftKey) {
      onChange({ ...roi, w: clamp(roi.w + v[0], MIN_SIZE, 100 - roi.x), h: clamp(roi.h + v[1], MIN_SIZE, 100 - roi.y) });
    } else {
      onChange({ ...roi, x: clamp(roi.x + v[0], 0, 100 - roi.w), y: clamp(roi.y + v[1], 0, 100 - roi.h) });
    }
  }

  function onPointerUp() {
    setDrag(null);
  }

  return (
    <div
      className="roi-stage"
      ref={containerRef}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        className="roi-box"
        role="group"
        tabIndex={0}
        aria-label="Region to measure. Drag to move, or use arrow keys; hold Shift with arrows to resize."
        style={{ left: `${roi.x}%`, top: `${roi.y}%`, width: `${roi.w}%`, height: `${roi.h}%` }}
        onPointerDown={startDrag("move")}
        onKeyDown={onKeyDown}
      >
        <span className="roi-c1" aria-hidden="true" />
        <span className="roi-c2" aria-hidden="true" />
        <span className="roi-label">Your region</span>
        <button
          type="button"
          className="roi-handle"
          aria-label="Resize region of interest"
          onPointerDown={startDrag("resize")}
        />
      </div>
    </div>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), Math.max(min, max));
}

export const DEFAULT_ROI: Roi = { x: 30, y: 30, w: 40, h: 25 };
