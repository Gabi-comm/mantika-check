import type { Metadata } from "next";
import { LayoutDashboard, Timer, ClipboardCheck, Droplets, RefreshCw, History, Settings, ScanLine, TriangleAlert, WifiOff } from "lucide-react";
import { LinkButton, Tag } from "@/components/ui";
import { PageIntro } from "@/components/site/PageIntro";

export const metadata: Metadata = { title: "Features" };

const groups = [
  {
    title: "Record",
    items: [
      { icon: Droplets, t: "Batch setup", d: "Oil type, initial volume, heat source, optional purchase cost and start date, with defaults from the last batch.", s: "Working" },
      { icon: Timer, t: "Session logging", d: "Duration presets from 1 to 5+ hours and three heat levels. Food categories, temperature and a custom time are optional.", s: "Working" },
      { icon: ClipboardCheck, t: "Quick condition check", d: "Unusual smoke, persistent foaming, dark and murky oil, thick or sticky oil; plus filtering and covering.", s: "Working" },
    ],
  },
  {
    title: "Decide",
    items: [
      { icon: TriangleAlert, t: "Critical warning override", d: "Any reported warning sign places a warning above all content on every workspace screen. A conservative prototype rule, not a measurement.", s: "Working" },
      { icon: LayoutDashboard, t: "Monitoring status", d: "Four labelled states with up to three reasons, the source and the validation state on every card.", s: "Demo heuristic" },
      { icon: Droplets, t: "Top-up guard", d: "0.25, 0.5 and 1 L presets. Disabled, with the restriction's source, when replacement is due.", s: "Working" },
    ],
  },
  {
    title: "Review",
    items: [
      { icon: RefreshCw, t: "Oil replacement", d: "Closes the batch with a reason and starts a new one. The old batch stays in history.", s: "Working" },
      { icon: History, t: "History", d: "Batch summaries, day-grouped timeline, type filters and search across food, signs and reasons.", s: "Working" },
      { icon: Settings, t: "Settings and demo controls", d: "Reduced motion, contrast, text size, scenario previews, demo reset and data deletion.", s: "Working" },
      { icon: WifiOff, t: "Offline use", d: "Records save locally. Guidance falls back to templates when there is no connection.", s: "Working" },
      { icon: ScanLine, t: "Color analyzer", d: "Measures the average color of a photo region. Isolated from the status and labelled experimental.", s: "Experimental" },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <PageIntro eyebrow="Features" title="A complete monitoring loop, from first pour to replacement." lead="Every feature below runs in the current prototype. Where a result is a demonstration rather than a validated output, it says so.">
        <LinkButton href="/app" size="lg" className="mt-6">
          Launch Dashboard
        </LinkButton>
      </PageIntro>
      <div className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6">
        {groups.map((g, gi) => (
          <section key={g.title} aria-labelledby={`g-${gi}`} className="grid gap-6 border-t border-line py-10 first:border-t-0 first:pt-0 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div>
              <p className="font-mono text-[0.75rem] text-teal">0{gi + 1}</p>
              <h2 id={`g-${gi}`} className="mt-1 text-[1.6rem] font-extrabold text-ink">
                {g.title}
              </h2>
            </div>
            <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {g.items.map(({ icon: Icon, t, d, s }) => (
                <li key={t} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-s)] bg-pale text-green">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="flex flex-wrap items-center gap-2 text-[1.05rem] font-bold text-ink">
                      {t} <Tag tone={s === "Working" ? "green" : s === "Experimental" ? "outline" : "amber"}>{s}</Tag>
                    </h3>
                    <p className="mt-1 text-gray">{d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
