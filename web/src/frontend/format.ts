// date and number formatting
const TZ = "Asia/Manila";
const LOCALE = "en-PH";

export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(LOCALE, { month: "short", day: "numeric", timeZone: TZ });
export const fmtDateLong = (iso: string) => new Date(iso).toLocaleDateString(LOCALE, { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: TZ });
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit", timeZone: TZ });
export const fmtDateTime = (iso: string) => `${fmtDate(iso)}, ${fmtTime(iso)}`;
export const fmtDayLabel = (day: string) => new Date(`${day}T12:00:00+08:00`).toLocaleDateString(LOCALE, { month: "short", day: "numeric", timeZone: TZ });
export const fmtLitres = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(2).replace(/0$/, "")} L`;
export const fmtHours = (n: number) => `${n} h`;
export const fmtPhp = (n: number) => `PHP ${n.toLocaleString(LOCALE, { maximumFractionDigits: 2 })}`;

export function daysBetween(a: string, b: string) {
  const k = (iso: string) => Date.parse(new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ }) + "T00:00:00Z");
  return Math.max(1, Math.round((k(b) - k(a)) / 86_400_000) + 1);
}

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}
