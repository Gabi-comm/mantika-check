import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ShieldAlert, ChevronDown, ClipboardList, Calculator, Scale, Thermometer, GitBranch, ShieldCheck, Droplet } from "@/components/icons";
import { PageIntro } from "@/components/site/PageIntro";
import { Tag } from "@/components/ui";
import { Ollie } from "@/components/Ollie";
import { Reveal } from "@/components/motion/Reveal";
import { heatToC, oilCox } from "@/lib/inputs";
import { DATA_MAX_HOURS, MODEL, TPC_LIMIT } from "@/lib/model";
import { DEFAULT_FUZZY_PARAMS, ruleBase } from "@/lib/rules";
import { ADVISORY_REUSE, HARD_RULE_SIGNS, HARD_RULE_TPC } from "@/lib/safety";
import type { OilType } from "@/lib/types";
import { copy } from "@/vendor/copy";

export const metadata: Metadata = { title: "Methodology" };

const quick = [
  { icon: ClipboardList, t: "You log", d: "Hours, heat level, food and top-ups for each pan of oil, plus any warning signs you see." },
  { icon: Calculator, t: "It estimates", d: "A model fitted to lab frying data turns that log into an estimated polar-compound (TPC) range." },
  { icon: Scale, t: "It decides", d: "Rules turn the estimate into one of four statuses. Warning signs override everything." },
];

const bands = ["TPC under 20%", "around 20%", "20 to 24%", "25% or a warning sign"];

const pipeline = [
  { t: "Batch record", d: "Oil type, starting volume and heat source.", src: "Logged" },
  { t: "Exposure log", d: "Each session adds hours, heat and food.", src: "Logged" },
  { t: "Observations", d: "Signs you noticed, plus filtering and covering.", src: "Observed" },
  { t: "TPC estimate", d: "Kinetic model, chained across heat changes and top-ups.", src: "Estimated" },
  { t: "Fuzzy rules", d: "Five rules combine TPC, breaded share and oil type.", src: "Estimated" },
  { t: "Safety rules", d: "Signs or over 25% TPC force a change. Only ever stricter.", src: "Observed" },
  { t: "Guidance", d: "Template text; an AI may reword it, never re-decide.", src: "Template" },
];

function Detail({ icon: Icon, title, summary, children, open }: { icon: typeof Droplet; title: string; summary: string; children: ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group h-fit rounded-[var(--radius-l)] border border-line bg-surface transition-colors open:border-line-strong">
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-s)] bg-tint text-accent">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[1.08rem] font-bold text-ink">{title}</span>
          <span className="block text-[0.88rem] text-gray">{summary}</span>
        </span>
        <ChevronDown className="size-5 shrink-0 text-gray transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="fade-up border-t border-line px-5 py-5">{children}</div>
    </details>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <li className="flex justify-between gap-4 border-b border-line py-2 last:border-b-0">
      <span className="text-gray">{k}</span>
      <span className="font-mono text-ink">{v}</span>
    </li>
  );
}

