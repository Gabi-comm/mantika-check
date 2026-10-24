// status card, reasons, advice and forecast panels
import { CircleCheck, Eye, Clock3, OctagonAlert, Info, Loader2, FileText } from "@/components/icons";
import type { Action, AdviceResult, StatusResult } from "@/vendor/types";
import { DATA_RANGE_HOURS } from "@/vendor/adapter";
import { adviceCopy, copy, forecastCopy } from "@/vendor/copy";
import { cx } from "@/frontend/format";
import { OllieStage } from "@/components/OllieStage";
import { Panel, PanelHead, Tag } from "@/components/ui";

export const STATUS_ICON = { keep: CircleCheck, monitor: Eye, change_soon: Clock3, change_now: OctagonAlert } satisfies Record<Action, unknown>;
export const STATUS_TONE = {
  keep: { text: "text-st-continue", bg: "bg-st-continue-bg", bar: "bg-st-continue", tag: "green" },
  monitor: { text: "text-st-monitor", bg: "bg-st-monitor-bg", bar: "bg-st-monitor", tag: "amber" },
  change_soon: { text: "text-st-recommend", bg: "bg-st-recommend-bg", bar: "bg-st-recommend", tag: "orange" },
  change_now: { text: "text-st-replace", bg: "bg-st-replace-bg", bar: "bg-st-replace", tag: "red" },
} as const;
const ORDER: Action[] = ["keep", "monitor", "change_soon", "change_now"];

export function StatusScale({ action, compact }: { action: Action; compact?: boolean }) {
  const i = ORDER.indexOf(action);
  return (
    <ol className="grid grid-cols-4 gap-1.5" aria-label={`Monitoring scale, step ${i + 1} of 4: ${copy.status[action]}`}>
      {ORDER.map((a, k) => (
        <li key={a} className="min-w-0" aria-current={k === i ? "step" : undefined}>
          <span className={cx("ink-bar block h-2 rounded-full", k <= i ? STATUS_TONE[action].bar : "bg-line")} />
          {!compact && <span className={cx("mt-1.5 hidden truncate sm:block text-[0.7rem] leading-tight", k === i ? "font-semibold text-ink" : "text-gray")}>{copy.status[a]}</span>}
        </li>
      ))}
    </ol>
  );
}

export function StatusPanel({ result, batchLabel }: { result: StatusResult; batchLabel?: string }) {
  const { action, hardRule } = result.status;
  const Icon = STATUS_ICON[action];
  const tone = STATUS_TONE[action];
  return (
    <Panel aria-labelledby="status-word" className={cx("overflow-hidden", hardRule && "border-st-replace")}>
      <div className={cx("flex items-start gap-4 p-5", tone.bg)}>
        <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-m)] bg-ollie-night">
          <OllieStage state={action} size={44} quip={false} title={`Ollie: ${copy.status[action]}`} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="eyebrow flex items-center gap-1.5">
            <Icon className={cx("size-3.5", tone.text)} aria-hidden="true" /> Monitoring status{batchLabel ? ` · ${batchLabel}` : ""}
          </p>
          <h2 id="status-word" className={cx("mt-0.5 text-[1.6rem] font-extrabold sm:text-[1.9rem]", tone.text)}>
            {copy.status[action]}
          </h2>
          <p className="mt-1 max-w-prose text-ink/80">{copy.statusDetail[action]}</p>
        </div>
      </div>
      <div className="px-5 py-4">
        <StatusScale action={action} />
      </div>
    </Panel>
  );
}

