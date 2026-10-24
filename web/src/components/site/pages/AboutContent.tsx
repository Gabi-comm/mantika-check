// about page content
import { LayoutDashboard, Wallet, Clock, Repeat, HeartPulse, Eye, Store, LogIn } from "@/components/icons";
import { PageIntro } from "@/components/site/PageIntro";
import { inAppHref } from "./links";
import { LinkButton } from "@/components/ui";
import { OllieStage } from "@/components/OllieStage";
import { Reveal } from "@/components/motion/Reveal";

const facts = [
  ["Stage", "Research prototype (PJDSC 2026)"],
  ["Platform", "Web, mobile-first"],
  ["Accounts", "Sign-in ready; accounts not connected yet"],
  ["Data storage", "On the user's device"],
  ["Status engine", "Neuro-symbolic: TPC model, fuzzy rules, safety rules"],
  ["Field validation", "Not yet performed"],
];

const vendors = [
  { icon: Wallet, t: "Spend less on oil", d: "Change oil when it is actually worn instead of by guesswork. The heat simulator shows what frying one level lower saves each week." },
  { icon: Clock, t: "Decide in seconds", d: "One status, with its reasons, replaces squinting at the pan. Logging a session takes three taps." },
  { icon: Repeat, t: "Build a habit", d: "Filtering, covering and timely changes become routine because the app reminds you, batch after batch." },
];

const consumers = [
  { icon: HeartPulse, t: "Safer street food", d: "Heavily reused oil builds up polar compounds linked to health concerns. Changing it in time keeps fried food within safer limits." },
  { icon: Eye, t: "Better taste", d: "Fresh oil fries cleaner and crisper. Worn oil makes food dark, greasy and bitter." },
  { icon: Store, t: "Trust in the stall", d: "A vendor who keeps a record can show it. That is a small, visible sign of care for regular customers." },
];

function ImpactList({ title, items, ollie, delay = 0 }: { title: string; items: typeof vendors; ollie: "keep" | "monitor"; delay?: number }) {
  return (
    <Reveal delay={delay} className="rounded-[var(--radius-l)] border border-line bg-surface p-6 sm:p-8">
      <div className="flex items-center gap-4">
        <OllieStage state={ollie} size={52} />
        <h3 className="text-[1.4rem] font-extrabold text-ink">{title}</h3>
      </div>
      <ul className="mt-6 space-y-5">
        {items.map(({ icon: Icon, t, d }) => (
          <li key={t} className="flex gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-s)] bg-tint text-accent">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-bold text-ink">{t}</p>
              <p className="mt-0.5 text-[0.94rem] text-gray">{d}</p>
            </div>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

export function AboutContent({ inApp = false }: { inApp?: boolean }) {
  const to = (href: string) => (inApp ? inAppHref(href) : href);
  return (
    <>
      <PageIntro
        eyebrow="About"
        title="A practical tool for a common question at the frying stall."
        lead="When should this oil be replaced? Mantika Check helps vendors answer with a consistent record instead of memory alone."
      />
      <div className="mx-auto max-w-[1240px] space-y-20 px-4 py-16 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <Reveal as="section" aria-labelledby="why-h" className="space-y-5 text-[1.04rem] text-ink/85">
            <h2 id="why-h" className="text-[1.8rem] font-extrabold text-ink">
              Why it exists
            </h2>
            <p>
              Street-food vendors reuse cooking oil across many sessions, often over several days. Decisions about filtering, topping up and replacing are usually made from appearance and habit, with no record of
              how long or how hot the oil has been used.
            </p>
            <p>
              Mantika Check keeps that record with minimal effort: a few taps per session, a short checklist when something looks wrong, and a clear status with its reasons. The aim is consistency and
              transparency, not a laboratory verdict.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <LinkButton href={inApp ? "/app" : "/#signin"} size="lg">
                {inApp ? <LayoutDashboard className="size-4" aria-hidden="true" /> : <LogIn className="size-4" aria-hidden="true" />} {inApp ? "Open dashboard" : "Sign in"}
              </LinkButton>
              <LinkButton href={to("/methodology")} size="lg" variant="secondary">
                Explore the Method
              </LinkButton>
            </div>
          </Reveal>
          <Reveal as="aside" delay={100} aria-labelledby="facts-h" className="h-fit rounded-[var(--radius-l)] border border-line bg-surface">
            <h2 id="facts-h" className="border-b border-line px-6 py-4 text-[1.05rem] font-bold">
              Project facts
            </h2>
            <dl className="divide-y divide-line">
              {facts.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-4 px-6 py-3 text-[0.92rem]">
                  <dt className="text-gray">{k}</dt>
                  <dd className="font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <section aria-labelledby="impact-h">
          <Reveal>
            <p className="eyebrow">Impact</p>
            <h2 id="impact-h" className="mt-2 max-w-2xl text-[1.9rem] font-extrabold text-ink sm:text-[2.3rem]">
              Better oil decisions help the person frying and the person eating.
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <ImpactList title="For vendors" items={vendors} ollie="keep" />
            <ImpactList title="For consumers" items={consumers} ollie="monitor" delay={120} />
          </div>
          <Reveal className="mt-5 rounded-[var(--radius-l)] bg-forest p-6 text-white sm:p-8">
            <p className="max-w-3xl text-[1.05rem] text-white/85">
              The impact above is the goal, not a measured result. Mantika Check has not yet been tested at real stalls; a field study with test strips is the next step to show whether it changes how
              often oil is replaced.
            </p>
          </Reveal>
        </section>
      </div>
    </>
  );
}
