// fixed advice text used when the llm is off or fails
import { isTipId, type TipId } from "./tips";
import type { Action, Advice, OilStatus } from "./types";

export const TIP_TEXT: Record<TipId, string> = {
  filter_daily: "Filter the oil every day to remove burnt bits.",
  cover_overnight: "Cover the oil when not in use to keep out air and dirt.",
  lower_heat: "Fry one heat level lower to make the oil last longer.",
  top_up: "Top up with fresh oil to bring the TPC down.",
  change_oil: "Change the oil now.",
  dont_top_up: "Don't top up this oil — replace it instead.",
};

const COPY: Record<Action, { headline: string; intro: string; close: string }> = {
  keep: {
    headline: "Your oil is still good",
    intro: "You can keep using this oil.",
    close: "Keep up the good care.",
  },
  monitor: {
    headline: "Keep an eye on the oil",
    intro: "Still usable, but watch the oil closely.",
    close: "Check its colour and smoke while frying.",
  },
  change_soon: {
    headline: "Get ready to change the oil",
    intro: "The oil will need changing soon.",
    close: "Have fresh oil ready.",
  },
  change_now: {
    headline: "Change the oil now",
    intro: "This oil needs to be changed.",
    close: "Don't use it for the next batch.",
  },
};

const TEMPLATE_REASONS = 2;

export function tipsFor(ids: string[]): Advice["tips"] {
  return ids.filter(isTipId).map((id) => ({ id, text: TIP_TEXT[id] }));
}

export function templateAdvice(status: OilStatus): Advice {
  const copy = COPY[status.action];
  const reasons = status.reasons.slice(0, TEMPLATE_REASONS).map((r) => `${r.replace(/[.!?]+$/, "")}.`);
  return {
    headline: copy.headline,
    messageTaglish: [copy.intro, ...reasons, copy.close].join(" "),
    tips: tipsFor(status.tips),
    source: "template",
  };
}