export function WhyPanel({ reasons, idx = "" }: { reasons: string[]; idx?: string }) {
  return (
    <Panel aria-labelledby={`why-h${idx}`}>
      <PanelHead id={`why-h${idx}`} title={copy.why} eyebrow="Contributing factors" />
      {reasons.length ? (
        <ol className="divide-y divide-line">
          {reasons.slice(0, 3).map((r, i) => (
            <li key={r} className="flex gap-3 px-5 py-3">
              <span className="font-mono text-[0.75rem] text-teal tabular">0{i + 1}</span>
              <span className="text-ink">{r}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="px-5 py-4 text-gray">{copy.whyEmpty}</p>
      )}
    </Panel>
  );
}

export function AdvicePanel({ advice, loading, idx = "" }: { advice: AdviceResult | null; loading: boolean; idx?: string }) {
  const a = advice?.advice ?? null;
  const d = advice?.delivery;
  return (
    <Panel aria-labelledby={`advice-h${idx}`} aria-busy={loading}>
      <PanelHead
        id={`advice-h${idx}`}
        title={adviceCopy.title}
        eyebrow="Next steps"
        action={
          a && (
            <Tag tone="outline" title={a.source === "llm" ? adviceCopy.llmTitle : adviceCopy.templateTitle}>
              <FileText className="size-3" aria-hidden="true" />
              {a.source === "llm" ? adviceCopy.llm : adviceCopy.template}
            </Tag>
          )
        }
      />
      <div className="px-5 py-4">
        {a ? (
          <>
            <p className="font-semibold text-ink">{a.headline}</p>
            <p className="mt-1 text-[0.95rem] text-gray">{a.messageTaglish}</p>
            <ul className="mt-3 space-y-1.5">
              {a.tips.map((t) => (
                <li key={t.id} className="flex gap-2 text-[0.95rem]">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-teal" aria-hidden="true" />
                  {t.text}
                </li>
              ))}
            </ul>
          </>
        ) : d === "missing" ? (
          <p className="text-gray">{adviceCopy.missing}</p>
        ) : (
          <div className="space-y-2" aria-hidden="true">
            <div className="skeleton h-4 w-2/3" />
            <div className="skeleton h-3 w-full" />
          </div>
        )}
        {(d === "offline-template" || d === "error-template") && !loading && (
          <p className="mt-3 text-[0.8rem] text-gray" role="status">
            {d === "offline-template" ? adviceCopy.offline : adviceCopy.error}
          </p>
        )}
        {loading && (
          <p role="status" className="mt-3 flex items-center gap-2 text-[0.8rem] text-gray">
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> {adviceCopy.loading}
          </p>
        )}
      </div>
    </Panel>
  );
}

export function ForecastPanel({ result }: { result: StatusResult }) {
  const st = result.status;
  const canForecast = !st.hardRule && result.validation !== "illustrative";
  const blockedWhy = st.hardRule ? forecastCopy.warningWhy : forecastCopy.unavailableWhy;
  const nowBeyond = st.hoursUsed + st.hoursLeftNow > DATA_RANGE_HOURS;
  const val = (v: number | null, unit: string) =>
    canForecast && nowBeyond ? (
      <span title={forecastCopy.beyondWhy}>{forecastCopy.beyond}</span>
    ) : canForecast && v !== null ? (
      <span>
        {v} <span className="text-[0.8rem] font-medium text-gray">{unit}</span>
      </span>
    ) : (
      <span className="text-[0.95rem] text-gray">{forecastCopy.unavailable}</span>
    );
  return (
    <Panel aria-labelledby="fc-h">
      <PanelHead id="fc-h" title={forecastCopy.title} eyebrow="Engine outputs" action={<Tag tone="outline">{result.validation === "validated" ? "Validated" : copy.illustrative}</Tag>} />
      <dl className="grid grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x">
        <div className="px-5 py-4">
          <dt className="text-[0.78rem] text-gray">{forecastCopy.fryingDays}</dt>
          <dd className="font-display text-xl font-bold tabular">{st.fryingDays}</dd>
        </div>
        <div className="px-5 py-4">
          <dt className="text-[0.78rem] text-gray">{forecastCopy.hoursUsed}</dt>
          <dd className="font-display text-xl font-bold tabular">{st.hoursUsed} h</dd>
        </div>
        <div className="px-5 py-4">
          <dt className="text-[0.78rem] text-gray">{forecastCopy.remaining}</dt>
          <dd className="font-display text-xl font-bold tabular">
            {val(st.hoursLeftNow, "h")}
          </dd>
        </div>
        <div className="px-5 py-4">
          <dt className="text-[0.78rem] text-gray">{forecastCopy.tpc}</dt>
          <dd className="font-display text-xl font-bold tabular">
            {canForecast && st.tpc ? (
              <span>
                {st.tpc.low} to {st.tpc.high}% <span className="block text-[0.7rem] font-medium text-gray">{forecastCopy.modelEstimate}</span>
              </span>
            ) : (
              <span className="text-[0.95rem] text-gray">{forecastCopy.unavailable}</span>
            )}
          </dd>
        </div>
      </dl>
      {!canForecast && <p className="border-t border-line px-5 py-3 text-[0.8rem] text-gray">{blockedWhy}</p>}
    </Panel>
  );
}

export function InlineNote({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warn" | "ok" | "error" }) {
  const t = {
    info: "border-line bg-pale text-ink",
    warn: "border-st-monitor/30 bg-st-monitor-bg text-ink",
    ok: "border-st-continue/30 bg-st-continue-bg text-ink",
    error: "border-st-replace/40 bg-st-replace-bg text-st-replace",
  }[tone];
  return (
    <div className={cx("flex gap-3 rounded-[var(--radius-s)] border px-4 py-3 text-[0.92rem]", t)} role={tone === "error" ? "alert" : "status"}>
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
