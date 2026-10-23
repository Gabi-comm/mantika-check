import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { RotateCcw, Save, Info, CheckCircle2, FlaskConical } from "lucide-react";
import { Button, LinkButton } from "../../components/Button";
import { Card, Badge } from "../../components/Card";
import { FrameMotif } from "../../components/StripScene";
import { ChipLetter, ClassBadge, FramedSwatch } from "../../components/ClassBadge";
import { className as shortName } from "../../lib/classes";
import { saveEntry } from "../../lib/history";
import { REFERENCE_COLORS, rgbToLab, labDistance } from "../../lib/colorMath";

type ResultState = {
  previewUrl: string;
  roiPreviewUrl: string;
  roi: { x: number; y: number; w: number; h: number };
  rgb: { r: number; g: number; b: number };
  hsv: { h: number; s: number; v: number };
  lab: { l: number; a: number; b: number };
  hex: string;
  referenceLabel: string;
  referenceHex: string;
  distance: number;
};

const TABS = [
  { id: "metrics", label: "Colour metrics" },
  { id: "reference", label: "Reference comparison" },
  { id: "why", label: "How it was classified" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ResultState | null;
  const [saved, setSaved] = useState(false);
  const [label, setLabel] = useState("Strip analysis");
  const [tab, setTab] = useState<Tab>("metrics");
  const [analyzedAt] = useState(() => new Date().toLocaleString());
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  if (!state) {
    return (
      <div className="app-page">
        <Card className="empty-state">
          <FrameMotif className="empty-motif" stroke="#8a949e" />
          <h3>No analysis in progress</h3>
          <p>Results appear here after you measure a strip photo.</p>
          <LinkButton to="/app/analyze">Start an analysis</LinkButton>
        </Card>
      </div>
    );
  }

  function handleSave() {
    saveEntry({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      label: label.trim() || "Strip analysis",
      hex: state!.hex,
      rgb: state!.rgb,
      hsv: state!.hsv,
      lab: state!.lab,
      nearestReference: state!.referenceLabel,
      isDemoSample: false,
    });
    setSaved(true);
  }

  function onTabKey(e: React.KeyboardEvent, i: number) {
    let n = -1;
    if (e.key === "ArrowRight") n = (i + 1) % TABS.length;
    else if (e.key === "ArrowLeft") n = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = TABS.length - 1;
    if (n < 0) return;
    e.preventDefault();
    setTab(TABS[n].id);
    tabRefs.current[n]?.focus();
  }

  const measuredLab = rgbToLab(state.rgb);
  const compare = REFERENCE_COLORS.map((ref) => ({
    ...ref,
    dE: labDistance(measuredLab, rgbToLab(ref.rgb)),
  })).sort((a, b) => a.dE - b.dE);

  return (
    <div className="app-page">
      <header className="app-page-header">
        <div>
          <span className="mono">Result · {analyzedAt}</span>
          <h1>Colour analysis</h1>
          <p>Measured in your browser from the region you selected. The class is the nearest reference colour.</p>
        </div>
      </header>

      <ol className="step-indicator" aria-label="Analysis steps">
        <li className="done">1 Capture</li>
        <li className="done">2 Select region</li>
        <li className="done">3 Measure</li>
        <li className="active" aria-current="step">
          4 Result
        </li>
      </ol>

      <div className="results-grid">
        <Card className="result-summary">
          <div className="status-row" style={{ flexWrap: "wrap" }}>
            <span className="label">Result summary</span>
            <Badge tone="ok">Measured in browser</Badge>
          </div>
          <div className="result-headline">
            <FramedSwatch hex={state.hex} label={`Measured colour ${state.hex}`} />
            <div>
              <span className="mono muted" style={{ fontSize: 13 }}>
                Nearest reference
              </span>
              <p className="result-class" aria-live="polite">
                {shortName(state.referenceLabel)} <ChipLetter label={state.referenceLabel} size={28} />
              </p>
              <p className="mono muted" style={{ fontSize: 13, margin: "6px 0 0" }}>
                measured {state.hex} · ΔE {state.distance.toFixed(1)}
              </p>
            </div>
          </div>
          <p className="muted" style={{ margin: 0 }}>
            The averaged colour inside your region is closest to the <b>{shortName(state.referenceLabel).toLowerCase()}</b>{" "}
            reference: hue <span className="mono">{Math.round(state.hsv.h)}°</span>, CIELAB distance{" "}
            <span className="mono">{state.distance.toFixed(1)}</span>.
          </p>
          <div className="notice" role="note">
            <FlaskConical size={18} aria-hidden="true" />
            <span>
              <b>Experimental classification.</b> This describes printed colour under phone-camera conditions. It is
              not a chemical, TPC or oil-safety result.
            </span>
          </div>
          <div className="result-images">
            <img src={state.previewUrl} alt="Analyzed strip photo" className="results-image" />
            <div>
              <span className="label">Region</span>
              <img src={state.roiPreviewUrl} alt="Cropped region that was measured" className="roi-crop-thumb" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="result-label">Name this analysis</label>
            <div className="results-actions">
              <input id="result-label" className="text-input" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} />
            </div>
          </div>
          <div className="results-actions">
            <Button variant="secondary" icon={<RotateCcw size={16} aria-hidden="true" />} onClick={() => navigate("/app/analyze")}>
              Analyze another
            </Button>
            <Button icon={saved ? <CheckCircle2 size={16} aria-hidden="true" /> : <Save size={16} aria-hidden="true" />} onClick={handleSave} disabled={saved}>
              {saved ? "Saved" : "Save analysis"}
            </Button>
            {saved && (
              <LinkButton to="/app/history" variant="ghost">
                View history
              </LinkButton>
            )}
          </div>
          {saved && (
            <p className="form-success" role="status">
              Saved to history on this device.
            </p>
          )}
        </Card>

        <Card className="flush">
          <div role="tablist" aria-label="Result detail" className="result-tabs">
            {TABS.map((t, i) => (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                role="tab"
                id={`tab-${t.id}`}
                aria-controls={`panel-${t.id}`}
                aria-selected={tab === t.id}
                tabIndex={tab === t.id ? 0 : -1}
                className="result-tab"
                onClick={() => setTab(t.id)}
                onKeyDown={(e) => onTabKey(e, i)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "metrics" && (
            <div className="result-tabpanel" role="tabpanel" id="panel-metrics" aria-labelledby="tab-metrics">
              <div>
                <span className="label">RGB · 0 to 255</span>
                <div className="metric-grid">
                  <Metric label="R mean" value={round(state.rgb.r)} pct={(state.rgb.r / 255) * 100} color="#B42318" />
                  <Metric label="G mean" value={round(state.rgb.g)} pct={(state.rgb.g / 255) * 100} color="#1F8A5B" />
                  <Metric label="B mean" value={round(state.rgb.b)} pct={(state.rgb.b / 255) * 100} color="#1D4E89" />
                </div>
              </div>
              <div>
                <span className="label">HSV</span>
                <div className="metric-grid">
                  <Metric label="Hue" value={`${round(state.hsv.h)}°`} pct={(state.hsv.h / 360) * 100} color="var(--teal)" />
                  <Metric label="Saturation" value={`${round(state.hsv.s)}%`} pct={state.hsv.s} color="var(--teal)" />
                  <Metric label="Value" value={`${round(state.hsv.v)}%`} pct={state.hsv.v} color="var(--teal)" />
                </div>
              </div>
              <div>
                <span className="label">CIELAB · D65</span>
                <div className="metric-grid">
                  <Metric label="L* lightness" value={round(state.lab.l)} pct={state.lab.l} color="var(--text)" />
                  <Metric label="a* green to red" value={round(state.lab.a)} pct={50 + state.lab.a / 2.56} color="var(--text)" />
                  <Metric label="b* blue to yellow" value={round(state.lab.b)} pct={50 + state.lab.b / 2.56} color="var(--lab-blue)" />
                </div>
              </div>
              <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                Real values from the pixels in your region, not sample data.
              </p>
            </div>
          )}

          {tab === "reference" && (
            <div className="result-tabpanel" role="tabpanel" id="panel-reference" aria-labelledby="tab-reference">
              <span className="label">Measured vs reference · ΔE (CIE76) · lower is closer</span>
              <div className="ref-compare-grid">
                {compare.map((ref, i) => (
                  <div className="ref-compare-item" key={ref.id}>
                    <div className={`ref-compare-swatch${i === 0 ? " nearest" : ""}`} style={{ background: ref.hex }} />
                    <ClassBadge label={ref.label} suffix={i === 0 ? " · nearest" : undefined} />
                    <span className="mono">{i === 0 ? <b>ΔE {ref.dE.toFixed(1)}</b> : `ΔE ${ref.dE.toFixed(1)}`}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="muted" style={{ width: 80, fontSize: 14 }}>
                  Measured
                </span>
                <div style={{ flex: 1, height: 44, borderRadius: 8, background: state.hex, border: "1.5px solid var(--text)" }} />
              </div>
              <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                Reference swatches are illustrative until calibrated against photographed reference cards.
              </p>
            </div>
          )}

          {tab === "why" && (
            <div className="result-tabpanel" role="tabpanel" id="panel-why" aria-labelledby="tab-why">
              <ol className="classify-reasoning">
                <li>
                  <strong>Select</strong> the colour pad with the frame you positioned on the photo.
                </li>
                <li>
                  <strong>Average</strong> every pixel inside that region.
                </li>
                <li>
                  <strong>Convert</strong> the mean colour to HSV and CIELAB (D65 white point).
                </li>
                <li>
                  <strong>Classify</strong> by the smallest CIELAB distance to the three reference swatches.
                </li>
              </ol>
              <div className="notice info" role="note">
                <Info size={18} aria-hidden="true" />
                <span>This is a colour-distance heuristic in the browser. The trained research pipeline in ml/ is not connected.</span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value, pct, color }: { label: string; value: string | number; pct: number; color: string }) {
  return (
    <div className="metric-tile">
      <span className="mono muted" style={{ fontSize: 12 }}>
        {label}
      </span>
      <p className="v">{value}</p>
      <div className="metric-bar" aria-hidden="true">
        <i style={{ width: `${clampPct(pct)}%`, background: color }} />
      </div>
    </div>
  );
}

function clampPct(n: number) {
  return Math.min(100, Math.max(0, n));
}

function round(n: number) {
  return Math.round(n * 10) / 10;
}
