import { Card } from "../../components/Card";
import { LinkButton } from "../../components/Button";

const team = [
  { name: "Cacananta, John Ray", role: "[Role, editable placeholder]" },
  { name: "Dellomas, Alvin", role: "[Role, editable placeholder]" },
  { name: "Solomon, Gabriel John", role: "[Role, editable placeholder]" },
  { name: "Jalandoni, Revo", role: "[Role, editable placeholder]" },
];

function initials(name: string) {
  const [last, first] = name.split(",").map((s) => s.trim());
  return `${first?.[0] ?? ""}${last[0]}`;
}

export function About() {
  return (
    <>
      <section className="page-hero grid-bg">
        <div className="container">
          <span className="tag">About &amp; Team</span>
          <h1>Team INNOV, PJDSC 2026.</h1>
          <p>
            MANTIKA CHECK explores whether a phone camera can read colour strips reliably enough to support cooking-oil
            research, starting with printed reference cards.
          </p>
        </div>
      </section>

      <section className="band">
        <div className="container">
          <div className="team-grid">
            {team.map((m) => (
              <Card key={m.name} className="team-card">
                <div className="team-avatar" aria-hidden="true">
                  {initials(m.name)}
                </div>
                <strong>{m.name}</strong>
                <p className="team-role">{m.role}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="band white">
        <div className="container grid-2">
          <Card>
            <h3>Project status</h3>
            <p className="muted">
              This site is a frontend-only research preview. There is no backend, authentication, database or live ML
              inference. Analyses and settings stay in your browser.
            </p>
          </Card>
          <Card style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
            <h3>See how it works</h3>
            <p className="muted">Read what the pipeline measures and where its limits are.</p>
            <LinkButton to="/methodology" variant="secondary">
              Methodology
            </LinkButton>
          </Card>
        </div>
      </section>
    </>
  );
}
