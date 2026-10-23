import type { Advice, OilStatus } from "./types";

export interface MockCase {
  status: OilStatus;
  advice: Advice;
}

const HARD_RULE = "Hard rule (FSSAI): usok, bula o maitim na mantika — palitan na.";

export const mockKeep: MockCase = {
  status: {
    action: "keep",
    urgency: 15,
    tpc: { est: 12.1, low: 9.1, high: 15.1 },
    hoursUsed: 2,
    hoursLeftNow: 13.6,
    hoursLeftLowerHeat: 25.4,
    reasons: ["Mababa pa ang tantiyang TPC", "Walang nakitang senyales sa mantika"],
    noTopUp: false,
    tips: ["filter_daily", "cover_overnight"],
  },
  advice: {
    headline: "Ayos pa ang mantika mo",
    messageTaglish: "Mababa pa ang tantiyang TPC at walang senyales ng pagkasira. Puwede mo pang gamitin ito.",
    tips: [
      { id: "filter_daily", text: "Salain ang mantika araw-araw para matanggal ang mga tutong." },
      { id: "cover_overnight", text: "Takpan ang mantika sa gabi para hindi mapasukan ng hangin at dumi." },
    ],
    source: "template",
  },
};

export const mockMonitor: MockCase = {
  status: {
    action: "monitor",
    urgency: 45,
    tpc: { est: 17.4, low: 14.4, high: 20.4 },
    hoursUsed: 9,
    hoursLeftNow: 6.4,
    hoursLeftLowerHeat: 11.8,
    reasons: ["Papalapit na sa limitasyon ang tantiyang TPC", "Mabigat ang piniprito"],
    noTopUp: false,
    tips: ["filter_daily", "lower_heat", "top_up"],
  },
  advice: {
    headline: "Bantayan ang mantika",
    messageTaglish: "Papalapit na sa limitasyon ang tantiyang TPC. Bantayan ang kulay at usok habang nagluluto.",
    tips: [
      { id: "filter_daily", text: "Salain ang mantika araw-araw para matanggal ang mga tutong." },
      { id: "lower_heat", text: "Magprito sa katamtamang apoy imbes na malakas para tumagal ang mantika." },
      { id: "top_up", text: "Dagdagan ng bagong mantika para mapahaba ang gamit." },
    ],
    source: "template",
  },
};

export const mockChangeSoon: MockCase = {
  status: {
    action: "change_soon",
    urgency: 68,
    tpc: { est: 20.2, low: 17.2, high: 23.2 },
    hoursUsed: 14,
    hoursLeftNow: 2.1,
    hoursLeftLowerHeat: 3.9,
    reasons: ["Papalapit na sa limitasyon ang tantiyang TPC", "May ilang senyales sa mantika"],
    noTopUp: false,
    tips: ["lower_heat", "filter_daily"],
  },
  advice: {
    headline: "Maghanda nang palitan ang mantika",
    messageTaglish: "Malapit na sa limitasyon ang tantiyang TPC at may ilang senyales na. Maghanda ng bagong mantika.",
    tips: [
      { id: "lower_heat", text: "Magprito sa katamtamang apoy imbes na malakas para tumagal ang mantika." },
      { id: "filter_daily", text: "Salain ang mantika araw-araw para matanggal ang mga tutong." },
    ],
    source: "template",
  },
};

export const mockChangeNow: MockCase = {
  status: {
    action: "change_now",
    urgency: 88,
    tpc: { est: 27.4, low: 24.4, high: 30.4 },
    hoursUsed: 15,
    hoursLeftNow: 0,
    hoursLeftLowerHeat: 0,
    reasons: ["Mataas na ang tantiyang TPC", "Mabigat ang piniprito"],
    noTopUp: true,
    tips: ["change_oil", "dont_top_up"],
  },
  advice: {
    headline: "Palitan na ang mantika",
    messageTaglish: "Mataas na ang tantiyang TPC ng mantika mo. Palitan na ito bago magprito ulit.",
    tips: [
      { id: "change_oil", text: "Palitan na ang mantika ngayon." },
      { id: "dont_top_up", text: "Huwag nang dagdagan ang mantikang dapat nang palitan." },
    ],
    source: "template",
  },
};

export const mockHardRuleSmoke: MockCase = {
  status: {
    action: "change_now",
    urgency: 90,
    tpc: { est: 14.6, low: 11.6, high: 17.6 },
    hoursUsed: 5,
    hoursLeftNow: 9.9,
    hoursLeftLowerHeat: 18.2,
    reasons: [HARD_RULE, "Maraming senyales sa mantika"],
    hardRule: HARD_RULE,
    noTopUp: false,
    tips: ["change_oil", "check_heat"],
  },
  advice: {
    headline: "Palitan na — may usok ang mantika",
    messageTaglish: "Umuusok ang mantika, kaya palitan na ito kahit mababa pa ang tantiyang TPC.",
    tips: [
      { id: "change_oil", text: "Palitan na ang mantika ngayon." },
      { id: "check_heat", text: "Silipin ang apoy — ang bula ay puwedeng dahil sa sobrang init o frozen na pagkain." },
    ],
    source: "template",
  },
};

export const MOCKS = {
  keep: mockKeep,
  monitor: mockMonitor,
  change_soon: mockChangeSoon,
  change_now: mockChangeNow,
  hard_rule_smoke: mockHardRuleSmoke,
} as const;
