import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Trash2, X, ScanLine } from "lucide-react";
import { Button, LinkButton } from "../../components/Button";
import { Card } from "../../components/Card";
import { FrameMotif } from "../../components/StripScene";
import { ChipLetter, ClassBadge, FramedSwatch } from "../../components/ClassBadge";
import { className as shortName } from "../../lib/classes";
import { loadHistory, removeEntry, clearHistory, type HistoryEntry } from "../../lib/history";
import { REFERENCE_COLORS } from "../../lib/colorMath";

export function History() {
  const [entries, setEntries] = useState(loadHistory);
  const [query, setQuery] = useState("");
  const [colorFilter, setColorFilter] = useState<string>("all");
  const [selected, setSelected] = useState<HistoryEntry | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return entries.filter((e) => {
      const matchesQuery = e.label.toLowerCase().includes(q) || new Date(e.date).toLocaleString().toLowerCase().includes(q);
      const matchesColor = colorFilter === "all" || e.nearestReference === colorFilter;
      return matchesQuery && matchesColor;
    });
  }, [entries, query, colorFilter]);

  useEffect(() => {
    if (!selected) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  function handleRemove(id: string) {
    removeEntry(id);
    setEntries(loadHistory());
    if (selected?.id === id) setSelected(null);
  }

  function handleClearAll() {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    clearHistory();
    setEntries([]);
    setSelected(null);
    setConfirmClear(false);
  }

  return (
    <div className="app-page">
      <header className="app-page-header">
        <div>
          <span className="mono">History</span>
          <h1>Saved analyses</h1>
          <p>Stored only in this browser. Clearing history removes them permanently.</p>
        </div>
        {entries.length > 0 && (
          <Button variant="danger" icon={<Trash2 size={16} aria-hidden="true" />} onClick={handleClearAll} onBlur={() => setConfirmClear(false)}>
            {confirmClear ? "Click again to clear all" : "Clear all"}
          </Button>
        )}
      </header>

      {entries.length === 0 ? (
        <Card className="empty-state">
          <FrameMotif className="empty-motif" stroke="#8a949e" />
          <h3>No analyses yet</h3>
          <p>Analyses you save from the results screen will appear here.</p>
          <LinkButton to="/app/analyze" icon={<ScanLine size={16} aria-hidden="true" />}>
            Analyze a strip
          </LinkButton>
        </Card>
      ) : (
        <Card className="flush">
          <div className="toolbar">
            <div className="search-input">
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                aria-label="Search analyses by name or date"
                placeholder="Search by name or date"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="filter-chips" role="group" aria-label="Filter by nearest reference">
              <button type="button" className="filter-chip" aria-pressed={colorFilter === "all"} onClick={() => setColorFilter("all")}>
                All
              </button>
              {REFERENCE_COLORS.map((c) => (
                <button key={c.id} type="button" className="filter-chip" aria-pressed={colorFilter === c.label} onClick={() => setColorFilter(c.label)}>
                  <ChipLetter label={c.label} size={16} />
                  {shortName(c.label)}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <h3>No matches</h3>
              <p>Try a different search or filter.</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="history-table">
                <caption className="visually-hidden">Saved analyses, {filtered.length} shown</caption>
                <thead>
                  <tr>
                    <th scope="col">Colour</th>
                    <th scope="col">Name</th>
                    <th scope="col">Nearest reference</th>
                    <th scope="col">Date</th>
                    <th scope="col">Hue</th>
                    <th scope="col">
                      <span className="visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <FramedSwatch hex={e.hex} />
                      </td>
                      <td>
                        <button type="button" className="row-link" onClick={() => setSelected(e)}>
                          {e.label}
                        </button>
                      </td>
                      <td>
                        <ClassBadge label={e.nearestReference} />
                      </td>
                      <td className="mono">{new Date(e.date).toLocaleString()}</td>
                      <td className="mono">{Math.round(e.hsv.h)}°</td>
                      <td style={{ textAlign: "right", paddingRight: 16 }}>
                        <button className="icon-btn" aria-label={`Remove ${e.label}`} onClick={() => handleRemove(e.id)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <Card className="modal-card" role="dialog" aria-modal="true" aria-labelledby="entry-title" onClick={(e) => e.stopPropagation()}>
            <button ref={closeRef} className="icon-btn modal-close" aria-label="Close" onClick={() => setSelected(null)}>
              <X size={18} />
            </button>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <FramedSwatch hex={selected.hex} size={72} />
              <div>
                <h3 id="entry-title" style={{ margin: 0 }}>
                  {selected.label}
                </h3>
                <p className="mono muted" style={{ margin: "4px 0 8px", fontSize: 13 }}>
                  {new Date(selected.date).toLocaleString()}
                </p>
                <ClassBadge label={selected.nearestReference} />
              </div>
            </div>
            <div className="measurements">
              <div className="measurement">
                <span className="measurement-label">RGB</span>
                <span className="measurement-value mono">
                  {Math.round(selected.rgb.r)}, {Math.round(selected.rgb.g)}, {Math.round(selected.rgb.b)}
                </span>
              </div>
              <div className="measurement">
                <span className="measurement-label">HSV</span>
                <span className="measurement-value mono">
                  {Math.round(selected.hsv.h)}°, {Math.round(selected.hsv.s)}%, {Math.round(selected.hsv.v)}%
                </span>
              </div>
              <div className="measurement">
                <span className="measurement-label">CIELAB</span>
                <span className="measurement-value mono">
                  {selected.lab.l.toFixed(1)}, {selected.lab.a.toFixed(1)}, {selected.lab.b.toFixed(1)}
                </span>
              </div>
              <div className="measurement">
                <span className="measurement-label">Hex</span>
                <span className="measurement-value mono">{selected.hex}</span>
              </div>
            </div>
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>
              Experimental colour classification. Not a chemical or oil-safety result.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