export default function MethodologyPage() {
  const rules = ruleBase().rules;
  return (
    <>
      <PageIntro
        eyebrow="Methodology"
        title="How a status is formed, and where its knowledge ends."
        lead="Mantika Check estimates oil wear from how the oil was used and what you observed. It does not measure oil chemistry."
      />
      <div className="mx-auto max-w-[1240px] space-y-20 px-4 py-16 sm:px-6">
        <section aria-labelledby="q-h">
          <Reveal>
            <p className="eyebrow">In one minute</p>
            <h2 id="q-h" className="mt-2 text-[1.8rem] font-extrabold text-ink">
              Three steps, every time you log.
            </h2>
          </Reveal>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {quick.map(({ icon: Icon, t, d }, i) => (
              <Reveal as="li" key={t} delay={i * 100} className="lift relative rounded-[var(--radius-l)] border border-line bg-surface p-6">
                <span className="absolute top-5 right-5 font-display text-[2.6rem] leading-none font-extrabold text-line-strong">{i + 1}</span>
                <span className="grid size-11 place-items-center rounded-[var(--radius-s)] bg-tint text-accent">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-[1.2rem] font-bold text-ink">{t}</h3>
                <p className="mt-1.5 text-gray">{d}</p>
              </Reveal>
            ))}
          </ol>
          <Reveal className="mt-6 grid gap-5 rounded-[var(--radius-l)] border border-dashed border-line-strong p-6 sm:grid-cols-2 lg:grid-cols-4">
            {(["keep", "monitor", "change_soon", "change_now"] as const).map((a, i) => (
              <div key={a} className="flex items-center gap-3">
                <Ollie state={a} size={44} />
                <div>
                  <p className="font-semibold text-ink">{copy.status[a]}</p>
                  <p className="font-mono text-[0.75rem] text-gray">{bands[i]}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </section>

        <section aria-labelledby="p-h">
          <Reveal>
            <p className="eyebrow">The pipeline</p>
            <h2 id="p-h" className="mt-2 text-[1.8rem] font-extrabold text-ink">
              Seven steps, each labelled with its kind of information.
            </h2>
            <p className="mt-2 max-w-2xl text-gray">An estimate is never shown as an observation, and an observation is never shown as a measurement.</p>
          </Reveal>
          <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {pipeline.map((p, i) => (
              <Reveal as="li" key={p.t} delay={i * 60} className="flex flex-col rounded-[var(--radius-m)] border border-line bg-surface p-4">
                <span className="font-mono text-[0.7rem] text-teal">0{i + 1}</span>
                <p className="mt-2 font-display font-bold text-ink">{p.t}</p>
                <p className="mt-1 flex-1 text-[0.85rem] text-gray">{p.d}</p>
                <Tag tone={p.src === "Estimated" ? "amber" : p.src === "Template" ? "neutral" : "green"} className="mt-3 w-fit">
                  {p.src}
                </Tag>
              </Reveal>
            ))}
          </ol>
        </section>

        <section aria-labelledby="n-h">
          <Reveal>
            <p className="eyebrow">The numbers</p>
            <h2 id="n-h" className="mt-2 text-[1.8rem] font-extrabold text-ink">
              Published in full. Open any part.
            </h2>
            <p className="mt-2 max-w-2xl text-gray">Every value is read from the engine code itself. They come from published frying studies and lab data, not from your pan.</p>
          </Reveal>
          <div className="mt-8 grid items-start gap-3 lg:grid-cols-2">
            <Detail icon={Thermometer} title="TPC model" summary={`Arrhenius power law · ±${MODEL.halfWidth.toFixed(2)} points (90%)`} open>
              <ul className="text-[0.92rem]">
                <Row k="Fresh oil TPC" v={`${MODEL.c0.toFixed(1)}%`} />
                <Row k="Activation energy" v={`${(MODEL.Ea / 1000).toFixed(1)} kJ/mol`} />
                <Row k="Order n" v={MODEL.n.toFixed(2)} />
                <Row k="Data covers" v={`0–${DATA_MAX_HOURS} h`} />
                {(["low", "medium", "high"] as const).map((h) => (
                  <Row key={h} k={`${copy.heat[h]} heat`} v={`${heatToC(h)} °C`} />
                ))}
              </ul>
              <p className="mt-3 text-[0.85rem] text-gray">Decisions use the high end of the range, so advice errs toward changing oil early.</p>
            </Detail>
            <Detail icon={GitBranch} title="Fuzzy rules" summary={`${rules.length} rules · status cut-offs ${DEFAULT_FUZZY_PARAMS.cuts.join(" / ")}`}>
              <ol className="space-y-2 text-[0.92rem] text-ink/85">
                {rules.map((r, i) => (
                  <li key={r.label} className="flex gap-3">
                    <span className="font-mono text-[0.78rem] text-teal">R{i + 1}</span>
                    {r.label}
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-[0.85rem] text-gray">Food and oil type can only raise urgency, never lower it.</p>
            </Detail>
            <Detail icon={ShieldCheck} title="Safety rules" summary="Run last · can only make advice stricter">
              <ul className="space-y-2 text-[0.92rem] text-ink/85">
                <li>{HARD_RULE_SIGNS}</li>
                <li>{HARD_RULE_TPC}</li>
                <li>No top-up once the high estimate reaches {TPC_LIMIT}% TPC, or after a warning sign.</li>
                <li>{ADVISORY_REUSE}</li>
              </ul>
            </Detail>
            <Detail icon={Droplet} title="Oil stability (Cox)" summary="Higher value means the oil breaks down more easily">
              <ul className="text-[0.92rem]">
                {(["coconut", "palm_olein", "corn", "sunflower", "soybean"] as OilType[]).map((o) => (
                  <Row key={o} k={copy.oilTypes[o]} v={oilCox(o).toFixed(2)} />
                ))}
              </ul>
            </Detail>
          </div>
        </section>

        <section aria-labelledby="l-h" className="grid gap-8 rounded-[var(--radius-l)] bg-night p-7 text-white sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <Reveal>
            <ShieldAlert className="size-7 text-mint" aria-hidden="true" />
            <h2 id="l-h" className="mt-4 text-[1.8rem] font-extrabold">
              Limitations
            </h2>
          </Reveal>
          <ul className="space-y-4 text-white/85">
            <li>The TPC shown is a model estimate from logged hours and heat, not a measurement. Only a test strip or lab test measures TPC.</li>
            <li>The model was fitted on lab frying data and has not been validated at real stalls; this is a research prototype.</li>
            <li>The 25% TPC limit follows rules used in Thailand and India; no legal or regulatory claim is made for the Philippines.</li>
            <li>Hours-left forecasts and peso savings are estimates. No safety certification is offered.</li>
            <li>Photo color analysis is an isolated experiment and does not feed the status.</li>
          </ul>
        </section>
      </div>
    </>
  );
}
