const clean = (s: string) => s.replace(/[  ]/g, " ");
export const nf = (n: number) => clean(new Intl.NumberFormat("ru-RU").format(Math.round(n)));
export const money = (n: number) => `${nf(n)}\u00a0₸`;

export function plural(n: number, forms: [string, string, string]) {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}
export const count = (n: number, forms: [string, string, string]) => `${n} ${plural(n, forms)}`;

export function ago(t: number) {
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return "только что";
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  return d === 1 ? "вчера" : `${count(d, ["день", "дня", "дней"])} назад`;
}
export const clock = (t: number) => new Date(t).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromIso = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d, 12); };

export const isoDay = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return toIso(d); };
export const addDays = (iso: string, n: number) => { const d = fromIso(iso); d.setDate(d.getDate() + n); return toIso(d); };
export const today = () => isoDay(0);

const longDate = (iso: string) => fromIso(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
export const weekday = (iso: string) => fromIso(iso).toLocaleDateString("ru-RU", { weekday: "short" });

export function dayLabel(iso: string) {
  if (iso === isoDay(0)) return "сегодня";
  if (iso === isoDay(1)) return "завтра";
  if (iso === isoDay(-1)) return "вчера";
  return longDate(iso);
}
export const DayLabel = (iso: string) => { const s = dayLabel(iso); return s[0].toUpperCase() + s.slice(1); };

/** "5–7 октября", "30 сентября – 2 октября", or a single day. */
export function rangeLabel(iso: string, flex: number) {
  if (!flex) return dayLabel(iso);
  const a = fromIso(addDays(iso, -flex)), b = fromIso(addDays(iso, flex));
  if (a.getMonth() === b.getMonth()) return `${a.getDate()}–${b.getDate()} ${b.toLocaleDateString("ru-RU", { day: "numeric", month: "long" }).split(" ")[1]}`;
  return `${longDate(toIso(a))} – ${longDate(toIso(b))}`;
}

export const initials = (name: string) => name.replace(/[«»"()]/g, "").replace(/^(ТОО|ИП)\s+/, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
export const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
export const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
export const round10k = (n: number) => Math.round(n / 10000) * 10000;
