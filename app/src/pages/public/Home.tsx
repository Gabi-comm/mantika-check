import {
  ArrowRight,
  FlaskConical,
  ScanLine,
  Upload,
  Crop,
  Ruler,
  GitCompareArrows,
  History,
  LayoutDashboard,
  BookOpen,
  Settings as SettingsIcon,
  CheckCircle2,
  Camera,
  ShieldAlert,
  Info,
} from "lucide-react";
import { LinkButton } from "../../components/Button";
import { Card, Badge } from "../../components/Card";
import { StripScene, FrameMotif } from "../../components/StripScene";
import { ClassBadge, FramedSwatch, ChipLetter } from "../../components/ClassBadge";
import { className as shortName } from "../../lib/classes";
import { REFERENCE_COLORS } from "../../lib/colorMath";

const heroSteps = [
  { n: "01", title: "Capture", text: "Upload or take a photo" },
  { n: "02", title: "Select", text: "Position the strip region" },
  { n: "03", title: "Measure", text: "RGB · HSV · CIELAB" },
  { n: "04", title: "Compare", text: "Nearest reference, with evidence" },
];

const flow = [
  { icon: Camera, title: "Capture", text: "Photograph the card or upload a JPG or PNG." },
  { icon: Crop, title: "Select region", text: "Drag the detection frame over the colour pad." },
  { icon: Ruler, title: "Measure", text: "Average the pixels inside the frame, in your browser." },
  { icon: GitCompareArrows, title: "Compare", text: "Find the nearest reference by CIELAB distance." },
  { icon: CheckCircle2, title: "Show evidence", text: "Photo, region, values and distances side by side." },
];

const pipeline = [
  { title: "Image input", text: "Upload or camera capture, validated as JPEG or PNG under 10 MB." },
  { title: "Orientation", text: "Rotate in 90 degree steps; the region always matches the rotated pixels." },
  { title: "Region of interest", text: "You position the frame. Automatic detection lives in the separate ml/ research pipeline." },
  { title: "Colour features", text: "Mean RGB, then HSV and CIELAB (D65), computed client side." },
  { title: "Nearest reference", text: "CIE76 colour distance to three labelled reference swatches." },
];

const team = ["Cacananta, John Ray", "Dellomas, Alvin", "Solomon, Gabriel John", "Jalandoni, Revo"];

