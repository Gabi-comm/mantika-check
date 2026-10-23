import Link from "next/link";
import { ArrowRight, LayoutDashboard, FlaskConical, Timer, ClipboardCheck, Droplets, RefreshCw, History, ShieldAlert, Eye, CircleCheck, Clock3, OctagonAlert, TriangleAlert, WifiOff, Smartphone } from "lucide-react";
import { LinkButton, Tag } from "@/components/ui";
import { HeroPreview } from "@/components/site/HeroPreview";
import { Walkthrough } from "@/components/site/Walkthrough";
import { demoSnapshot } from "@/components/site/demoData";
import { FoodBars, HeatLegend, HeatSplit, UsageChart } from "@/components/vendor/charts";
import { StatusScale } from "@/components/vendor/status";
import { copy } from "@/vendor/copy";
import { fmtDate, fmtLitres } from "@/lib/format";

const Wrap = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <div className={`mx-auto max-w-[1240px] px-4 sm:px-6 ${className}`}>{children}</div>;

function SectionHead({ n, eyebrow, title, lead, dark, id }: { n: string; eyebrow: string; title: string; lead?: string; dark?: boolean; id?: string }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-end">
      <div>
        <p className={`font-mono text-[0.72rem] uppercase tracking-[0.14em] ${dark ? "text-mint/70" : "text-teal"}`}>
          <span className={dark ? "text-mint" : "text-green"}>{n}</span> / {eyebrow}
        </p>
        <h2 id={id} className={`mt-3 max-w-xl text-[1.9rem] font-extrabold sm:text-[2.4rem] ${dark ? "text-white" : "text-ink"}`}>{title}</h2>
      </div>
      {lead && <p className={`max-w-lg text-[1.02rem] ${dark ? "text-white/70" : "text-gray"}`}>{lead}</p>}
    </div>
  );
}

