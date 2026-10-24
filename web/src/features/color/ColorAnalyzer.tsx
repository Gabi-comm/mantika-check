"use client";

// experimental: estimate oil colour from a photo
import { useEffect, useRef, useState } from "react";
import { Upload, Camera, RotateCw, X, FlaskConical, Trash2, Save } from "@/components/icons";
import { Button, Panel, PanelHead, PageHeader, Tag } from "@/components/ui";
import { InlineNote } from "@/components/vendor/status";
import { fmtDateTime } from "@/frontend/format";
import { RoiOverlay, DEFAULT_ROI, type Roi } from "./RoiOverlay";
import { cameraErrorMessage, loadImage, rotatedCanvas, validateImageFile } from "./image";
import { REFERENCE_COLORS, averageColorFromCanvas, labDistance, nearestReference, rgbToHex, rgbToHsv, rgbToLab, type LAB, type HSV, type RGB } from "./colorMath";
import { loadColorHistory, removeColorEntry, saveColorEntry, type ColorEntry } from "./history";

type Result = { rgb: RGB; hsv: HSV; lab: LAB; hex: string; nearest: string; crop: string };
type CameraStatus = "requesting" | "live" | "captured" | "error";

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
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("requesting");
  const [cameraMessage, setCameraMessage] = useState<string | null>(null);
  const [captured, setCaptured] = useState<{ file: File; url: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraRequestRef = useRef(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after mount
    setHistory(loadColorHistory());
  }, []);

  useEffect(() => () => void (src && URL.revokeObjectURL(src)), [src]);

  useEffect(() => () => void (captured && URL.revokeObjectURL(captured.url)), [captured]);

  useEffect(
    () => () => {
      cameraRequestRef.current += 1;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  useEffect(() => {
    if (!cameraOpen) return;
    function dismissCamera() {
      cameraRequestRef.current += 1;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraOpen(false);
      setCaptured(null);
      setCameraMessage(null);
    }
    function leaveCamera() {
      if (document.hidden) dismissCamera();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") dismissCamera();
    }
    document.addEventListener("visibilitychange", leaveCamera);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("visibilitychange", leaveCamera);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [cameraOpen]);

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

  function pick(f: File | null | undefined) {
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

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  function closeCamera() {
    cameraRequestRef.current += 1;
    stopCamera();
    setCameraOpen(false);
    setCaptured(null);
    setCameraMessage(null);
  }

  async function startCamera() {
    cameraRequestRef.current += 1;
    const request = cameraRequestRef.current;
    stopCamera();
    setCaptured(null);
    setCameraMessage(null);
    setCameraStatus("requesting");
    setCameraOpen(true);

    if (!window.isSecureContext) {
      setCameraStatus("error");
      setCameraMessage("Live camera access requires HTTPS. You can upload a photo instead.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("error");
      setCameraMessage("This browser does not support live camera access. You can upload a photo instead.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: "environment" } } });
      if (request !== cameraRequestRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      await new Promise(requestAnimationFrame);
      if (request !== cameraRequestRef.current) {
        stopCamera();
        return;
      }
      const video = videoRef.current;
      if (!video) throw new Error("Camera preview unavailable");
      video.srcObject = stream;
      await video.play();
      setCameraStatus("live");
    } catch (cameraError) {
      stopCamera();
      if (request !== cameraRequestRef.current) return;
      setCameraStatus("error");
      setCameraMessage(cameraErrorMessage(cameraError));
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) {
      setCameraMessage("The camera is still loading. Wait a moment and try again.");
      return;
    }
    const canvas = document.createElement("canvas");
    const request = cameraRequestRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (request !== cameraRequestRef.current) return;
        if (!blob) {
          setCameraMessage("The photo could not be captured. Please try again.");
          return;
        }
        const file = new File([blob], `mantika-camera-${Date.now()}.jpg`, { type: "image/jpeg" });
        const validationError = validateImageFile(file);
        if (validationError) {
          setCameraMessage(validationError);
          return;
        }
        stopCamera();
        setCaptured({ file, url: URL.createObjectURL(file) });
        setCameraStatus("captured");
        setCameraMessage(null);
      },
      "image/jpeg",
      0.9,
    );
  }

  function useCapturedPhoto() {
    if (!captured) return;
    const file = captured.file;
    closeCamera();
    pick(file);
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
                  pick(e.dataTransfer.files[0]);
                }}
              >
                <p className="font-semibold text-ink">Drop a JPEG or PNG here</p>
                <p className="text-[0.88rem] text-gray">Up to 10 MB. The file never leaves this device.</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  <Button onClick={() => fileRef.current?.click()}>
                    <Upload className="size-4" aria-hidden="true" /> Upload photo
                  </Button>
                  <Button variant="secondary" onClick={() => void startCamera()}>
                    <Camera className="size-4" aria-hidden="true" /> Use camera
                  </Button>
                </div>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="sr-only" aria-label="Choose an image file" onChange={(e) => pick(e.target.files?.[0])} />
                <input ref={camRef} type="file" accept="image/*" capture="environment" className="sr-only" aria-label="Take a photo" onChange={(e) => pick(e.target.files?.[0])} />
              </div>
            ) : display ? (
              <>
                <div className="relative mx-auto max-h-[60vh] w-fit overflow-hidden rounded-[var(--radius-s)] bg-night">
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

      {cameraOpen && (
        <div className="fixed inset-0 z-[80] grid place-items-end bg-black/60 p-0 sm:place-items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="camera-title">
          <div className="w-full max-w-2xl rounded-t-[var(--radius-l)] border border-line bg-surface p-4 shadow-card sm:rounded-[var(--radius-l)] sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Live camera</p>
                <h2 id="camera-title" className="font-display text-xl font-bold text-ink">Take a photo</h2>
              </div>
              <Button variant="ghost" className="min-h-12 min-w-12 px-0" onClick={closeCamera} aria-label="Close camera" autoFocus>
                <X className="size-5" aria-hidden="true" />
              </Button>
            </div>

            <div className="relative aspect-[3/4] max-h-[65vh] overflow-hidden rounded-[var(--radius-m)] bg-night sm:aspect-video">
              {captured ? (
                // eslint-disable-next-line @next/next/no-img-element -- temporary client-side camera capture
                <img src={captured.url} alt="Captured photo preview" className="h-full w-full object-contain" />
              ) : (
                <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-contain" aria-label="Live camera preview" />
              )}
              {cameraStatus === "requesting" && <p className="absolute inset-0 grid place-items-center bg-night/70 px-6 text-center font-semibold text-white" role="status">Requesting camera permission…</p>}
            </div>

            {cameraMessage && <div className="mt-3"><InlineNote tone="error">{cameraMessage}</InlineNote></div>}

            <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
              {cameraStatus === "live" && <Button size="lg" onClick={capturePhoto}><Camera className="size-4" aria-hidden="true" /> Capture photo</Button>}
              {cameraStatus === "captured" && (
                <>
                  <Button size="lg" variant="secondary" onClick={() => void startCamera()}>Retake</Button>
                  <Button size="lg" onClick={useCapturedPhoto}>Use photo</Button>
                </>
              )}
              {cameraStatus === "error" && (
                <>
                  <Button size="lg" variant="secondary" onClick={() => void startCamera()}>Try again</Button>
                  <Button size="lg" onClick={() => { const input = camRef.current; closeCamera(); if (input) { input.value = ""; input.click(); } }}>Take photo instead</Button>
                </>
              )}
              <Button size="lg" variant="ghost" onClick={closeCamera}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

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
