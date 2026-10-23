export const TIP_IDS = ["filter_daily", "cover_overnight", "lower_heat", "top_up", "change_oil", "dont_top_up"] as const;

export type TipId = (typeof TIP_IDS)[number];

export function isTipId(id: string): id is TipId {
  return (TIP_IDS as readonly string[]).includes(id);
}
