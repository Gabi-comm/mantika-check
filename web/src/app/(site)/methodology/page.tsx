import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { PageIntro } from "@/components/site/PageIntro";
import { Tag } from "@/components/ui";
import { HEAT_WEIGHT, THRESHOLDS } from "@/vendor/adapter";
import { copy } from "@/vendor/copy";

export const metadata: Metadata = { title: "Methodology" };

const pipeline = [
  { t: "Batch record", d: "Each pan of oil is a batch with its type, starting volume and heat source.", src: "Logged" },
  { t: "Exposure log", d: "Every session adds duration, heat level and food categories. Totals are plain sums.", src: "Logged" },
  { t: "Observations", d: "Quick checks store the signs the vendor noticed, plus filtering and covering habits.", src: "Observed" },
  { t: "Hard rules", d: "Any reported warning sign is evaluated first and overrides everything else. A conservative prototype rule, not a chemical measurement.", src: "Observed" },
  { t: "Status estimate", d: "A scoring step maps the record to one of four states and lists up to three contributing factors.", src: "Estimated" },
  { t: "Guidance", d: "Template text selected by the status. A language model may reword it later; it may never change the decision.", src: "Template" },
];

export default function MethodologyPage() {
  return (
    <>
      <PageIntro
        eyebrow="Methodology"
        title="How a status is formed, and where its knowledge ends."
        lead="MANTIKA CHECK estimates oil wear from how the oil was used and what the vendor observed. It does not measure oil chemistry."
      />
      <div className="mx-auto max-w-[1240px] space-y-16 px-4 py-16 sm:px-6">
        <section aria-labelledby="p-h" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <div>
            <h2 id="p-h" className="text-[1.8rem] font-extrabold text-ink">
              The pipeline
            </h2>
            <p className="mt-2 max-w-md text-gray">Six steps, each tagged with the kind of information it handles. Layers never mix: an estimate is never shown as an observation.</p>
          </div>
          <ol className="relative border-l border-line pl-6">
            {pipeline.map((p, i) => (
              <li key={p.t} className="relative pb-7 last:pb-0">
                <span className="absolute top-0.5 -left-[2.05rem] grid size-5 place-items-center rounded-full border border-green bg-white font-mono text-[0.6rem] text-green">{i + 1}</span>
                <p className="flex flex-wrap items-center gap-2 font-display text-[1.05rem] font-bold text-ink">
                  {p.t}
                  <Tag tone={p.src === "Estimated" ? "amber" : p.src === "Template" ? "neutral" : "green"}>{p.src}</Tag>
                </p>
                <p className="mt-1 text-gray">{p.d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="h-h" className="rounded-[var(--radius-l)] border border-line bg-white">
          <div className="border-b border-line p-6">
            <p className="eyebrow">Current status engine</p>
            <h2 id="h-h" className="mt-1 text-[1.5rem] font-extrabold text-ink">
              Demo heuristic, published in full
            </h2>
            <p className="mt-2 max-w-2xl text-gray">
              Until the engine is validated, the prototype uses a transparent placeholder. Its weights and thresholds are listed here so nobody mistakes them for measured
              values.
            </p>
          </div>
          <div className="grid gap-px bg-line md:grid-cols-3">
            <div className="bg-white p-6">
              <p className="font-semibold text-ink">Heat weighting per hour</p>
              <ul className="mt-3 space-y-1 font-mono text-[0.9rem]">
                {(["low", "medium", "high"] as const).map((h) => (
                  <li key={h} className="flex justify-between">
                    <span>{copy.heat[h]}</span>
                    <span>×{HEAT_WEIGHT[h].toFixed(1)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-6">
              <p className="font-semibold text-ink">Hard rule</p>
              <p className="mt-3 text-[0.92rem] text-gray">
                Any of the four reported warning signs (smoke, foaming, dark and murky, thick) sets {copy.status.change_now} with a critical warning, regardless of hours. Food
                categories are recorded and passed to the engine, but the demo heuristic gives them no weight.
              </p>
            </div>
            <div className="bg-white p-6">
              <p className="font-semibold text-ink">State thresholds (index)</p>
              <ul className="mt-3 space-y-1 font-mono text-[0.9rem]">
                <li className="flex justify-between">
                  <span>{copy.status.monitor}</span>
                  <span>≥ {THRESHOLDS.monitor}</span>
                </li>
                <li className="flex justify-between">
                  <span>{copy.status.change_soon}</span>
                  <span>≥ {THRESHOLDS.change_soon}</span>
                </li>
                <li className="flex justify-between">
                  <span>{copy.status.change_now}</span>
                  <span>≥ {THRESHOLDS.change_now}</span>
                </li>
              </ul>
            </div>
          </div>
          <p className="border-t border-line p-6 text-[0.88rem] text-gray">The index is unitless. It is not a percentage of polar compounds and has no physical interpretation. The demo heuristic produces no remaining-hours forecast and no TPC estimate; those fields stay empty until a validated engine supplies them, and usage beyond 30 logged hours is stated as a reason because the reference frying data the engine is being built on covers 0 to 30 hours.</p>
        </section>

        <section aria-labelledby="l-h" className="grid gap-8 rounded-[var(--radius-l)] bg-ink p-7 text-white sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div>
            <ShieldAlert className="size-7 text-mint" aria-hidden="true" />
            <h2 id="l-h" className="mt-4 text-[1.8rem] font-extrabold">
              Limitations
            </h2>
          </div>
          <ul className="space-y-4 text-white/85">
            <li>The status is not a measurement of total polar compounds (TPC). No TPC value, range or uncertainty is displayed.</li>
            <li>The research degradation model and its thresholds are still under evaluation; nothing here should be read as a validated result.</li>
            <li>The 25% TPC figure discussed in frying-oil literature is a research reference, not a rule applied by this prototype, and no legal or regulatory claim is made.</li>
            <li>No remaining-life forecast, cost-saving figure or safety certification is offered.</li>
            <li>Photo color analysis is retained only as an isolated experiment and does not feed the status.</li>
          </ul>
        </section>
      </div>
    </>
  );
}
