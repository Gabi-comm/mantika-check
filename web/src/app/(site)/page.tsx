import Link from "next/link";
import { ArrowRight, Timer, ClipboardCheck, Droplets, RefreshCw, ShieldAlert, LogIn, FlaskConical, Users, Utensils, Thermometer } from "@/components/icons";
import { LinkButton, Tag } from "@/components/ui";
import { HeroPreview } from "@/components/site/HeroPreview";
import { Walkthrough } from "@/components/site/Walkthrough";
import { AuthPanel } from "@/components/site/AuthPanel";
import { demoSnapshot } from "@/components/site/demoData";
import { FoodBars, HeatLegend, HeatSplit, UsageChart } from "@/components/vendor/charts";
import { StatusScale } from "@/components/vendor/status";
import { OllieStage } from "@/components/OllieStage";
import { Reveal } from "@/components/motion/Reveal";
import { copy } from "@/vendor/copy";
import { fmtDate, fmtLitres } from "@/frontend/format";
import { DATA_MAX_HOURS, MODEL, TPC_LIMIT } from "@/lib/model";
import type { Action } from "@/vendor/types";

const Wrap = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <div className={`mx-auto max-w-[1240px] px-4 sm:px-6 ${className}`}>{children}</div>;

function SectionHead({ n, eyebrow, title, lead, dark, id }: { n: string; eyebrow: string; title: string; lead?: string; dark?: boolean; id?: string }) {
  return (
    <Reveal className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-end">
      <div>
        <p className={`font-mono text-[0.72rem] uppercase tracking-[0.14em] ${dark ? "text-mint/70" : "text-teal"}`}>
          <span className={dark ? "text-mint" : "text-accent"}>{n}</span> / {eyebrow}
        </p>
        <h2 id={id} className={`mt-3 max-w-xl text-[1.9rem] font-extrabold sm:text-[2.4rem] ${dark ? "text-white" : "text-ink"}`}>{title}</h2>
      </div>
      {lead && <p className={`max-w-lg text-[1.02rem] ${dark ? "text-white/70" : "text-gray"}`}>{lead}</p>}
    </Reveal>
  );
}

const OLLIE_STATES: { a: Action; d: string; tone: "green" | "amber" | "orange" | "red" }[] = [
  { a: "keep", d: "Fresh, golden oil. Ollie is wide awake.", tone: "green" },
  { a: "monitor", d: "Some use logged. Ollie is keeping an eye out.", tone: "amber" },
  { a: "change_soon", d: "The oil is darkening. Ollie is breaking a sweat.", tone: "orange" },
  { a: "change_now", d: "Dark, smoking oil. Ollie has slumped down, worn out.", tone: "red" },
];

