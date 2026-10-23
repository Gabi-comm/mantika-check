import { isTipId, type TipId } from "./tips";
import type { Action, Advice, OilStatus } from "./types";

export const TIP_TEXT: Record<TipId, string> = {
  filter_daily: "Salain ang mantika araw-araw para matanggal ang mga tutong.",
  cover_overnight: "Takpan ang mantika sa gabi para hindi mapasukan ng hangin at dumi.",
  lower_heat: "Magprito sa katamtamang apoy imbes na malakas para tumagal ang mantika.",
  check_heat: "Silipin ang apoy — ang bula ay puwedeng dahil sa sobrang init o frozen na pagkain.",
  top_up: "Dagdagan ng bagong mantika para mapahaba ang gamit.",
  change_oil: "Palitan na ang mantika ngayon.",
  dont_top_up: "Huwag nang dagdagan ang mantikang dapat nang palitan.",
};

const COPY: Record<Action, { headline: string; intro: string; close: string }> = {
  keep: {
    headline: "Ayos pa ang mantika mo",
    intro: "Puwede mo pang gamitin ang mantika.",
    close: "Ituloy lang ang tamang pag-aalaga.",
  },
  monitor: {
    headline: "Bantayan ang mantika",
    intro: "Ayos pa, pero bantayan ang mantika.",
    close: "Silipin ang kulay, amoy at usok habang nagluluto.",
  },
  change_soon: {
    headline: "Maghanda nang palitan ang mantika",
    intro: "Malapit nang kailangang palitan ang mantika.",
    close: "Maghanda na ng bagong mantika.",
  },
  change_now: {
    headline: "Palitan na ang mantika",
    intro: "Kailangan nang palitan ang mantika.",
    close: "Huwag na itong gamitin sa susunod na prito.",
  },
};

const TEMPLATE_REASONS = 2;

export function tipsFor(ids: string[]): Advice["tips"] {
  return ids.filter(isTipId).map((id) => ({ id, text: TIP_TEXT[id] }));
}

export function templateAdvice(status: OilStatus): Advice {
  const copy = COPY[status.action];
  const reasons = status.reasons.slice(0, TEMPLATE_REASONS).map((r) => `${r}.`);
  return {
    headline: copy.headline,
    messageTaglish: [copy.intro, ...reasons, copy.close].join(" "),
    tips: tipsFor(status.tips),
    source: "template",
  };
}
