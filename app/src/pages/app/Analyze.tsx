import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Camera, RotateCw, X, ArrowRight, Sun, ScanLine, Crop, Info, Move } from "lucide-react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { RoiOverlay, DEFAULT_ROI, type Roi } from "../../components/RoiOverlay";
import { FrameMotif } from "../../components/StripScene";
import { validateImageFile } from "../../lib/image";
import { rotatedCanvas, loadImage } from "../../lib/image";
import { averageColorFromCanvas, rgbToHsv, rgbToLab, nearestReference, rgbToHex } from "../../lib/colorMath";

type Step = "upload" | "detect";

export function Analyze() {
  const [step, setStep] = useState<Step>("upload");
  const [error, setError] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [fileName, setFileName] = useState("");
  const [roi, setRoi] = useState<Roi>(DEFAULT_ROI);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  // Render the rotated bitmap itself (instead of CSS-rotating the original image)
  // so the displayed box always matches the actual rotated pixel aspect ratio,
  // otherwise the ROI overlay drifts out of alignment at 90/270deg.
  useEffect(() => {
    if (!objectUrl) {
      setDisplayUrl(null);
      return;
    }
    let cancelled = false;
    loadImage(objectUrl).then((img) => {
      if (cancelled) return;
      const canvas = rotatedCanvas(img, rotation);
      setImgSize({ w: canvas.width, h: canvas.height });
      setDisplayUrl(canvas.toDataURL("image/jpeg", 0.9));
    });
    return () => {
      cancelled = true;
    };
  }, [objectUrl, rotation]);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const err = validateImageFile(file);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setObjectUrl(URL.createObjectURL(file));
    setFileName(file.name);
    setRotation(0);
    setRoi(DEFAULT_ROI);
    setStep("detect");
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function removeImage() {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setObjectUrl(null);
    setImgSize(null);
    setStep("upload");
    setError(null);
  }

  async function continueToResults() {
    if (!objectUrl) return;
    setBusy(true);
    try {
      const img = await loadImage(objectUrl);
      const canvas = rotatedCanvas(img, rotation);
      const ctx = canvas.getContext("2d")!;
      const roiPx = {
        x: (roi.x / 100) * canvas.width,
        y: (roi.y / 100) * canvas.height,
        w: (roi.w / 100) * canvas.width,
        h: (roi.h / 100) * canvas.height,
      };
      const rgb = averageColorFromCanvas(ctx, roiPx.x, roiPx.y, roiPx.w, roiPx.h);
      const hsv = rgbToHsv(rgb);
      const lab = rgbToLab(rgb);
      const { reference, distance } = nearestReference(rgb);

      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = Math.max(1, Math.round(roiPx.w));
      cropCanvas.height = Math.max(1, Math.round(roiPx.h));
      cropCanvas.getContext("2d")!.drawImage(canvas, -roiPx.x, -roiPx.y);

      navigate("/app/results", {
        state: {
          previewUrl: canvas.toDataURL("image/jpeg", 0.85),
          roiPreviewUrl: cropCanvas.toDataURL("image/jpeg", 0.9),
          roi,
          rgb,
          hsv,
          lab,
          hex: rgbToHex(rgb),
          referenceLabel: reference.label,
          referenceHex: reference.hex,
          distance,
        },
      });
    } finally {
      setBusy(false);
    }
  }

  const roiPx = imgSize ? { w: Math.round((roi.w / 100) * imgSize.w), h: Math.round((roi.h / 100) * imgSize.h) } : null;

  return (
    <div className="app-page">
      <header className="app-page-header">
        <div>
          <span className="mono">Analyze</span>
          <h1>{step === "upload" ? "Capture a strip photo" : "Position the detection frame"}</h1>
          <p>
            {step === "upload"
              ? "Upload a photo or use your camera. Nothing leaves your browser."
              : "Drag the frame over the colour pad, then measure. The frame is placed by you, not detected automatically."}
          </p>
        </div>
      </header>

      <ol className="step-indicator" aria-label="Analysis steps">
        <li className={step === "upload" ? "active" : "done"} aria-current={step === "upload" ? "step" : undefined}>
          1 Capture
        </li>
        <li className={step === "detect" ? "active" : ""} aria-current={step === "detect" ? "step" : undefined}>
          2 Select region
        </li>
        <li>3 Measure</li>
        <li>4 Result</li>
      </ol>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="visually-hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
        aria-label="Choose an image file"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png"
        capture="environment"
        className="visually-hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
        aria-label="Capture a photo with your camera"
      />

      {step === "upload" && (
        <div className="analyze-grid">
          <Card className="workflow-card">
            <span className="label">Upload / capture</span>
            <div
              className={["strip-dropzone grid-bg", dragging ? "dragging" : ""].join(" ")}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <FrameMotif className="empty-motif" stroke="var(--primary-deep)" />
              <b>{dragging ? "Release to upload" : "Drop a strip photo here"}</b>
              <span className="muted" style={{ fontSize: 14 }}>
                JPG or PNG, up to 10 MB
              </span>
              <div className="upload-actions">
                <Button size="lg" onClick={() => cameraInputRef.current?.click()} icon={<Camera size={18} aria-hidden="true" />}>
                  Take photo
                </Button>
                <Button size="lg" variant="secondary" onClick={() => fileInputRef.current?.click()} icon={<Upload size={18} aria-hidden="true" />}>
                  Upload
                </Button>
              </div>
            </div>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
          </Card>

          <div className="side-stack">
            <Card>
              <h3>Photograph guidance</h3>
              <ul className="strip-tips">
                <li>
                  <ScanLine size={18} aria-hidden="true" />
                  Lay the strip flat on a plain, matte surface.
                </li>
                <li>
                  <Sun size={18} aria-hidden="true" />
                  Use even daylight, with no shadows or flash glare.
                </li>
                <li>
                  <Crop size={18} aria-hidden="true" />
                  Fill most of the frame with the card.
                </li>
              </ul>
            </Card>
            <Card>
              <h3>What happens next</h3>
              <ol className="classify-reasoning">
                <li>
                  <strong>Select</strong> the colour pad with the detection frame.
                </li>
                <li>
                  <strong>Measure</strong> mean RGB, HSV and CIELAB in your browser.
                </li>
                <li>
                  <strong>Compare</strong> with the three reference colours.
                </li>
              </ol>
            </Card>
          </div>
        </div>
      )}

      {step === "detect" && objectUrl && (
        <div className="analyze-grid">
          <Card className="detect-card">
            <div className="detect-toolbar">
              <span className="mono muted" style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "50%" }}>
                {fileName}
                {imgSize ? ` · ${imgSize.w}×${imgSize.h}` : ""}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <Button variant="ghost" icon={<RotateCw size={16} aria-hidden="true" />} onClick={() => setRotation((r) => (r + 90) % 360)}>
                  Rotate
                </Button>
                <Button variant="ghost" icon={<X size={16} aria-hidden="true" />} onClick={removeImage}>
                  Remove
                </Button>
              </div>
            </div>

            <div className="detect-image-wrap">
              <div className="detect-frame">
                {displayUrl ? (
                  <img src={displayUrl} alt="Uploaded strip photo" className="detect-image" />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#fff", padding: 48 }}>
                    <span className="spinner" aria-hidden="true" /> Preparing photo…
                  </div>
                )}
                {displayUrl && <RoiOverlay roi={roi} onChange={setRoi} />}
              </div>
            </div>

            <div className="detect-actions">
              <Button variant="secondary" size="lg" onClick={() => fileInputRef.current?.click()}>
                Retake
              </Button>
              <Button size="lg" onClick={continueToResults} disabled={busy || !displayUrl} icon={<ArrowRight size={18} aria-hidden="true" />}>
                {busy ? "Measuring…" : "Measure colour"}
              </Button>
            </div>
          </Card>

          <div className="side-stack">
            <Card>
              <span className="label">Selected region</span>
              <dl className="kv" style={{ marginTop: 12 }}>
                <dt>Size</dt>
                <dd>{roiPx ? `${roiPx.w}×${roiPx.h} px` : "…"}</dd>
                <dt>Position</dt>
                <dd>
                  {Math.round(roi.x)}%, {Math.round(roi.y)}%
                </dd>
                <dt>Rotation</dt>
                <dd>{rotation}°</dd>
              </dl>
            </Card>
            <Card>
              <h3>Adjust the frame</h3>
              <ul className="strip-tips">
                <li>
                  <Move size={18} aria-hidden="true" />
                  Drag inside the frame to move it.
                </li>
                <li>
                  <Crop size={18} aria-hidden="true" />
                  Drag the round handle to resize.
                </li>
                <li>
                  <RotateCw size={18} aria-hidden="true" />
                  Rotate if the photo is sideways.
                </li>
              </ul>
            </Card>
            <div className="notice info" role="note">
              <Info size={18} aria-hidden="true" />
              <span>
                Keep the frame inside the colour pad only. Paper, shadow or glare inside the frame changes the measured
                average.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