export default function HomePage() {
  const { batch, totals, days, closed, closedTotals, result, events } = demoSnapshot();
  const steps = [
    { icon: Droplets, t: "Start a batch", d: "Oil type, volume and heat source. Once per pan of oil." },
    { icon: Timer, t: "Log each session", d: "Duration and heat in three taps. Food is optional." },
    { icon: ClipboardCheck, t: "Record warning signs", d: "Smoke, foaming, dark oil or thickness, when you notice them." },
    { icon: RefreshCw, t: "Act on the status", d: "Monitor, filter or replace, with the reasons in view." },
  ];
  const states = [
    { a: "keep" as const, icon: CircleCheck, cls: "text-st-continue bg-st-continue-bg" },
    { a: "monitor" as const, icon: Eye, cls: "text-st-monitor bg-st-monitor-bg" },
    { a: "change_soon" as const, icon: Clock3, cls: "text-st-recommend bg-st-recommend-bg" },
    { a: "change_now" as const, icon: OctagonAlert, cls: "text-st-replace bg-st-replace-bg" },
  ];

  return (
    <>
      {/* HERO */}
      <section className="dot-grid relative overflow-hidden border-b border-line" aria-labelledby="hero-h">
        <Wrap className="grid gap-14 pt-12 pb-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center lg:gap-20 lg:pt-20 lg:pb-28">
          <div>
            <p className="eyebrow inline-flex items-center gap-2 rounded-[4px] border border-line bg-white px-2 py-1">
              <span className="size-1.5 rounded-full bg-green" aria-hidden="true" /> Cooking-oil monitoring · Research prototype
            </p>
            <h1 id="hero-h" className="mt-6 text-[2.5rem] leading-[1.04] font-extrabold tracking-[-0.035em] text-ink sm:text-[3.4rem] xl:text-[3.9rem]">
              Every frying session.
              <span className="block text-green">A clearer picture of your oil.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[1.1rem] leading-relaxed text-ink/75">
              Track cooking-oil usage, record visible warning signs, and manage oil batches through one practical monitoring workspace.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/app" size="lg">
                <LayoutDashboard className="size-4" aria-hidden="true" /> Launch Dashboard
              </LinkButton>
              <LinkButton href="/methodology" size="lg" variant="secondary">
                Explore the Method <ArrowRight className="size-4" aria-hidden="true" />
              </LinkButton>
            </div>
            <p className="mt-8 flex max-w-lg gap-2.5 border-l-2 border-line-strong pl-3 text-[0.85rem] text-gray">
              <FlaskConical className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden="true" />
              Prototype disclosure: statuses are estimates from logged usage and observations. MANTIKA CHECK does not measure oil chemistry. Preview uses fictional demo data.
            </p>
          </div>
          <div className="lg:pl-6">
            <HeroPreview />
          </div>
        </Wrap>
      </section>

      {/* 1 WORKFLOW */}
      <section className="bg-white" aria-labelledby="flow-h">
        <Wrap className="py-20">
          <SectionHead id="flow-h" n="01" eyebrow="Workflow" title="Four steps a vendor already knows." lead="The workspace follows the routine of a frying stall rather than a lab protocol. Each step takes seconds on a phone." />
          <ol className="mt-12 grid border-y border-line sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, t, d }, i) => (
              <li key={t} className="relative border-line py-7 pr-6 sm:[&:nth-child(odd)]:border-r lg:border-r lg:pl-6 lg:first:pl-0 lg:last:border-r-0 sm:[&:nth-child(n+3)]:border-t lg:[&:nth-child(n+3)]:border-t-0">
                <span className="font-mono text-[0.75rem] text-teal">STEP 0{i + 1}</span>
                <Icon className="mt-4 size-6 text-green" aria-hidden="true" />
                <h3 className="mt-3 text-[1.15rem] font-bold text-ink">{t}</h3>
                <p className="mt-1.5 text-gray">{d}</p>
              </li>
            ))}
          </ol>
        </Wrap>
      </section>

      {/* 2 WALKTHROUGH */}
      <section className="border-y border-line bg-canvas" aria-labelledby="wt-h">
        <Wrap className="py-20">
          <SectionHead id="wt-h" n="02" eyebrow="Walkthrough" title="See each screen before you use it." lead="Step through the workspace. These are faithful replicas of the real screens; the live versions are one click away." />
          <div className="mt-10">
            <Walkthrough />
          </div>
        </Wrap>
      </section>

      {/* 3 CAPABILITIES */}
      <section className="bg-white" aria-labelledby="cap-h">
        <Wrap className="py-20">
          <SectionHead id="cap-h" n="03" eyebrow="Capabilities" title="Built for one hand and a busy counter." />
          <div className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-l)] border border-line bg-line lg:grid-cols-3 lg:grid-rows-2">
            <div className="bg-forest p-7 text-white lg:row-span-2 lg:p-9">
              <TriangleAlert className="size-7 text-mint" aria-hidden="true" />
              <h3 className="mt-5 text-[1.6rem] font-extrabold">Warnings come first. Always.</h3>
              <p className="mt-3 text-white/75">
                When a vendor reports any of the four warning signs, a critical banner appears above every other element on every screen. No status card, chart or simulator can
                hide or soften it.
              </p>
              <div className="mt-8 rounded-[var(--radius-m)] border border-white/15 bg-critical/90 p-4">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.14em] text-white/70">Override · user observation</p>
                <p className="mt-1 font-display font-bold">{copy.warning.title}</p>
              </div>
            </div>
            {[
              { icon: Timer, t: "Three-tap logging", d: "Preset hours and heat levels. No typing for a normal session." },
              { icon: Droplets, t: "Top-up guard", d: "Presets of 0.25, 0.5 and 1 L, disabled with a clear reason when replacement is due." },
              { icon: History, t: "Complete history", d: "Every batch and event, filterable by type and searchable by food, sign or reason." },
              { icon: WifiOff, t: "Works offline", d: "Records save locally; guidance falls back to built-in templates without a connection." },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="bg-white p-7">
                <Icon className="size-5 text-green" aria-hidden="true" />
                <h3 className="mt-4 text-[1.1rem] font-bold text-ink">{t}</h3>
                <p className="mt-1.5 text-gray">{d}</p>
              </div>
            ))}
          </div>
        </Wrap>
      </section>

      {/* 4 DASHBOARD SHOWCASE */}
      <section className="dot-grid-dark bg-forest text-white" aria-labelledby="dash-h">
        <Wrap className="py-20">
          <SectionHead id="dash-h" dark n="04" eyebrow="Dashboard" title="Usage, observations and status on one screen." lead={`Real charts drawn from the demo batch: ${totals.sessions} sessions, ${totals.hours} hours and ${fmtLitres(totals.topupLitres)} of top-ups since ${fmtDate(batch.startedAt)}.`} />
          <div className="mt-12 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="rounded-[var(--radius-l)] bg-white p-5 text-ink sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-display font-bold">Frying hours per day · {batch.label}</p>
                <HeatLegend />
              </div>
              <div className="mt-4">
                <UsageChart data={days} />
              </div>
            </div>
            <div className="grid gap-4">
              <div className="rounded-[var(--radius-l)] bg-white p-5 text-ink">
                <p className="mb-3 font-display font-bold">Sessions by heat level</p>
                <HeatSplit hours={totals.hoursByHeat} sessions={totals.sessionsByHeat} />
              </div>
              <div className="rounded-[var(--radius-l)] bg-white p-5 text-ink">
                <p className="mb-3 font-display font-bold">Food categories</p>
                <FoodBars counts={totals.foodCounts} sessions={totals.sessions} />
              </div>
            </div>
          </div>
          <div className="mt-8">
            <LinkButton href="/app" variant="inverse" size="lg">
              Open the live dashboard <ArrowRight className="size-4" aria-hidden="true" />
            </LinkButton>
          </div>
        </Wrap>
      </section>

      {/* 5 TIMELINE */}
      <section className="bg-white" aria-labelledby="tl-h">
        <Wrap className="py-20">
          <SectionHead id="tl-h" n="05" eyebrow="Monitoring timeline" title="A batch is a story, not a single reading." lead="Each pan of oil becomes a batch. Sessions, top-ups and checks accumulate on it until it is replaced and archived." />
          <div className="mt-12 overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[repeat(11,minmax(0,1fr))] gap-1">
                {Array.from({ length: 11 }, (_, k) => {
                  const d = new Date(Date.UTC(2026, 9, 12 + k, 4));
                  const iso = d.toISOString();
                  const inClosed = k <= 4;
                  return (
                    <div key={k} className="text-center">
                      <div className={`h-2 rounded-full ${inClosed ? "bg-line-strong" : "bg-green"}`} />
                      <p className="mt-2 font-mono text-[0.7rem] text-gray">{fmtDate(iso)}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 grid grid-cols-[5fr_6fr] gap-4">
                <div className="rounded-[var(--radius-m)] border border-line bg-canvas p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-display font-bold">{closed.label}</p>
                    <Tag tone="outline">Closed</Tag>
                  </div>
                  <p className="mt-1 text-[0.88rem] text-gray">
                    {closedTotals.sessions} sessions · {closedTotals.hours} h · replaced: {closed.endReason && copy.reasons[closed.endReason]}
                  </p>
                  <p className="mt-3 text-[0.85rem] text-ink">The final check reported dark, murky and thick oil. The vendor replaced the oil the same evening; the batch moved to history intact.</p>
                </div>
                <div className="rounded-[var(--radius-m)] border-2 border-green bg-white p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-display font-bold">{batch.label}</p>
                    <Tag tone="green">Active</Tag>
                  </div>
                  <p className="mt-1 text-[0.88rem] text-gray">
                    {totals.sessions} sessions · {totals.hours} h · {totals.checks} checks · {totals.topups} top-ups
                  </p>
                  <ul className="mt-3 space-y-1.5 text-[0.85rem]">
                    {events.slice(0, 3).map((e) => (
                      <li key={e.id} className="flex justify-between gap-3">
                        <span className="text-ink">
                          {e.kind === "check" ? `Check: ${e.signs.map((s) => copy.signs[s].title).join(", ") || "no signs"}` : e.kind === "session" ? `${e.hours} h · ${copy.heat[e.heat]} heat` : e.kind === "topup" ? `Top-up ${fmtLitres(e.litres)}` : "Replaced"}
                        </span>
                        <span className="font-mono text-gray">{fmtDate(e.at)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Wrap>
      </section>

      {/* 6 DECISION TRANSPARENCY */}
      <section className="border-y border-line bg-canvas" aria-labelledby="dt-h">
        <Wrap className="py-20">
          <SectionHead id="dt-h" n="06" eyebrow="Decision transparency" title="Every status shows where it came from." lead="Information is kept in separate layers. The interface never presents an estimate as an observation, or an observation as a measurement." />
          <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <ol className="space-y-3">
              {[
                { k: "Observed", tag: "Reported by vendor", tone: "green" as const, d: "Smoke, foaming, dark and murky oil, thickness, exactly as recorded." },
                { k: "Logged", tag: "Recorded usage", tone: "green" as const, d: "Hours, heat levels, food categories, top-ups and replacements. Totals are plain sums." },
                { k: "Estimated", tag: "Demo heuristic", tone: "amber" as const, d: "The monitoring status. Placeholder weights until the engine is validated, and labelled as illustrative." },
                { k: "Measured", tag: "Not available", tone: "outline" as const, d: "Laboratory values such as total polar compounds. Not produced or displayed by this prototype." },
              ].map((l, i) => (
                <li key={l.k} className="flex gap-4 rounded-[var(--radius-m)] border border-line bg-white p-4">
                  <span className="font-mono text-[0.75rem] text-teal">L{i + 1}</span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-display font-bold text-ink">
                      {l.k} <Tag tone={l.tone}>{l.tag}</Tag>
                    </p>
                    <p className="mt-1 text-[0.92rem] text-gray">{l.d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div>
              <p className="font-display font-bold text-ink">Four monitoring states</p>
              <p className="mt-1 text-[0.92rem] text-gray">Color, icon, position and wording each carry the meaning, so no state depends on color alone.</p>
              <ul className="mt-5 space-y-2">
                {states.map(({ a, icon: Icon, cls }) => (
                  <li key={a} className="flex items-center gap-3 rounded-[var(--radius-m)] border border-line bg-white p-3">
                    <span className={`grid size-10 shrink-0 place-items-center rounded-[var(--radius-s)] ${cls}`}>
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">{copy.status[a]}</p>
                      <p className="text-[0.85rem] text-gray">{copy.statusDetail[a]}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-5 rounded-[var(--radius-m)] border border-line bg-white p-4">
                <p className="mb-2 text-[0.8rem] text-gray">Demo batch today · {copy.status[result.status.action]}</p>
                <StatusScale action={result.status.action} />
              </div>
            </div>
          </div>
        </Wrap>
      </section>

      {/* 7 METHOD + 8 LIMITS */}
      <section className="bg-white" aria-labelledby="m-h">
        <Wrap className="grid gap-12 py-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div>
            <SectionHead id="m-h" n="07" eyebrow="Research methodology" title="Usage-based, observation-led." />
            <ol className="mt-8 divide-y divide-line border-y border-line">
              {[
                ["Usage log", "Duration, heat level and food per session form the exposure record of each batch."],
                ["Observations", "Vendor-reported sensory signs are stored as-is and checked for hard rules first."],
                ["Status estimate", "A scoring step turns the record into one of four states with up to three reasons."],
                ["Guidance", "Short template text follows the status. It can be reworded, never re-decided."],
              ].map(([t, d], i) => (
                <li key={t} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-2 py-4">
                  <span className="font-mono text-[0.8rem] text-teal">0{i + 1}</span>
                  <div>
                    <p className="font-semibold text-ink">{t}</p>
                    <p className="text-[0.92rem] text-gray">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link href="/methodology" className="mt-6 inline-flex min-h-11 items-center gap-1.5 font-semibold text-green">
              Read the full methodology <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="rounded-[var(--radius-l)] bg-ink p-7 text-white sm:p-9">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.14em] text-mint/70">
              <span className="text-mint">08</span> / Scientific limitations
            </p>
            <h2 className="mt-3 text-[1.7rem] font-extrabold">What this prototype does not claim.</h2>
            <ul className="mt-6 space-y-4">
              {[
                "It does not measure total polar compounds or any other chemical property of oil.",
                "Statuses come from placeholder weights and are not validated against laboratory data.",
                "It does not forecast remaining oil life or guarantee savings.",
                "It makes no regulatory or certification claim.",
                "Photo color analysis is experimental and is never used for the status.",
              ].map((t) => (
                <li key={t} className="flex gap-3 text-white/85">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0 text-mint" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </Wrap>
      </section>

      {/* 9 CTA */}
      <section className="dot-grid border-t border-line" aria-labelledby="cta-h">
        <Wrap className="flex flex-col items-start justify-between gap-8 py-16 md:flex-row md:items-center">
          <div>
            <h2 id="cta-h" className="text-[1.9rem] font-extrabold text-ink sm:text-[2.3rem]">
              Open the workspace. It is already filled in.
            </h2>
            <p className="mt-2 flex items-center gap-2 text-gray">
              <Smartphone className="size-4 text-teal" aria-hidden="true" /> Explore with demo records, then start your own batch. No account needed.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <LinkButton href="/app" size="lg">
              <LayoutDashboard className="size-4" aria-hidden="true" /> Launch Dashboard
            </LinkButton>
            <LinkButton href="/app/setup" size="lg" variant="secondary">
              Start my own batch
            </LinkButton>
          </div>
        </Wrap>
      </section>
    </>
  );
}
