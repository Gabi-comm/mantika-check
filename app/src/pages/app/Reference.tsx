import { Sun, ScanLine, Crop, Camera, ShieldAlert } from "lucide-react";
import { Card, Badge } from "../../components/Card";
import { ChipLetter, FramedSwatch } from "../../components/ClassBadge";
import { className as shortName } from "../../lib/classes";
import { REFERENCE_COLORS, rgbToHsv, rgbToLab } from "../../lib/colorMath";

export function Reference() {
  return (
    <div className="app-page">
      <header className="app-page-header">
        <div>
          <span className="mono">Reference guide</span>
          <h1>Know what you&rsquo;re looking at</h1>
          <p>The three reference colours, how to photograph a strip, and what each measurement means.</p>
        </div>
      </header>

      <section aria-labelledby="sw-title" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="status-row" style={{ flexWrap: "wrap" }}>
          <h2 id="sw-title" style={{ fontSize: 22, margin: 0 }}>
            Reference swatches
          </h2>
          <Badge tone="sample">Illustrative until calibrated</Badge>
        </div>
        <div className="ref-swatches">
          {REFERENCE_COLORS.map((c) => {
            const hsv = rgbToHsv(c.rgb);
            const lab = rgbToLab(c.rgb);
            return (
              <Card key={c.id} className="ref-swatch-card">
                <FramedSwatch hex={c.hex} />
                <b>
                  <ChipLetter label={c.label} />
                  {shortName(c.label)}
                </b>
                <dl className="kv">
                  <dt>Hex</dt>
                  <dd>{c.hex}</dd>
                  <dt>Hue</dt>
                  <dd>{Math.round(hsv.h)}°</dd>
                  <dt>L* a* b*</dt>
                  <dd>
                    {lab.l.toFixed(1)}, {lab.a.toFixed(1)}, {lab.b.toFixed(1)}
                  </dd>
                </dl>
              </Card>
            );
          })}
        </div>
      </section>

      <div className="grid-2">
        <Card>
          <h3>How to photograph a strip</h3>
          <ul className="strip-tips">
            <li>
              <ScanLine size={18} aria-hidden="true" />
              Lay the card flat on a neutral, matte background.
            </li>
            <li>
              <Crop size={18} aria-hidden="true" />
              Fill most of the frame with the card; avoid distant or angled shots.
            </li>
            <li>
              <Camera size={18} aria-hidden="true" />
              Hold the phone steady and parallel to the card.
            </li>
          </ul>
        </Card>
        <Card>
          <h3>Lighting</h3>
          <ul className="strip-tips">
            <li>
              <Sun size={18} aria-hidden="true" />
              Natural daylight or diffuse white light works best.
            </li>
            <li>
              <Sun size={18} aria-hidden="true" />
              Avoid mixing warm bulbs with daylight; it shifts measured hue.
            </li>
            <li>
              <Sun size={18} aria-hidden="true" />
              Avoid glare and reflections on the colour pad.
            </li>
          </ul>
        </Card>
      </div>

      <section aria-labelledby="mean-title">
        <h2 id="mean-title" style={{ fontSize: 22, margin: "0 0 14px" }}>
          What the measurements mean
        </h2>
        <details className="accordion" open>
          <summary>RGB: how the camera stores colour</summary>
          <div className="acc-body">Red, green and blue channel values from 0 to 255, averaged over every pixel in your region.</div>
        </details>
        <details className="accordion">
          <summary>HSV: which colour, how strong, how bright</summary>
          <div className="acc-body">Hue is the colour angle (0 to 360°), saturation is how vivid it is, and value is its brightness.</div>
        </details>
        <details className="accordion">
          <summary>CIELAB: built to match human perception</summary>
          <div className="acc-body">
            L* is lightness, a* runs from green to red and b* from blue to yellow. Distances in CIELAB (ΔE) roughly match
            how different two colours look.
          </div>
        </details>
        <details className="accordion">
          <summary>Nearest reference and ΔE</summary>
          <div className="acc-body">The class is the reference swatch with the smallest ΔE (CIE76) to your measured colour.</div>
        </details>
      </section>

      <div className="notice" role="note">
        <ShieldAlert size={18} aria-hidden="true" />
        <span>
          <b>Scientific limitations.</b> These values describe the colour of the pixels you selected, not a chemical
          property. Printed reference cards do not react to oil, and nearest-reference comparison is not a TPC or
          oil-safety determination.
        </span>
      </div>
    </div>
  );
}
