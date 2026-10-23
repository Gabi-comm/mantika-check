import type { Metadata } from "next";
import { PageIntro } from "@/components/site/PageIntro";
import { LinkButton } from "@/components/ui";

export const metadata: Metadata = { title: "About" };

const facts = [
  ["Stage", "Research prototype"],
  ["Platform", "Web, mobile-first"],
  ["Accounts", "None required"],
  ["Data storage", "On the user's device"],
  ["Status engine", "Demo heuristic, engine in development"],
  ["Laboratory validation", "Not yet performed"],
];

export default function AboutPage() {
  return (
    <>
      <PageIntro
        eyebrow="About"
        title="A practical tool for a common question at the frying stall."
        lead="When should this oil be replaced? MANTIKA CHECK helps vendors answer with a consistent record instead of memory alone."
      />
      <div className="mx-auto grid max-w-[1240px] gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section aria-labelledby="why-h" className="space-y-5 text-[1.04rem] text-ink/85">
          <h2 id="why-h" className="text-[1.8rem] font-extrabold text-ink">
            Why it exists
          </h2>
          <p>
            Street-food vendors reuse cooking oil across many sessions, often over several days. Decisions about filtering, topping up and replacing are usually made from
            appearance and habit, with no record of how long or how hot the oil has been used.
          </p>
          <p>
            MANTIKA CHECK keeps that record with minimal effort: a few taps per session, a short checklist when something looks wrong, and a clear status with its reasons.
            The aim is consistency and transparency, not a laboratory verdict.
          </p>
          <p>
            The project is developed as a research prototype. The scoring engine is being built separately, and the interface is designed so it can be connected without
            changing any screen.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <LinkButton href="/app" size="lg">
              Launch Dashboard
            </LinkButton>
            <LinkButton href="/methodology" size="lg" variant="secondary">
              Explore the Method
            </LinkButton>
          </div>
        </section>
        <aside aria-labelledby="facts-h" className="h-fit rounded-[var(--radius-l)] border border-line bg-white">
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
        </aside>
      </div>
    </>
  );
}