export function Home() {
  return (
    <>
      {/* HERO */}
      <section className="hero grid-bg" aria-labelledby="hero-title">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-copy">
              <span className="tag">PJDSC 2026 · Computer vision research</span>
              <h1 id="hero-title">
                Read a strip&rsquo;s colour.
                <br />
                <em>See exactly why.</em>
              </h1>
              <p className="hero-lede">
                Take a photo. MANTIKA CHECK measures RGB, HSV and CIELAB inside the region you select and compares it
                with reference colours, step by step and entirely in your browser.
              </p>
              <div className="hero-actions">
                <LinkButton to="/app" size="lg" icon={<ScanLine size={18} aria-hidden="true" />}>
                  Try the analyzer
                </LinkButton>
                <LinkButton to="/methodology" size="lg" variant="secondary" icon={<ArrowRight size={18} aria-hidden="true" />}>
                  Read the methodology
                </LinkButton>
              </div>
              <p className="hero-disclaimer">
                <FlaskConical size={16} aria-hidden="true" />
                Experimental research prototype. It classifies printed colour; it is not a food-safety or oil-quality test.
              </p>
            </div>

            <div className="hero-visual">
              <StripScene padColor="var(--s-green)" />
              <Card className="hero-result-card">
                <div className="status-row">
                  <ClassBadge label="Green band" />
                  <Badge tone="sample">Sample</Badge>
                </div>
                <span className="mono" style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                  L* 54.2 · a* −36.8 · b* 22.4
                </span>
              </Card>
            </div>
          </div>
        </div>
        <div className="container">
          <div className="hero-steps">
            {heroSteps.map((s) => (
              <div key={s.n}>
                <span className="mono step-n">{s.n}</span>
                <strong>{s.title}</strong>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REFERENCE COLOURS */}
      <section className="band white" aria-labelledby="ref-title">
        <div className="container">
          <div className="sec-head">
            <div>
              <span className="eyebrow">Reference colours</span>
              <h2 id="ref-title">Three classes. Always labelled, never colour alone.</h2>
            </div>
            <p>
              Results appear as a framed swatch with a letter and a word, so yellow and green never depend on how well
              someone sees hue. Brand green is identity; a green result is data.
            </p>
          </div>
          <div className="spectrum">
            {REFERENCE_COLORS.map((c) => (
              <div className="spectrum-item" key={c.id}>
                <FramedSwatch hex={c.hex} />
                <div>
                  <b>
                    <ChipLetter label={c.label} />
                    {shortName(c.label)}
                  </b>
                  <span className="mono" style={{ fontSize: 13, color: "var(--muted)" }}>
                    {c.hex} · reference swatch
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="band" aria-labelledby="feat-title">
        <div className="container">
          <div className="sec-head">
            <div>
              <span className="eyebrow">What it does today</span>
              <h2 id="feat-title">Every step is a real interaction, not a mockup.</h2>
            </div>
            <p>Capture, select, measure, compare and review. All of it runs in the browser, with no account and no server.</p>
          </div>
          <div className="feature-grid">
            <Card className="feature-card">
              <div className="feature-icon">
                <Upload size={22} aria-hidden="true" />
              </div>
              <h3>Capture and upload</h3>
              <p>Drag and drop, file picker or the phone camera, with file type and size validation.</p>
            </Card>
            <Card className="feature-card wide">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="feature-icon">
                  <Ruler size={22} aria-hidden="true" />
                </div>
                <h3>Colour measurement you can check</h3>
                <p>Mean RGB of the pixels in your region, converted to HSV and CIELAB. The numbers come from your photo.</p>
              </div>
              <div className="mini-metrics" aria-label="Example metrics, sample values">
                <div>
                  <span>Hue</span>
                  <b>136°</b>
                </div>
                <div>
                  <span>L*</span>
                  <b>54.2</b>
                </div>
                <div>
                  <span>b*</span>
                  <b>22.4</b>
                </div>
              </div>
            </Card>
            <Card className="feature-card wide">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="feature-icon">
                  <Crop size={22} aria-hidden="true" />
                </div>
                <h3>Region selection with the detection frame</h3>
                <p>Drag and resize the frame over the colour pad. Rotation keeps the frame aligned with the real pixels.</p>
              </div>
              <StripScene padColor="var(--s-blue)" scan={false} className="feature-scene" />
            </Card>
            <Card className="feature-card accent">
              <div className="feature-icon">
                <GitCompareArrows size={22} aria-hidden="true" />
              </div>
              <h3>Reference comparison</h3>
              <p>CIELAB distance to each reference, with the nearest one highlighted and every distance shown.</p>
            </Card>
            <Card className="feature-card">
              <div className="feature-icon">
                <History size={22} aria-hidden="true" />
              </div>
              <h3>History and review</h3>
              <p>Save results on this device, then search, filter and reopen them.</p>
            </Card>
            <Card className="feature-card">
              <div className="feature-icon">
                <SettingsIcon size={22} aria-hidden="true" />
              </div>
              <h3>Accessibility preferences</h3>
              <p>Reduced motion, high contrast and larger text, remembered on this device.</p>
            </Card>
            <Card className="feature-card">
              <div className="feature-icon">
                <BookOpen size={22} aria-hidden="true" />
              </div>
              <h3>Reference guide</h3>
              <p>How to photograph a strip and what RGB, HSV and CIELAB actually mean.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="band white" aria-labelledby="how-title">
        <div className="container">
          <div className="sec-head">
            <div>
              <span className="eyebrow">How it works</span>
              <h2 id="how-title">Capture, select, measure. Nothing hidden.</h2>
            </div>
            <p>You always see the photo the system measures and the exact region it used.</p>
          </div>
          <ol className="flow">
            {flow.map((s, i) => (
              <li key={s.title}>
                <span className="flow-icon">
                  <s.icon size={22} aria-hidden="true" />
                </span>
                <span className="mono">0{i + 1}</span>
                <strong>{s.title}</strong>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* APP PREVIEW */}
      <section className="band" aria-labelledby="preview-title">
        <div className="container">
          <div className="sec-head">
            <div>
              <span className="eyebrow">The analyzer</span>
              <h2 id="preview-title">A dashboard with one obvious next step.</h2>
            </div>
            <p>This is the app that opens when you choose Try the analyzer. Start an analysis, revisit results, or open the guide.</p>
          </div>
          <div className="browser" role="img" aria-label="Preview of the analyzer dashboard">
            <div className="browser-bar">
              <div className="dots">
                <i />
                <i />
                <i />
              </div>
              <div className="url">mantikacheck · /app</div>
            </div>
            <div className="preview-shell">
              <div className="preview-side">
                <span style={{ padding: "0 8px 14px", minHeight: 0 }}>
                  <img src="/brand/mantika-check-mark.svg" alt="" style={{ width: 24, height: 24 }} />
                  <span className="wordmark" style={{ fontSize: 14, padding: 0, minHeight: 0 }}>
                    <b>MANTIKA</b>
                    <span>CHECK</span>
                  </span>
                </span>
                <span className="on">
                  <LayoutDashboard size={18} /> Dashboard
                </span>
                <span>
                  <ScanLine size={18} /> Analyze
                </span>
                <span>
                  <History size={18} /> History
                </span>
                <span>
                  <BookOpen size={18} /> Reference guide
                </span>
                <span>
                  <SettingsIcon size={18} /> Settings
                </span>
              </div>
              <div className="preview-main">
                <div className="status-row" style={{ flexWrap: "wrap" }}>
                  <div>
                    <span className="mono" style={{ fontSize: 13, color: "var(--muted)" }}>
                      Dashboard
                    </span>
                    <p style={{ font: "700 26px/1.15 var(--font-display)", letterSpacing: "-.02em", margin: "4px 0 0" }}>Good afternoon, Team Innov</p>
                  </div>
                  <span className="status-chip ok">
                    <CheckCircle2 size={14} aria-hidden="true" />
                    Saved on this device
                  </span>
                </div>
                <div className="dash-row">
                  <div className="dash-hero">
                    <FrameMotif className="dash-hero-motif" stroke="#fff" />
                    <span className="label">New analysis</span>
                    <p>Photograph a strip and see its colour evidence.</p>
                    <div className="dash-hero-actions">
                      <span className="btn btn-lg btn-on-dark">
                        <Camera size={18} /> Start analysis
                      </span>
                      <span className="btn btn-lg btn-outline-on-dark">
                        <Upload size={18} /> Upload photo
                      </span>
                    </div>
                  </div>
                  <Card className="dash-ref">
                    <div className="dash-ref-head">
                      <b>Reference guide</b>
                      <BookOpen size={20} style={{ color: "var(--primary)" }} />
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {REFERENCE_COLORS.map((c) => (
                        <ClassBadge key={c.id} label={c.label} />
                      ))}
                    </div>
                    <p className="muted" style={{ fontSize: 14, margin: 0 }}>
                      How to photograph a strip, what each class means, and how colour is measured.
                    </p>
                  </Card>
                </div>
                <Card className="flush">
                  <div className="card-head">
                    <b>Recent analyses</b>
                    <Badge tone="sample">Sample data</Badge>
                  </div>
                  <div className="recent-grid">
                    {[
                      { l: "Blue band", t: "14:02 · img_0042" },
                      { l: "Yellow band", t: "13:47 · img_0041" },
                      { l: "Green band", t: "13:30 · img_0040" },
                    ].map((r) => (
                      <div className="recent-item" key={r.t}>
                        <FramedSwatch hex={REFERENCE_COLORS.find((c) => c.label === r.l)!.hex} />
                        <div>
                          <ClassBadge label={r.l} />
                          <p className="mono muted">{r.t}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
            <LinkButton to="/app" size="lg" icon={<ScanLine size={18} aria-hidden="true" />}>
              Open the analyzer
            </LinkButton>
          </div>
        </div>
      </section>

      {/* METHODOLOGY */}
      <section className="band white" aria-labelledby="method-title">
        <div className="container">
          <div className="sec-head">
            <div>
              <span className="eyebrow">Methodology</span>
              <h2 id="method-title">A transparent colour pipeline, honest about its limits.</h2>
            </div>
            <p>Each step below runs in this website. The separate Python research pipeline is not connected yet.</p>
          </div>
          <div className="method-grid">
            <Card>
              <ol className="pipeline">
                {pipeline.map((p, i) => (
                  <li key={p.title}>
                    <span className="n">0{i + 1}</span>
                    <div>
                      <strong>{p.title}</strong>
                      <p>{p.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
            <div className="limits-card">
              <ShieldAlert size={28} aria-hidden="true" style={{ color: "#9fd8b8" }} />
              <h3>What this prototype does not do</h3>
              <ul>
                <li>
                  <Info size={18} aria-hidden="true" />
                  It does not measure total polar compounds (TPC) or decide whether oil is safe to use.
                </li>
                <li>
                  <Info size={18} aria-hidden="true" />
                  Printed ink does not react to oil. The current cards validate the image pipeline only.
                </li>
                <li>
                  <Info size={18} aria-hidden="true" />
                  Nearest reference is a colour-distance heuristic, not a trained or validated model.
                </li>
              </ul>
              <LinkButton to="/methodology" variant="secondary" className="btn-on-dark" style={{ alignSelf: "flex-start" }}>
                Full methodology
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="band" aria-labelledby="team-title">
        <div className="container">
          <div className="sec-head">
            <div>
              <span className="eyebrow">Team INNOV</span>
              <h2 id="team-title">Built for the Philippine Junior Data Science Challenge.</h2>
            </div>
            <p>Four students researching whether phone cameras can read colour strips reliably enough to be useful.</p>
          </div>
          <div className="team-grid">
            {team.map((name) => (
              <Card key={name} className="team-card">
                <div className="team-avatar" aria-hidden="true">
                  {name.split(",")[1]?.trim()[0]}
                  {name[0]}
                </div>
                <strong>{name}</strong>
                <p className="team-role">Team INNOV</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="band dark" aria-labelledby="cta-title">
        <div className="container cta-band">
          <div>
            <h2 id="cta-title">See the evidence behind a strip reading.</h2>
            <p>Upload a photo of a printed reference card and inspect every value the analyzer computes.</p>
          </div>
          <LinkButton to="/app/analyze" size="lg" className="btn-on-dark" icon={<ScanLine size={18} aria-hidden="true" />}>
            Start an analysis
          </LinkButton>
        </div>
      </section>
    </>
  );
}
