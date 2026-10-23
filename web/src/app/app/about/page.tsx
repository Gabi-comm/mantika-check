import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Panel, Tag } from "@/components/ui";

export const metadata: Metadata = { title: "About & Limits" };

const rows: { what: string; source: string; tone: "green" | "amber" | "neutral" | "outline"; detail: string }[] = [
  { what: "Sessions, top-ups, replacements", source: "Logged by you", tone: "green", detail: "Exactly what was entered. Totals are simple sums." },
  { what: "Warning observations", source: "Reported by you", tone: "green", detail: "What you saw. Any reported warning sign triggers a critical warning (conservative prototype rule)." },
  { what: "Monitoring status", source: "Demo heuristic", tone: "amber", detail: "Placeholder weights on logged hours and heat level; any reported sign triggers Replace Oil. Food is recorded but not weighted. Not validated." },
  { what: "Heat comparison", source: "Demo heuristic", tone: "amber", detail: "Shows the heuristic's weighting only. Not a measured effect on oil life." },
  { what: "Guidance text", source: "Template", tone: "neutral", detail: "Fixed wording chosen by the status. It never decides the status." },
  { what: "Laboratory measurements", source: "Not available", tone: "outline", detail: "No polar-compound (TPC) or chemical readings are made or shown." },
];

export default function AboutLimitsPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Reference" title="About & Limits" lead="What each number in the workspace means, where it comes from, and what MANTIKA CHECK cannot tell you." />

      <Panel aria-labelledby="src-h" className="overflow-hidden">
        <h2 id="src-h" className="border-b border-line px-5 py-3.5 text-[1.02rem] font-bold">
          Information sources
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[0.92rem]">
            <thead className="bg-pale text-[0.78rem] text-gray max-sm:hidden">
              <tr>
                <th scope="col" className="px-5 py-2 font-medium">
                  Information
                </th>
                <th scope="col" className="px-5 py-2 font-medium">
                  Source
                </th>
                <th scope="col" className="px-5 py-2 font-medium">
                  What it means
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.what} className="max-sm:grid max-sm:gap-1.5 max-sm:py-3">
                  <th scope="row" className="px-5 py-3 font-semibold text-ink max-sm:py-0">
                    {r.what}
                  </th>
                  <td className="px-5 py-3 max-sm:py-0">
                    <Tag tone={r.tone}>{r.source}</Tag>
                  </td>
                  <td className="px-5 py-3 text-gray max-sm:py-0">{r.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel aria-labelledby="plan-h" className="p-5">
        <h2 id="plan-h" className="flex flex-wrap items-center gap-2 font-bold">
          Planned engine <Tag tone="amber">Team plan, not yet validated</Tag>
        </h2>
        <ul className="mt-3 space-y-2 text-gray">
          <li>The engine in development estimates oil wear from published laboratory frying data (Li, 2020) using a kinetic model. It is not connected to this app yet.</li>
          <li>The team's accuracy target is about ±3 TPC points (90% range). This has not been independently verified, so no TPC figure is shown.</li>
          <li>The 25% TPC level is a research benchmark used in Thailand, India and the EU. There is no Philippine legal limit, and this app makes no regulatory claim.</li>
          <li>The reference data comes from laboratory potato-chip frying, and the Low, Medium and High heat levels are approximate.</li>
          <li>A language model may later reword the decided status into plain guidance. It will never make the decision. Today all guidance is fixed template text.</li>
          <li>Records stay on this device. Nothing is sent anywhere in the current version; the plan is to send only anonymous facts when requesting reworded guidance.</li>
        </ul>
      </Panel>

      <div className="grid gap-5 md:grid-cols-2">
        <Panel className="p-5">
          <h2 className="font-bold">Not a laboratory instrument</h2>
          <p className="mt-2 text-gray">
            MANTIKA CHECK is a research prototype. It does not measure oil chemistry, does not certify that oil is fit for use, and makes no regulatory claim.
            Your own senses come first: unusual smoke, persistent foaming, dark and murky or thick oil are reasons to replace it.
          </p>
        </Panel>
        <Panel className="p-5">
          <h2 className="font-bold">Engine status</h2>
          <p className="mt-2 text-gray">
            The scoring engine is in development and not connected. Until it is, statuses come from a transparent in-browser heuristic with placeholder weights, labelled
            “Demo heuristic” wherever it appears.
          </p>
        </Panel>
        <Panel className="p-5">
          <h2 className="font-bold">Your data</h2>
          <p className="mt-2 text-gray">
            Everything stays in this browser. The workspace starts with fictional demo records; you can remove them or start fresh in{" "}
            <Link className="font-medium text-green underline" href="/app/settings">
              Settings
            </Link>
            .
          </p>
        </Panel>
        <Panel className="p-5">
          <h2 className="font-bold">Experimental color analyzer</h2>
          <p className="mt-2 text-gray">
            An earlier research tool that measures the average color of a photo region. Photo color is not an oil-quality measurement and is never used for the status.{" "}
            <Link className="font-medium text-green underline" href="/app/experimental/color">
              Open the analyzer
            </Link>
            .
          </p>
        </Panel>
      </div>
    </div>
  );
}
