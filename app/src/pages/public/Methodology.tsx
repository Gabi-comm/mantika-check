import { ShieldAlert, Info } from "lucide-react";
import { Card } from "../../components/Card";

const pipeline = [
  { title: "Image input", text: "Upload or camera capture; JPEG or PNG, validated for type and size." },
  { title: "Preprocessing", text: "Orientation in 90 degree steps, applied to the actual pixels." },
  { title: "Strip region", text: "User-positioned frame in this website. Automatic detection exists only in the ml/ research pipeline." },
  { title: "Colour features", text: "Mean RGB, then HSV and CIELAB (sRGB to XYZ to Lab, D65)." },
  { title: "Classification", text: "Nearest of three reference swatches by CIE76 ΔE." },
  { title: "Result display", text: "Class, values, distances and the cropped region, all shown together." },
];

export function Methodology() {
  return (
    <>
      <section className="page-hero grid-bg">
        <div className="container">
          <span className="tag">Methodology</span>
          <h1>What the pipeline does, and what it does not.</h1>
          <p>A transparent colour pipeline for printed strips. Every step below is visible in the analyzer.</p>
        </div>
      </section>

      <section className="band">
        <div className="container method-grid">
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
            <h3>Not validated for oil safety</h3>
            <ul>
              <li>
                <Info size={18} aria-hidden="true" />
                It has not been validated to measure total polar compounds (TPC) or to decide whether cooking oil is safe.
              </li>
              <li>
                <Info size={18} aria-hidden="true" />
                Classification in the analyzer is a colour-distance heuristic, not a chemical measurement.
              </li>
              <li>
                <Info size={18} aria-hidden="true" />
                The 25% TPC line used in the research is a research benchmark, not Philippine law.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="band white">
        <div className="container">
          <div className="sec-head">
            <div>
              <span className="eyebrow">Two research tracks</span>
              <h2>Separate components that are not combined yet.</h2>
            </div>
            <p>Neither result can be used to validate the other until a chemical-strip validation phase exists.</p>
          </div>
          <div className="grid-2">
            <Card>
              <span className="label">ml/</span>
              <h3 style={{ marginTop: 8 }}>Image baseline</h3>
              <p className="muted">
                Classifies a photo of a printed colour card into blue, yellow or green using HSV and CIELAB statistics and
                rule thresholds, with an optional logistic-regression baseline.
              </p>
              <p className="muted">
                It measures printed ink under phone-camera conditions, not oil chemistry. Its in-sample result comes from a
                small, single-session sample and is not a dependable accuracy claim.
              </p>
            </Card>
            <Card>
              <span className="label">models/</span>
              <h3 style={{ marginTop: 8 }}>TPC regression</h3>
              <p className="muted">
                Fits TPC against frying time from published frying-oil data: potato-chip frying at 160 to 220°C over 0 to 30
                hours.
              </p>
              <p className="muted">
                It has no visual strip data, and the image baseline has no chemical ground truth, so the two cannot be
                combined yet.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
