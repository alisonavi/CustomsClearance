export type Country = "CN" | "KZ" | "UZ" | "KG";

export const COUNTRIES: Record<Country, { name: string; whole: string; flag: string }> = {
  CN: { name: "Китай", whole: "Весь Китай", flag: "CN" },
  KZ: { name: "Казахстан", whole: "Весь Казахстан", flag: "KZ" },
  UZ: { name: "Узбекистан", whole: "Весь Узбекистан", flag: "UZ" },
  KG: { name: "Кыргызстан", whole: "Весь Кыргызстан", flag: "KG" },
};

export type City = { id: string; name: string; country: Country; lat: number; lon: number; alt: string[]; popular?: boolean };

export const CITIES: City[] = [
  { id: "urumqi", name: "Урумчи", country: "CN", lat: 43.83, lon: 87.62, alt: ["urumqi", "urumchi", "ürümqi"], popular: true },
  { id: "khorgos-cn", name: "Хоргос", country: "CN", lat: 44.21, lon: 80.42, alt: ["khorgos", "horgos", "korgas", "хоргас"], popular: true },
  { id: "yiwu", name: "Иу", country: "CN", lat: 29.31, lon: 120.08, alt: ["yiwu", "иву"], popular: true },
  { id: "guangzhou", name: "Гуанчжоу", country: "CN", lat: 23.13, lon: 113.26, alt: ["guangzhou", "кантон"] },
  { id: "kashgar", name: "Кашгар", country: "CN", lat: 39.47, lon: 75.99, alt: ["kashgar", "kashi", "каши"] },
  { id: "alashankou", name: "Алашанькоу", country: "CN", lat: 45.17, lon: 82.57, alt: ["alashankou"] },
  { id: "xian", name: "Сиань", country: "CN", lat: 34.34, lon: 108.94, alt: ["xian", "xi'an"] },
  { id: "khorgos-kz", name: "Хоргос", country: "KZ", lat: 44.18, lon: 80.3, alt: ["khorgos", "horgos", "нур жолы", "nur zholy"], popular: true },
  { id: "zharkent", name: "Жаркент", country: "KZ", lat: 44.16, lon: 80.0, alt: ["zharkent", "жаркент"] },
  { id: "almaty", name: "Алматы", country: "KZ", lat: 43.24, lon: 76.89, alt: ["almaty", "алма-ата", "alma-ata"], popular: true },
  { id: "astana", name: "Астана", country: "KZ", lat: 51.17, lon: 71.45, alt: ["astana", "нур-султан", "nur-sultan"], popular: true },
  { id: "shymkent", name: "Шымкент", country: "KZ", lat: 42.34, lon: 69.59, alt: ["shymkent", "чимкент"], popular: true },
  { id: "karaganda", name: "Караганда", country: "KZ", lat: 49.8, lon: 73.1, alt: ["karaganda", "караганды", "qaragandy"] },
  { id: "aktobe", name: "Актобе", country: "KZ", lat: 50.28, lon: 57.21, alt: ["aktobe", "актюбинск"] },
  { id: "atyrau", name: "Атырау", country: "KZ", lat: 47.1, lon: 51.92, alt: ["atyrau"] },
  { id: "aktau", name: "Актау", country: "KZ", lat: 43.65, lon: 51.17, alt: ["aktau"] },
  { id: "taraz", name: "Тараз", country: "KZ", lat: 42.9, lon: 71.37, alt: ["taraz"] },
  { id: "oskemen", name: "Усть-Каменогорск", country: "KZ", lat: 49.95, lon: 82.61, alt: ["oskemen", "ust-kamenogorsk", "өскемен", "оскемен"] },
  { id: "pavlodar", name: "Павлодар", country: "KZ", lat: 52.29, lon: 76.97, alt: ["pavlodar"] },
  { id: "kostanay", name: "Костанай", country: "KZ", lat: 53.21, lon: 63.63, alt: ["kostanay", "кустанай"] },
  { id: "uralsk", name: "Уральск", country: "KZ", lat: 51.23, lon: 51.37, alt: ["uralsk", "орал", "oral"] },
  { id: "kyzylorda", name: "Кызылорда", country: "KZ", lat: 44.85, lon: 65.51, alt: ["kyzylorda"] },
  { id: "taldykorgan", name: "Талдыкорган", country: "KZ", lat: 45.02, lon: 78.37, alt: ["taldykorgan"] },
  { id: "semey", name: "Семей", country: "KZ", lat: 50.41, lon: 80.23, alt: ["semey", "семипалатинск"] },
  { id: "tashkent", name: "Ташкент", country: "UZ", lat: 41.31, lon: 69.28, alt: ["tashkent", "toshkent"] },
  { id: "bishkek", name: "Бишкек", country: "KG", lat: 42.87, lon: 74.59, alt: ["bishkek", "фрунзе"] },
];

const BY_ID = new Map(CITIES.map((c) => [c.id, c]));
export const city = (id: string): City => BY_ID.get(id) ?? CITIES[0];
export const isCity = (id: string) => BY_ID.has(id);
export const countryOf = (id: string): Country => city(id).country;
/** "Хоргос, Китай" — the country is always spelled out, there are two Хоргос. */
export const cityFull = (id: string) => `${city(id).name}, ${COUNTRIES[city(id).country].name}`;
/** Short label that disambiguates only where needed. */
export const cityShort = (id: string) => (id.startsWith("khorgos") ? `${city(id).name} (${id === "khorgos-cn" ? "КНР" : "РК"})` : city(id).name);

