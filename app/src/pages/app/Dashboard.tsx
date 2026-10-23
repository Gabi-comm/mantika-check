import { useState } from "react";
import { Camera, Upload, BookOpen, History as HistoryIcon, CheckCircle2, ArrowRight } from "lucide-react";
import { LinkButton } from "../../components/Button";
import { Card } from "../../components/Card";
import { FrameMotif } from "../../components/StripScene";
import { ClassBadge, FramedSwatch } from "../../components/ClassBadge";
import { loadHistory } from "../../lib/history";
import { REFERENCE_COLORS } from "../../lib/colorMath";

const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export function Dashboard() {
  const [entries] = useState(loadHistory);
  const recent = entries.slice(0, 3);
  const counts = REFERENCE_COLORS.map((c) => ({ label: c.label, n: entries.filter((e) => e.nearestReference === c.label).length }));

  return (
    <div className="app-page">
      <header className="app-page-header">
        <div>
          <span className="mono">{today}</span>
          <h1>{greeting()}, Team Innov</h1>
          <p>Start a new analysis or review what you have saved on this device.</p>
        </div>
        <span className="status-chip ok">
          <CheckCircle2 size={14} aria-hidden="true" />
          {entries.length} saved on this device
        </span>
      </header>

      <div className="dash-row">
        <div className="dash-hero">
          <FrameMotif className="dash-hero-motif" stroke="#fff" />
          <span className="label">New analysis</span>
          <p>Photograph a strip and see its colour evidence.</p>
          <div className="dash-hero-actions">
            <LinkButton to="/app/analyze" size="lg" className="btn-on-dark" icon={<Camera size={18} aria-hidden="true" />}>
              Start analysis
            </LinkButton>
            <LinkButton to="/app/analyze" size="lg" variant="ghost" className="btn-outline-on-dark" icon={<Upload size={18} aria-hidden="true" />}>
              Upload photo
            </LinkButton>
          </div>
        </div>

        <Card className="dash-ref">
          <div className="dash-ref-head">
            <b>Reference guide</b>
            <BookOpen size={20} aria-hidden="true" style={{ color: "var(--primary)" }} />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {REFERENCE_COLORS.map((c) => (
              <ClassBadge key={c.id} label={c.label} />
            ))}
          </div>
          <p className="muted" style={{ fontSize: 14, margin: 0 }}>
            How to photograph a strip, what each class means, and how colour is measured.
          </p>
          <LinkButton to="/app/reference" variant="ghost" icon={<ArrowRight size={16} aria-hidden="true" />} style={{ alignSelf: "flex-start", paddingLeft: 8 }}>
            Open guide
          </LinkButton>
        </Card>
      </div>

      <div className="dash-stats">
        <Card className="stat">
          <span className="label">Saved analyses</span>
          <p className="v">{entries.length}</p>
        </Card>
        {counts.map((c) => (
          <Card className="stat" key={c.label}>
            <ClassBadge label={c.label} />
            <p className="v">{c.n}</p>
          </Card>
        ))}
      </div>

      <Card className="flush">
        <div className="card-head">
          <b>Recent analyses</b>
          {recent.length > 0 && (
            <LinkButton to="/app/history" variant="ghost">
              View all
            </LinkButton>
          )}
        </div>
        {recent.length === 0 ? (
          <div className="empty-state">
            <FrameMotif className="empty-motif" stroke="#8a949e" />
            <h3>No analyses yet</h3>
            <p>Your first strip analysis will appear here once you save it.</p>
            <LinkButton to="/app/analyze" icon={<HistoryIcon size={16} aria-hidden="true" />}>
              Analyze your first strip
            </LinkButton>
          </div>
        ) : (
          <div className="recent-grid">
            {recent.map((e) => (
              <div className="recent-item" key={e.id}>
                <FramedSwatch hex={e.hex} />
                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.label}</strong>
                  <div style={{ marginTop: 6 }}>
                    <ClassBadge label={e.nearestReference} />
                  </div>
                  <p className="mono muted">{new Date(e.date).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
