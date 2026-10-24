// features page content
import type { ReactNode } from "react";
import { LogIn, Settings, ScanLine, WifiOff, Moon, Compass } from "@/components/icons";
import { LinkButton, Tag } from "@/components/ui";
import { PageIntro } from "@/components/site/PageIntro";
import { Reveal } from "@/components/motion/Reveal";
import { BatchDemo, CheckDemo, HistoryDemo, LogDemo, SimulatorDemo, StatusDemo, TopUpDemo } from "@/components/site/FeatureDemos";

const features: { n: string; t: string; d: string; points: string[]; s: string; demo: ReactNode }[] = [
  {
    n: "Record",
    t: "Start a batch in seconds",
    d: "Each pan of oil is a batch. Choose the oil type and starting volume; the heat source and price are remembered from last time.",
    points: ["Six oil types, including repacked oil", "Optional price per liter for peso savings"],
    s: "Working",
    demo: <BatchDemo />,
  },
  {
    n: "Record",
    t: "Log a session in three taps",
    d: "Preset hours and three heat levels cover a normal session with no typing. Food and a measured temperature are optional.",
    points: ["1 to 5+ hour presets", "Low, medium, high = about 160, 175, 190 °C"],
    s: "Working",
    demo: <LogDemo />,
  },
  {
    n: "Decide",
    t: "Warning signs always win",
    d: "Smoke, thick foam, dark and murky or thickened oil (FSSAI signs) put a critical banner above everything, on every screen.",
    points: ["No chart or estimate can soften it", "Also blocks topping up that batch"],
    s: "Working",
    demo: <CheckDemo />,
  },
  {
    n: "Decide",
    t: "Ollie shows the status",
    d: "The engine turns your log into one of four states with up to three reasons. Ollie changes colour and mood with it.",
    points: ["TPC range from a model fitted to lab frying data", "Reasons cite their source"],
    s: "Model estimate",
    demo: <StatusDemo />,
  },
  {
    n: "Save",
    t: "Heat simulator",
    d: "See how many hours the oil has left at each heat level, and what frying one level lower saves you each week.",
    points: ["Uses your own average daily hours", "Peso savings when a price is set"],
    s: "Model estimate",
    demo: <SimulatorDemo />,
  },
  {
    n: "Save",
    t: "Top-up guard",
    d: "Top up with 0.25, 0.5 or 1 L presets. When the oil is past the limit or a warning sign is recorded, top-up is locked with the reason.",
    points: ["Fresh oil cannot rescue spent oil", "Replace instead, with one tap"],
    s: "Working",
    demo: <TopUpDemo />,
  },
  {
    n: "Review",
    t: "A complete history",
    d: "Every batch, session, top-up, check and replacement, grouped by day. Filter by type or search by food, sign or reason.",
    points: ["Closed batches stay intact", "Everything stays on your device"],
    s: "Working",
    demo: <HistoryDemo />,
  },
];

const extras = [
  { icon: WifiOff, t: "Works offline", d: "Records save locally; guidance uses built-in templates without a connection." },
  { icon: Moon, t: "Dark and light theme", d: "Dark by default, easy on the eyes at a night stall." },
  { icon: Compass, t: "Built-in guide", d: "A first-visit tour and a help sidebar on every workspace screen." },
  { icon: Settings, t: "Demo scenarios", d: "Load a full fictional dataset for each status to explore safely." },
  { icon: ScanLine, t: "Color analyzer", d: "Average color of a photo region. Experimental and never used for the status." },
];

export function FeaturesContent() {
  return (
    <>
      <PageIntro eyebrow="Features" title="A complete monitoring loop, from first pour to replacement." lead="Each feature below runs in the current prototype. Where a result is an estimate rather than a measurement, it says so.">
        <LinkButton href="/#signin" size="lg" className="mt-6">
          <LogIn className="size-4" aria-hidden="true" /> Sign in
        </LinkButton>
      </PageIntro>

      <div className="mx-auto max-w-[1240px] space-y-6 px-4 py-16 sm:px-6 lg:space-y-4">
        {features.map((f, i) => (
          <section key={f.t} aria-labelledby={`f-${i}`} className="grid items-center gap-8 border-b border-line py-10 last:border-b-0 lg:grid-cols-2 lg:gap-16">
            <Reveal className={i % 2 ? "lg:order-2" : ""}>
              <p className="font-mono text-[0.72rem] uppercase tracking-[0.14em] text-teal">
                <span className="text-accent">0{i + 1}</span> / {f.n}
              </p>
              <h2 id={`f-${i}`} className="mt-3 flex flex-wrap items-center gap-3 text-[1.7rem] font-extrabold text-ink sm:text-[2rem]">
                {f.t}
              </h2>
              <Tag tone={f.s === "Working" ? "green" : "amber"} className="mt-3">
                {f.s}
              </Tag>
              <p className="mt-4 max-w-lg text-[1.02rem] text-gray">{f.d}</p>
              <ul className="mt-4 space-y-1.5">
                {f.points.map((p) => (
                  <li key={p} className="flex gap-2 text-[0.94rem] text-ink/85">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-green" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={120} className={`mx-auto w-full max-w-md ${i % 2 ? "lg:order-1" : ""}`}>
              {f.demo}
            </Reveal>
          </section>
        ))}

        <section aria-labelledby="more-h" className="pt-10">
          <Reveal>
            <h2 id="more-h" className="text-[1.5rem] font-extrabold text-ink">
              Also included
            </h2>
          </Reveal>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {extras.map(({ icon: Icon, t, d }, i) => (
              <Reveal as="li" key={t} delay={i * 70} className="lift rounded-[var(--radius-m)] border border-line bg-surface p-5">
                <Icon className="size-5 text-accent" aria-hidden="true" />
                <h3 className="mt-3 font-bold text-ink">{t}</h3>
                <p className="mt-1 text-[0.88rem] text-gray">{d}</p>
              </Reveal>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
