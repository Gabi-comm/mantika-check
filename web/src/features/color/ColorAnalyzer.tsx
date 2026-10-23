"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Camera, RotateCw, X, FlaskConical, Trash2, Save } from "lucide-react";
import { Button, Panel, PanelHead, PageHeader, Tag } from "@/components/ui";
import { InlineNote } from "@/components/vendor/status";
import { fmtDateTime } from "@/lib/format";
import { RoiOverlay, DEFAULT_ROI, type Roi } from "./RoiOverlay";
import { loadImage, rotatedCanvas, validateImageFile } from "./image";
import { REFERENCE_COLORS, averageColorFromCanvas, labDistance, nearestReference, rgbToHex, rgbToHsv, rgbToLab, type LAB, type HSV, type RGB } from "./colorMath";
import { loadColorHistory, removeColorEntry, saveColorEntry, type ColorEntry } from "./history";

type Result = { rgb: RGB; hsv: HSV; lab: LAB; hex: string; nearest: string; crop: string };

export function ColorAnalyzer() {
  const [src, setSrc] = useState<string | null>(null);
  const [display, setDisplay] = useState<{ url: string; w: number; h: number } | null>(null);
  const [rotation, setRotation] = useState(0);
  const [roi, setRoi] = useState<Roi>(DEFAULT_ROI);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [label, setLabel] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [history, setHistory] = useState<ColorEntry[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after mount
    setHistory(loadColorHistory());
  }, []);

  useEffect(() => () => void (src && URL.revokeObjectURL(src)), [src]);

  // Draw the rotated bitmap itself so the region overlay matches the real pixel geometry.
  useEffect(() => {
    if (!src) return;
    let live = true;
    loadImage(src).then((img) => {
      if (!live) return;
      const c = rotatedCanvas(img, rotation);
      setDisplay({ url: c.toDataURL("image/jpeg", 0.9), w: c.width, h: c.height });
    });
    return () => {
      live = false;
    };
  }, [src, rotation]);

  function pick(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    const err = validateImageFile(f);
    if (err) return setError(err);
    setError(null);
    setResult(null);
    setRotation(0);
    setRoi(DEFAULT_ROI);
    setDisplay(null);
    setSrc(URL.createObjectURL(f));
  }

  async function measure() {
    if (!src) return;
    const img = await loadImage(src);
    const c = rotatedCanvas(img, rotation);
    const px = { x: (roi.x / 100) * c.width, y: (roi.y / 100) * c.height, w: (roi.w / 100) * c.width, h: (roi.h / 100) * c.height };
    const rgb = averageColorFromCanvas(c.getContext("2d")!, px.x, px.y, px.w, px.h);
    const crop = document.createElement("canvas");
    crop.width = Math.max(1, Math.round(px.w));
    crop.height = Math.max(1, Math.round(px.h));
    crop.getContext("2d")!.drawImage(c, -px.x, -px.y);
    setResult({ rgb, hsv: rgbToHsv(rgb), lab: rgbToLab(rgb), hex: rgbToHex(rgb), nearest: nearestReference(rgb).reference.label, crop: crop.toDataURL("image/jpeg", 0.9) });
    setSaved(null);
  }

  function save() {
    if (!result) return;
    const entry: ColorEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      label: label.trim() || "Untitled measurement",
      hex: result.hex,
      rgb: result.rgb,
      hsv: result.hsv,
      lab: result.lab,
      nearestReference: result.nearest,
    };
    setSaved(saveColorEntry(entry) ? "Measurement saved on this device." : "This could not be saved. Local storage is blocked or full.");
    setHistory(loadColorHistory());
  }

  const n = (v: number, d = 1) => v.toFixed(d);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <FlaskConical className="size-3.5" aria-hidden="true" /> Experimental tool
          </span>
        }
        title="Color Analyzer"
        lead="Measures the average color of a region you select in a photo and compares it with three printed reference swatches. Everything runs in your browser."
      />
      <InlineNote tone="warn">
        <b>Experimental and isolated.</b> Photo color is affected by lighting and camera settings. It is not an oil-quality or chemical measurement and is never used
        for the monitoring status.
      </InlineNote>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel aria-labelledby="img-h">
          <PanelHead
            id="img-h"
            title={src ? "Position the region" : "Choose a photo"}
            eyebrow="Step 1"
            action={
              src && (
                <div className="flex gap-1">
                  <Button variant="ghost" onClick={() => setRotation((r) => (r + 90) % 360)} aria-label="Rotate 90 degrees">
                    <RotateCw className="size-4" aria-hidden="true" /> Rotate
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSrc(null);
                      setDisplay(null);
                      setResult(null);
                    }}
                    aria-label="Remove photo"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              )
            }
          />
          <div className="p-5">
            {!src ? (
              <div
                className="dot-grid flex flex-col items-center justify-center gap-3 rounded-[var(--radius-m)] border-2 border-dashed border-line-strong px-6 py-14 text-center"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  pick(e.dataTransfer.files);
                }}
              >
                <p className="font-semibold text-ink">Drop a JPEG or PNG here</p>
                <p className="text-[0.88rem] text-gray">Up to 10 MB. The file never leaves this device.</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  <Button onClick={() => fileRef.current?.click()}>
                    <Upload className="size-4" aria-hidden="true" /> Upload photo
                  </Button>
                  <Button variant="secondary" onClick={() => camRef.current?.click()}>
                    <Camera className="size-4" aria-hidden="true" /> Use camera
                  </Button>
                </div>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="sr-only" aria-label="Choose an image file" onChange={(e) => pick(e.target.files)} />
                <input ref={camRef} type="file" accept="image/*" capture="environment" className="sr-only" aria-label="Take a photo" onChange={(e) => pick(e.target.files)} />
              </div>
            ) : display ? (
              <>
                <div className="relative mx-auto max-h-[60vh] w-fit overflow-hidden rounded-[var(--radius-s)] bg-ink">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local object URL rendered from canvas */}
                  <img src={display.url} alt="Your upload, rotated as shown" className="block max-h-[60vh] w-auto" width={display.w} height={display.h} />
                  <RoiOverlay roi={roi} onChange={setRoi} />
                </div>
                <p className="mt-3 text-[0.82rem] text-gray">
                  Region {Math.round((roi.w / 100) * display.w)} × {Math.round((roi.h / 100) * display.h)} px · drag, or focus the region and use arrow keys.
                </p>
                <Button size="lg" className="mt-3 w-full sm:w-auto" onClick={measure}>
                  Measure color
                </Button>
              </>
            ) : (
              <div className="skeleton h-64" />
            )}
            {error && (
              <div className="mt-3">
                <InlineNote tone="error">{error}</InlineNote>
              </div>
            )}
          </div>
        </Panel>

        <Panel aria-labelledby="res-h" aria-live="polite">
          <PanelHead id="res-h" title="Measurement" eyebrow="Step 2" action={<Tag tone="outline">Browser calculation</Tag>} />
          {result ? (
            <div className="space-y-5 p-5">
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- generated crop */}
                <img src={result.crop} alt="Measured region" className="size-16 rounded-[var(--radius-s)] border border-line object-cover" />
                <span className="size-16 rounded-[var(--radius-s)] border border-line" style={{ background: result.hex }} aria-hidden="true" />
                <div>
                  <p className="text-[0.78rem] text-gray">Nearest reference swatch</p>
                  <p className="font-display text-lg font-bold text-ink">{result.nearest}</p>
                  <p className="font-mono text-[0.8rem] text-gray">{result.hex.toUpperCase()}</p>
                </div>
              </div>
              <dl className="grid grid-cols-3 gap-2 font-mono text-[0.82rem] tabular">
                {[
                  ["RGB", `${n(result.rgb.r, 0)} ${n(result.rgb.g, 0)} ${n(result.rgb.b, 0)}`],
                  ["HSV", `${n(result.hsv.h, 0)}° ${n(result.hsv.s, 0)}% ${n(result.hsv.v, 0)}%`],
                  ["CIELAB", `${n(result.lab.l)} ${n(result.lab.a)} ${n(result.lab.b)}`],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-[var(--radius-s)] border border-line px-2.5 py-2">
                    <dt className="text-[0.7rem] text-gray">{k}</dt>
                    <dd className="text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
              <table className="w-full text-left text-[0.85rem]">
                <caption className="mb-1 text-left text-[0.78rem] text-gray">Distance to each reference (CIE76 ΔE, lower is closer)</caption>
                <tbody className="divide-y divide-line">
                  {REFERENCE_COLORS.map((r) => (
                    <tr key={r.id}>
                      <th scope="row" className="flex items-center gap-2 py-2 font-medium">
                        <span className="size-3 rounded-[2px]" style={{ background: r.hex }} aria-hidden="true" />
                        {r.label}
                      </th>
                      <td className="py-2 text-right font-mono tabular">{labDistance(result.lab, rgbToLab(r.rgb)).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label htmlFor="mlabel" className="sr-only">
                  Measurement label
                </label>
                <input id="mlabel" className="h-11 flex-1 rounded-[var(--radius-s)] border border-line-strong px-3" placeholder="Label (optional)" value={label} onChange={(e) => setLabel(e.target.value)} />
                <Button onClick={save}>
                  <Save className="size-4" aria-hidden="true" /> Save
                </Button>
              </div>
              {saved && <p className="text-[0.85rem] text-gray" role="status">{saved}</p>}
            </div>
          ) : (
            <p className="p-5 text-gray">Choose a photo and measure a region to see its color values here.</p>
          )}
        </Panel>
      </div>

      <Panel aria-labelledby="ch-h">
        <PanelHead id="ch-h" title="Saved measurements" eyebrow="This device" />
        {!history ? (
          <div className="skeleton m-5 h-12" />
        ) : history.length === 0 ? (
          <p className="p-5 text-gray">No saved measurements.</p>
        ) : (
          <ul className="divide-y divide-line">
            {history.map((h) => (
              <li key={h.id} className="flex items-center gap-3 px-5 py-3">
                <span className="size-9 shrink-0 rounded-[var(--radius-s)] border border-line" style={{ background: h.hex }} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{h.label}</p>
                  <p className="font-mono text-[0.75rem] text-gray">
                    {fmtDateTime(h.date)} · {h.hex.toUpperCase()} · {h.nearestReference}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  aria-label={`Delete ${h.label}`}
                  onClick={() => {
                    removeColorEntry(h.id);
                    setHistory(loadColorHistory());
                  }}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
