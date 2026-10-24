// batch event timeline
import { Timer, Droplets, ClipboardCheck, RefreshCw, TriangleAlert } from "@/components/icons";
import type { BatchEvent } from "@/vendor/types";
import { copy } from "@/vendor/copy";
import { cx, fmtDate, fmtLitres, fmtTime } from "@/frontend/format";
import { Tag } from "@/components/ui";

export function eventTitle(e: BatchEvent): string {
  switch (e.kind) {
    case "session":
      return `${e.hours === 5 ? "5+" : e.hours} h session · ${copy.heat[e.heat]} heat`;
    case "topup":
      return `Top-up · ${fmtLitres(e.litres)}`;
    case "check":
      return e.signs.includes("smoke") ? "Quick check · critical sign" : "Quick check";
    case "replaced":
      return `Oil replaced · ${copy.reasons[e.reason]}`;
  }
}

export function eventDetail(e: BatchEvent): string {
  switch (e.kind) {
    case "session":
      return [e.foods.map((f) => copy.foods[f]).join(", "), e.tempC ? `${e.tempC} °C measured` : ""].filter(Boolean).join(" · ") || "No food recorded";
    case "topup":
      return "Fresh oil added to the batch";
    case "check": {
      const signs = e.signs.length ? e.signs.map((s) => copy.signs[s].title).join(", ") : "No listed signs noticed";
      const habits = [e.filtered ? "filtered" : "not filtered", e.covered ? "covered" : "not covered"].join(", ");
      return `${signs} · ${habits}`;
    }
    case "replaced":
      return `New batch started with ${fmtLitres(e.newLitres)}${e.note ? ` · ${e.note}` : ""}`;
  }
}

export const eventText = (e: BatchEvent) => `${eventTitle(e)} ${eventDetail(e)}`.toLowerCase();

const ICON = { session: Timer, topup: Droplets, check: ClipboardCheck, replaced: RefreshCw };

export function Timeline({ events, showDate = true, dense = false }: { events: BatchEvent[]; showDate?: boolean; dense?: boolean }) {
  if (!events.length) return <p className="px-5 py-6 text-[0.92rem] text-gray">Nothing recorded yet.</p>;
  return (
    <ol className="relative">
      {events.map((e, i) => {
        const critical = e.kind === "check" && e.signs.includes("smoke");
        const flagged = e.kind === "check" && e.signs.length > 0;
        const Icon = critical ? TriangleAlert : ICON[e.kind];
        return (
          <li key={e.id} className={cx("relative flex gap-3 px-5", dense ? "py-2.5" : "py-3")}>
            {i < events.length - 1 && <span className="absolute top-10 bottom-0 left-[2.15rem] w-px bg-line" aria-hidden="true" />}
            <span
              className={cx(
                "relative z-[1] grid size-8 shrink-0 place-items-center rounded-full border",
                critical ? "border-st-replace bg-st-replace-bg text-st-replace" : flagged ? "border-st-monitor/40 bg-st-monitor-bg text-st-monitor" : "border-line bg-surface text-teal"
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="font-semibold text-ink">{eventTitle(e)}</p>
                <time dateTime={e.at} className="font-mono text-[0.75rem] text-gray tabular">
                  {showDate ? `${fmtDate(e.at)} · ` : ""}
                  {fmtTime(e.at)}
                </time>
              </div>
              <p className="text-[0.88rem] text-gray">{eventDetail(e)}</p>
              {e.origin === "user" && <Tag tone="green" className="mt-1">{copy.demo.userBadge}</Tag>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
