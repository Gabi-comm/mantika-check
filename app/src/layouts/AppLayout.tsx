import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, ScanLine, History, BookOpen, Settings as SettingsIcon, Globe } from "lucide-react";
import { Logo } from "../components/Logo";

const navItems = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/analyze", label: "Analyze", icon: ScanLine },
  { to: "/app/history", label: "History", icon: History },
  { to: "/app/reference", label: "Reference guide", icon: BookOpen },
  { to: "/app/settings", label: "Settings", icon: SettingsIcon },
];

// Mobile bottom bar: Analyze sits in the centre as the raised primary action.
const tabItems = [
  { to: "/app", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/app/history", label: "History", icon: History },
  { to: "/app/analyze", label: "Analyze", icon: ScanLine, primary: true },
  { to: "/app/reference", label: "Guide", icon: BookOpen },
  { to: "/app/settings", label: "Settings", icon: SettingsIcon },
];

export function AppLayout() {
  return (
    <div className="app-shell">
      <a href="#app-main" className="skip-link">
        Skip to content
      </a>
      <aside className="app-sidebar" aria-label="App navigation">
        <NavLink to="/" className="app-sidebar-brand" aria-label="MANTIKA CHECK home">
          <Logo height={28} />
        </NavLink>
        <nav>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? "active" : "")}>
              <Icon size={20} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <p className="app-sidebar-note">Research prototype. Measures printed colour in your browser; not an oil test.</p>
        <NavLink to="/" className="app-sidebar-back">
          <Globe size={18} aria-hidden="true" />
          <span>Back to website</span>
        </NavLink>
      </aside>

      <header className="app-topbar">
        <NavLink to="/" aria-label="MANTIKA CHECK home">
          <Logo height={26} />
        </NavLink>
        <span className="badge badge-sample">Research prototype</span>
      </header>

      <main id="app-main" className="app-main">
        <Outlet />
      </main>

      <nav className="app-tabbar" aria-label="App navigation">
        {tabItems.map(({ to, label, icon: Icon, end, primary }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => [primary ? "tab-primary" : "", isActive ? "active" : ""].join(" ")}>
            {primary ? (
              <span className="tab-primary-icon">
                <Icon size={24} aria-hidden="true" />
              </span>
            ) : (
              <Icon size={22} aria-hidden="true" />
            )}
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