export type Poi = { id: string; name: string; kind: "border" | "customs" | "hub"; lat: number; lon: number; note: string };

export const POIS: Poi[] = [
  { id: "nurzholy", name: "Нур Жолы (Хоргос)", kind: "border", lat: 44.214, lon: 80.36, note: "Автомобильный пункт пропуска Казахстан — Китай" },
  { id: "kalzhat", name: "Калжат", kind: "border", lat: 43.93, lon: 80.62, note: "Автомобильный пункт пропуска" },
  { id: "dostyk", name: "Достык", kind: "border", lat: 45.25, lon: 82.48, note: "Пункт пропуска, авто и железная дорога" },
  { id: "bakhty", name: "Бахты", kind: "border", lat: 46.67, lon: 82.73, note: "Автомобильный пункт пропуска" },
  { id: "maikapchagai", name: "Майкапчагай", kind: "border", lat: 47.47, lon: 85.57, note: "Автомобильный пункт пропуска" },
  { id: "cust-khorgos", name: "Таможня в Хоргосе", kind: "customs", lat: 44.16, lon: 80.18, note: "Оформление на границе" },
  { id: "svh-almaty", name: "СВХ Алматы", kind: "customs", lat: 43.35, lon: 76.98, note: "Склад временного хранения" },
  { id: "svh-astana", name: "СВХ Астана", kind: "customs", lat: 51.1, lon: 71.53, note: "Склад временного хранения" },
  { id: "svh-shymkent", name: "СВХ Шымкент", kind: "customs", lat: 42.3, lon: 69.66, note: "Склад временного хранения" },
  { id: "hub-dryport", name: "Сухой порт Хоргос", kind: "hub", lat: 44.2, lon: 80.27, note: "Контейнерный терминал" },
  { id: "hub-almaty", name: "Логистический центр Алматы", kind: "hub", lat: 43.3, lon: 76.75, note: "Склады, кросс-докинг" },
  { id: "hub-urumqi", name: "Логистический парк Урумчи", kind: "hub", lat: 43.93, lon: 87.5, note: "Склады, консолидация грузов" },
];
export const poi = (id: string) => POIS.find((p) => p.id === id);
export const CUSTOMS_POSTS = POIS.filter((p) => p.kind !== "hub");

/** Rough road distance: great-circle × 1.3. Good enough for a demo, labelled "≈". */
export function km(a: string, b: string) {
  const A = city(a), B = city(b);
  const r = Math.PI / 180;
  const h = Math.sin(((B.lat - A.lat) * r) / 2) ** 2 + Math.cos(A.lat * r) * Math.cos(B.lat * r) * Math.sin(((B.lon - A.lon) * r) / 2) ** 2;
  return Math.round((2 * 6371 * Math.asin(Math.sqrt(h)) * 1.3) / 10) * 10;
}

/* ---------- search: Yandex-style suggest ---------- */

const EN = "qwertyuiop[]asdfghjkl;'zxcvbnm,.`";
const RU = "йцукенгшщзхъфывапролджэячсмитьбюё";
/** Fixes text typed with the wrong keyboard layout: "fkvfns" → "алматы". */
export const fixLayout = (s: string) => s.toLowerCase().split("").map((ch) => { const i = EN.indexOf(ch); return i >= 0 ? RU[i] : ch; }).join("");

export type PlaceQ = { type: "city"; id: string } | { type: "country"; code: Country };
export const placeLabel = (q?: PlaceQ) => (!q ? "" : q.type === "country" ? COUNTRIES[q.code].whole : cityShort(q.id));

export type Suggestion = { q: PlaceQ; title: string; sub: string; match: number };

export function suggest(input: string, allowCountries: boolean): Suggestion[] {
  const raw = input.trim().toLowerCase();
  if (!raw) return [];
  const variants = Array.from(new Set([raw, fixLayout(raw)]));
  const out: Suggestion[] = [];
  const score = (names: string[]) => {
    let best = 0;
    for (const n of names) for (const v of variants) {
      const name = n.toLowerCase();
      if (name.startsWith(v)) best = Math.max(best, v.length);
      else if (name.split(/[\s-]/).some((w) => w.startsWith(v))) best = Math.max(best, v.length - 0.5);
    }
    return best;
  };
  if (allowCountries) {
    (Object.keys(COUNTRIES) as Country[]).forEach((code) => {
      const s = score([COUNTRIES[code].name, code === "CN" ? "china" : code === "KZ" ? "kazakhstan" : ""].filter(Boolean));
      if (s) out.push({ q: { type: "country", code }, title: COUNTRIES[code].whole, sub: "Любой город", match: s + 0.2 });
    });
  }
  CITIES.forEach((c) => {
    const s = score([c.name, ...c.alt]);
    if (s) out.push({ q: { type: "city", id: c.id }, title: c.name, sub: COUNTRIES[c.country].name, match: s + (c.popular ? 0.1 : 0) });
  });
  return out.sort((a, b) => b.match - a.match).slice(0, 8);
}

/** Split a suggestion title into typed part + completion, the way Yandex bolds the rest. */
export function highlight(title: string, input: string) {
  const raw = input.trim().toLowerCase();
  for (const v of [raw, fixLayout(raw)]) {
    if (v && title.toLowerCase().startsWith(v)) return [title.slice(0, v.length), title.slice(v.length)] as const;
  }
  return ["", title] as const;
}
