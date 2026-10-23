import { Check, Info } from "lucide-react";
import { Card } from "../../components/Card";
import { useSettings } from "../../context/SettingsContext";

export function Settings() {
  const { settings, update } = useSettings();

  return (
    <div className="app-page">
      <header className="app-page-header">
        <div>
          <span className="mono">Settings</span>
          <h1>Accessibility and display</h1>
          <p>Preferences are saved only on this device and apply across the website and the analyzer.</p>
        </div>
      </header>

      <div className="settings-grid">
        <Card className="settings-list">
          <Toggle
            id="reduced-motion"
            label="Reduce motion"
            description="Stops the scan animation and shortens transitions. Your system setting is also respected."
            checked={settings.reducedMotion}
            onChange={(v) => update({ reducedMotion: v })}
          />
          <Toggle
            id="high-contrast"
            label="High contrast"
            description="Darker text and borders throughout the interface."
            checked={settings.highContrast}
            onChange={(v) => update({ highContrast: v })}
          />
          <Toggle
            id="large-text"
            label="Larger text"
            description="Increases the base text size from 16 to 18 pixels."
            checked={settings.largeText}
            onChange={(v) => update({ largeText: v })}
          />
        </Card>

        <Card>
          <h3>Built in by default</h3>
          <ul className="strip-tips">
            {[
              "Every result shows a letter and a word, not colour alone.",
              "Visible focus ring on every control; full keyboard navigation.",
              "Touch targets of at least 44 pixels.",
              "Layouts reflow down to 320 pixels wide.",
            ].map((t) => (
              <li key={t}>
                <Check size={18} aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
          <div className="notice info" role="note" style={{ marginTop: 16 }}>
            <Info size={18} aria-hidden="true" />
            <span>Data and settings never leave this browser. There are no accounts.</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="settings-row">
      <div>
        <strong id={`${id}-label`}>{label}</strong>
        <p id={`${id}-desc`}>{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-desc`}
        className={checked ? "switch on" : "switch"}
        onClick={() => onChange(!checked)}
      >
        <span className="switch-thumb">{checked && <Check size={14} aria-hidden="true" />}</span>
      </button>
    </div>
  );
}