export default function HomePage() {
  const { batch, totals, days, result } = demoSnapshot();
  const steps = [
    { icon: Droplets, t: "Start a batch", d: "Oil type, volume and heat source. Once per pan of oil." },
    { icon: Timer, t: "Log each session", d: "Duration and heat in three taps. Food is optional." },
    { icon: ClipboardCheck, t: "Record warning signs", d: "Smoke, foaming, dark oil or thickness, when you notice them." },
    { icon: RefreshCw, t: "Act on the status", d: "Monitor, filter or replace, with the reasons in view." },
  ];
  const facts = [
    { v: `${TPC_LIMIT}%`, l: "polar compounds (TPC): the discard limit used in Thailand and India" },
    { v: `±${MODEL.halfWidth.toFixed(1)}`, l: "TPC points: the model's 90% range on lab frying data" },
    { v: `0–${DATA_MAX_HOURS} h`, l: "of frying covered by the lab data, at 160 to 220 °C" },
    { v: "4", l: "visible warning signs from FSSAI guidance that always override" },
  ];

  return (
    <>
      {/* HERO + SIGN IN */}
      <section className="dot-grid relative overflow-hidden border-b border-line" aria-labelledby="hero-h">
        <div aria-hidden="true" className="pointer-events-none absolute -top-32 -left-24 size-[28rem] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--ollie-fresh)_22%,transparent),transparent_70%)]" />
        <Wrap className="relative grid gap-12 pt-12 pb-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.85fr)] lg:items-center lg:gap-16 lg:pt-20 lg:pb-24">
          <div className="fade-up">
            <p className="eyebrow inline-flex items-center gap-2 rounded-[4px] border border-line bg-surface px-2 py-1">
              <span className="size-1.5 animate-pulse rounded-full bg-green" aria-hidden="true" /> Cooking-oil monitoring · Research prototype
            </p>
            <h1 id="hero-h" className="mt-6 text-[2.5rem] leading-[1.04] font-extrabold tracking-[-0.035em] text-ink sm:text-[3.4rem] xl:text-[3.9rem]">
              Every frying session.
              <span className="block text-accent">A clearer picture of your oil.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[1.1rem] leading-relaxed text-ink/75">
              Log how long and how hot your oil was used. Mantika Check estimates how worn it is, warns you the moment something looks wrong, and tells you when to filter, top up or change it.
            </p>
            <div className="mt-8 flex items-end gap-3 sm:gap-5" aria-label="Ollie, the mascot, in the four oil states">
              {OLLIE_STATES.map(({ a }, i) => (
                <div key={a} className="fade-up flex flex-col items-center gap-2" style={{ animationDelay: `${150 + i * 120}ms` }}>
                  <OllieStage state={a} size={i === 0 ? 64 : 52} title={copy.status[a]} />
                  <span className="font-mono text-[0.62rem] uppercase tracking-[0.1em] text-gray">{copy.status[a]}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="#signin" size="lg" className="lg:hidden">
                <LogIn className="size-4" aria-hidden="true" /> Sign in
              </LinkButton>
              <LinkButton href="/methodology" size="lg" variant="secondary">
                Explore the Method <ArrowRight className="size-4" aria-hidden="true" />
              </LinkButton>
            </div>
          </div>
          <div id="signin" className="fade-up scroll-mt-24" style={{ animationDelay: "120ms" }}>
            <AuthPanel />
          </div>
        </Wrap>
      </section>

      {/* 1 WHY IT MATTERS */}
      <section className="bg-surface" aria-labelledby="why-h">
        <Wrap className="py-20">
          <SectionHead
            id="why-h"
            n="01"
            eyebrow="Why it matters"
            title="Reused oil wears out quietly."
            lead="Every hour at frying heat breaks oil down into polar compounds. Past the limit, food tastes off and the oil should no longer be used for food you sell. Most stalls have no test strip and no record, only memory."
          />
          <dl className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {facts.map((f, i) => (
              <Reveal key={f.v} delay={i * 80} className="lift rounded-[var(--radius-l)] border border-line bg-canvas p-6">
                <dt className="sr-only">{f.l}</dt>
                <dd className="font-display text-[2.2rem] font-extrabold tracking-tight text-accent tabular">{f.v}</dd>
                <dd className="mt-2 text-[0.92rem] text-gray">{f.l}</dd>
              </Reveal>
            ))}
          </dl>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { icon: Utensils, t: "For vendors", d: "Change oil when it is actually worn, not too early (wasted money) or too late (lost customers)." },
              { icon: Users, t: "For customers", d: "Food fried in oil that is still within safe limits, from stalls that keep a record." },
              { icon: Thermometer, t: "For the oil", d: "Seeing the cost of high heat helps vendors fry a little lower and make each batch last." },
            ].map(({ icon: Icon, t, d }, i) => (
              <Reveal key={t} delay={i * 90} className="flex gap-4 rounded-[var(--radius-m)] border border-line p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-s)] bg-tint text-accent">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-bold text-ink">{t}</h3>
                  <p className="mt-1 text-[0.92rem] text-gray">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Wrap>
      </section>

      {/* 2 OLLIE */}
      <section className="border-y border-line bg-canvas" aria-labelledby="ollie-h">
        <Wrap className="py-20">
          <SectionHead id="ollie-h" n="02" eyebrow="Meet Ollie" title="Ollie follows the batch." lead="A little drop of cooking oil who changes with your pan. One glance tells you the status, even from across the stall." />
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {OLLIE_STATES.map(({ a, d, tone }, i) => (
              <Reveal as="li" key={a} delay={i * 90} className="lift flex flex-col rounded-[var(--radius-l)] border border-line bg-surface p-6">
                <div className="grid h-44 place-items-center">
                  <OllieStage state={a} size={96} />
                </div>
                <Tag tone={tone} className="w-fit">
                  {copy.status[a]}
                </Tag>
                <p className="mt-3 text-[0.95rem] text-ink/85">{d}</p>
                <p className="mt-2 text-[0.82rem] text-gray">{copy.statusDetail[a]}</p>
              </Reveal>
            ))}
          </ul>
        </Wrap>
      </section>

      {/* 3 WORKFLOW */}
      <section className="bg-surface" aria-labelledby="flow-h">
        <Wrap className="py-20">
          <SectionHead id="flow-h" n="03" eyebrow="Workflow" title="Four steps a vendor already knows." lead="The workspace follows the routine of a frying stall rather than a lab protocol. Each step takes seconds on a phone." />
          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, t, d }, i) => (
              <Reveal as="li" key={t} delay={i * 90} className="lift relative rounded-[var(--radius-l)] border border-line bg-canvas p-6">
                <span className="font-mono text-[0.75rem] text-teal">STEP 0{i + 1}</span>
                <span className="mt-4 grid size-11 place-items-center rounded-[var(--radius-s)] bg-tint text-accent">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-[1.15rem] font-bold text-ink">{t}</h3>
                <p className="mt-1.5 text-gray">{d}</p>
              </Reveal>
            ))}
          </ol>
        </Wrap>
      </section>

      {/* 4 WALKTHROUGH */}
      <section className="border-y border-line bg-canvas" aria-labelledby="wt-h">
        <Wrap className="py-20">
          <SectionHead id="wt-h" n="04" eyebrow="Walkthrough" title="See each screen before you use it." lead="Step through the workspace. These are faithful replicas of the real screens." />
          <Reveal className="mt-10">
            <Walkthrough />
          </Reveal>
        </Wrap>
      </section>

      {/* 5 DASHBOARD */}
      <section className="dot-grid-dark bg-forest text-white" aria-labelledby="dash-h">
        <Wrap className="py-20">
          <SectionHead
            id="dash-h"
            dark
            n="05"
            eyebrow="Dashboard"
            title="Usage, observations and status on one screen."
            lead={`Real charts from the demo batch: ${totals.sessions} sessions, ${totals.hours} hours and ${fmtLitres(totals.topupLitres)} of top-ups since ${fmtDate(batch.startedAt)}.`}
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
            <Reveal>
              <HeroPreview />
            </Reveal>
            <div className="grid gap-4">
              <Reveal className="rounded-[var(--radius-l)] bg-surface p-5 text-ink">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="font-display font-bold">Frying hours per day</p>
                  <HeatLegend />
                </div>
                <UsageChart data={days} />
              </Reveal>
              <Reveal delay={80} className="rounded-[var(--radius-l)] bg-surface p-5 text-ink">
                <p className="mb-3 font-display font-bold">Sessions by heat level</p>
                <HeatSplit hours={totals.hoursByHeat} sessions={totals.sessionsByHeat} />
              </Reveal>
              <Reveal delay={160} className="rounded-[var(--radius-l)] bg-surface p-5 text-ink">
                <p className="mb-3 font-display font-bold">Food categories</p>
                <FoodBars counts={totals.foodCounts} sessions={totals.sessions} />
              </Reveal>
            </div>
          </div>
          <div className="mt-8">
            <LinkButton href="#signin" variant="inverse" size="lg">
              <LogIn className="size-4" aria-hidden="true" /> Sign in to open yours
            </LinkButton>
          </div>
        </Wrap>
      </section>

      {/* 6 DECISION TRANSPARENCY */}
      <section className="bg-surface" aria-labelledby="dt-h">
        <Wrap className="py-20">
          <SectionHead id="dt-h" n="06" eyebrow="Decision transparency" title="Every status shows where it came from." lead="Information is kept in separate layers. An estimate is never shown as an observation, or an observation as a measurement." />
          <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <ol className="space-y-3">
              {[
                { k: "Observed", tag: "Reported by vendor", tone: "green" as const, d: "Smoke, foaming, dark and murky oil, thickness, exactly as recorded." },
                { k: "Logged", tag: "Recorded usage", tone: "green" as const, d: "Hours, heat levels, food categories, top-ups and replacements." },
                { k: "Estimated", tag: "Model estimate", tone: "amber" as const, d: "Status and TPC range from the engine: a kinetic model fitted to lab frying data, plus fuzzy and safety rules." },
                { k: "Measured", tag: "Not available", tone: "outline" as const, d: "Laboratory or test-strip TPC. Not produced by this prototype." },
              ].map((l, i) => (
                <Reveal as="li" key={l.k} delay={i * 70} className="flex gap-4 rounded-[var(--radius-m)] border border-line bg-canvas p-4">
                  <span className="font-mono text-[0.75rem] text-teal">L{i + 1}</span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-display font-bold text-ink">
                      {l.k} <Tag tone={l.tone}>{l.tag}</Tag>
                    </p>
                    <p className="mt-1 text-[0.92rem] text-gray">{l.d}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
            <Reveal className="rounded-[var(--radius-l)] border border-line bg-canvas p-6">
              <div className="flex items-center gap-4">
                <OllieStage state={result.status.action} size={64} />
                <div>
                  <p className="text-[0.8rem] text-gray">Demo batch today</p>
                  <p className="font-display text-[1.3rem] font-extrabold text-ink">{copy.status[result.status.action]}</p>
                </div>
              </div>
              <div className="mt-5">
                <StatusScale action={result.status.action} />
              </div>
              <ul className="mt-5 space-y-2 text-[0.9rem] text-ink/85">
                {result.status.reasons.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-green" aria-hidden="true" />
                    {r}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </Wrap>
      </section>

      {/* 7 LIMITS */}
      <section className="border-t border-line bg-canvas" aria-labelledby="lim-h">
        <Wrap className="grid gap-8 py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center">
          <Reveal>
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.14em] text-teal">
              <span className="text-accent">07</span> / Honest limits
            </p>
            <h2 id="lim-h" className="mt-3 text-[1.9rem] font-extrabold text-ink sm:text-[2.3rem]">
              What this prototype does not claim.
            </h2>
            <Link href="/methodology" className="mt-6 inline-flex min-h-11 items-center gap-1.5 font-semibold text-accent">
              <FlaskConical className="size-4" aria-hidden="true" /> Read how it works <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Reveal>
          <Reveal delay={100} className="rounded-[var(--radius-l)] bg-night p-7 text-white sm:p-9">
            <ul className="space-y-4">
              {[
                "It does not measure polar compounds; the TPC shown is a model estimate, not a lab test.",
                "The engine is fitted on lab frying data and has not been validated at real stalls.",
                "Hours-left forecasts and peso savings are estimates, not guarantees.",
                "It makes no regulatory or certification claim.",
              ].map((t) => (
                <li key={t} className="flex gap-3 text-white/85">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0 text-mint" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </Wrap>
      </section>
    </>
  );
}
