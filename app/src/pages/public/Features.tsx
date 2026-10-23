import { Upload, Crop, Palette, Ruler, GitCompareArrows, ClipboardList, History, Settings as SettingsIcon, ScanLine } from "lucide-react";
import { Card } from "../../components/Card";
import { LinkButton } from "../../components/Button";
import { StripScene } from "../../components/StripScene";

const features = [
  { icon: Upload, title: "Image capture and upload", text: "Drag and drop, file picker or phone camera. JPEG and PNG up to 10 MB are validated before anything else happens." },
  { icon: Crop, title: "Region selection", text: "Drag and resize the detection frame on your photo, by pointer or keyboard. Rotation keeps it aligned with the real pixels." },
  { icon: Ruler, title: "Colour measurements", text: "Mean RGB of the selected pixels, converted to HSV and CIELAB (D65), computed entirely in the browser." },
  { icon: Palette, title: "Colour classification", text: "The measured colour is matched to the nearest of three labelled reference swatches." },
  { icon: GitCompareArrows, title: "Reference comparison", text: "Every reference is shown with its ΔE distance, so you can see how close the call was." },
  { icon: ClipboardList, title: "Result evidence", text: "Photo, cropped region, swatch and the full numeric breakdown sit beside the classification." },
  { icon: History, title: "History", text: "Save analyses on this device, then search, filter, reopen or delete them." },
  { icon: SettingsIcon, title: "Accessibility", text: "Reduced motion, high contrast and larger text; colour-independent labels throughout." },
];

export function Features() {
  return (
    <>
      <section className="page-hero grid-bg">
        <div className="container hero-grid">
          <div>
            <span className="tag">Features</span>
            <h1>Everything you see is a working interaction.</h1>
            <p>No mock results: the analyzer measures real pixels from your photo. What it does not do yet is listed just as clearly.</p>
            <div className="hero-actions" style={{ marginTop: 28 }}>
              <LinkButton to="/app/analyze" size="lg" icon={<ScanLine size={18} aria-hidden="true" />}>
                Try it now
              </LinkButton>
            </div>
          </div>
          <StripScene padColor="var(--s-yellow)" label="Region selected · illustration" />
        </div>
      </section>

      <section className="band">
        <div className="container">
          <div className="grid-2">
            {features.map((f) => (
              <Card key={f.title} className="feature-card" style={{ flexDirection: "row", gap: 18 }}>
                <div className="feature-icon">
                  <f.icon size={22} aria-hidden="true" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="band white">
        <div className="container grid-2">
          <Card style={{ background: "var(--mint)", borderColor: "#c5e6d3" }}>
            <h3>Works today</h3>
            <p style={{ color: "var(--primary-deep)" }}>
              Upload, region selection, browser-side colour measurement, reference comparison, local history and
              accessibility preferences.
            </p>
          </Card>
          <Card style={{ background: "var(--warn-bg)", borderColor: "#f1d98c" }}>
            <h3>Not yet</h3>
            <p style={{ color: "#5a3b00" }}>
              Automatic strip detection, the trained ML pipeline, chemical strips, accounts and any oil-quality or TPC
              result.
            </p>
          </Card>
        </div>
      </section>
    </>
  );
}
