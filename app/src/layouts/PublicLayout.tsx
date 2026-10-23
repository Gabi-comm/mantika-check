import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, X, ScanLine } from "lucide-react";
import { Logo } from "../components/Logo";
import { LinkButton } from "../components/Button";

const links = [
  { to: "/", label: "Home" },
  { to: "/features", label: "Features" },
  { to: "/methodology", label: "Methodology" },
  { to: "/about", label: "About & Team" },
];

export function PublicLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="public-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="public-header">
        <div className="container public-header-inner">
          <NavLink to="/" className="public-brand" aria-label="MANTIKA CHECK home" onClick={() => setOpen(false)}>
            <Logo height={30} />
          </NavLink>

          <nav className="public-nav" aria-label="Primary">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end className={({ isActive }) => (isActive ? "active" : "")}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="public-header-actions">
            <LinkButton to="/app" variant="primary" size="md" icon={<ScanLine size={18} aria-hidden="true" />}>
              Try Analyzer
            </LinkButton>
          </div>

          <button
            className="mobile-menu-btn"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open && (
          <nav className="mobile-nav" id="mobile-nav" aria-label="Mobile primary">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? "active" : "")}>
                {l.label}
              </NavLink>
            ))}
            <LinkButton to="/app" variant="primary" size="lg" onClick={() => setOpen(false)} icon={<ScanLine size={18} aria-hidden="true" />}>
              Try Analyzer
            </LinkButton>
          </nav>
        )}
      </header>

      <main id="main" key={location.pathname}>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

const currentYear = new Date().getFullYear();

function Footer() {
  return (
    <footer className="public-footer">
      <div className="container footer-inner">
        <div>
          <span className="wordmark-lockup" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <img src="/brand/mantika-check-mark-reversed.svg" alt="" aria-hidden="true" style={{ height: 32, width: 32, borderRadius: 6 }} />
            <span className="wordmark" style={{ fontSize: 19 }}>
              <b>MANTIKA</b>
              <span>CHECK</span>
            </span>
          </span>
          <p className="footer-tagline">
            A computer vision research prototype that measures printed strip colour in your browser. It is not a
            certified food-safety or oil-quality instrument.
          </p>
        </div>
        <div className="footer-cols">
          <div>
            <h4>Product</h4>
            <NavLink to="/features">Features</NavLink>
            <NavLink to="/methodology">Methodology</NavLink>
            <NavLink to="/app">Analyzer</NavLink>
          </div>
          <div>
            <h4>Project</h4>
            <NavLink to="/about">About &amp; Team</NavLink>
            <NavLink to="/app/reference">Reference guide</NavLink>
          </div>
        </div>
      </div>
      <div className="container footer-legal">
        <span>© {currentYear} MANTIKA CHECK · Team INNOV · PJDSC 2026</span>
        <span>Frontend research preview · no backend, no ML inference</span>
      </div>
    </footer>
  );
}
