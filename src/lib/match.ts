import { BODIES, CHINA_PERMIT, isOpen } from "./catalog";
import { cityShort, countryOf, isCity, km, type PlaceQ } from "./geo";
import { addDays, avg, dayLabel, isoDay, nf } from "./format";
import { ME_CLIENT, type Cargo, type Review, type State, type Truck } from "./types";

export type Check = { key: string; ok: boolean; text: string };
export type Fit = { level: "full" | "partial" | "none"; checks: Check[]; dist: number };

export const tons = (n: number) => `${String(n).replace(".", ",")} т`;
export const isIntl = (c: Pick<Cargo, "from" | "to">) => countryOf(c.from) !== countryOf(c.to);
export const touchesChina = (c: Pick<Cargo, "from" | "to">) => countryOf(c.from) === "CN" || countryOf(c.to) === "CN";
export const lastDay = (c: Pick<Cargo, "date" | "flex">) => addDays(c.date, c.flex);

export function goesTo(t: Truck, to: string) {
  if (!t.goingTo.length) return true;
  return t.goingTo.includes(to) || t.goingTo.includes(countryOf(to));
}
export function goesToQ(t: Truck, q: PlaceQ) {
  if (q.type === "city") return goesTo(t, q.id);
  return !t.goingTo.length || t.goingTo.includes(q.code) || t.goingTo.some((g) => isCity(g) && countryOf(g) === q.code);
}

/** Spec §14: can this truck cross into China by a given day? */
export function chinaReady(t: Truck, by?: string) {
  return t.intl.chinaEntry && t.intl.permits.includes(CHINA_PERMIT) && (!t.intl.nextEntry || !by || t.intl.nextEntry <= by);
}
export function intlStatus(t: Truck): { ok: boolean; text: string } {
  if (!t.intl.chinaEntry || !t.intl.permits.includes(CHINA_PERMIT)) return { ok: false, text: "Только по Казахстану — нет въезда в Китай" };
  if (t.intl.nextEntry && t.intl.nextEntry > isoDay(0)) return { ok: true, text: `Готова к рейсу в Китай с ${dayLabel(t.intl.nextEntry)}` };
  return { ok: true, text: "Готова к рейсу в Китай" };
}

/** Spec §8: cargo ↔ truck matching, explained criterion by criterion. */
export function fit(t: Truck, c: Cargo): Fit {
  const dist = km(t.at, c.from);
  const intl = isIntl(c);
  const checks: Check[] = [];
  const near = dist <= (intl ? 1200 : 400);
  checks.push({ key: "from", ok: near, text: dist < 40 ? "Уже на месте загрузки" : near ? `До загрузки ≈ ${nf(dist)} км` : `Далеко от загрузки: ≈ ${nf(dist)} км` });
  const dir = goesTo(t, c.to);
  checks.push({ key: "to", ok: dir, text: dir ? (t.goingTo.length ? `Едет в сторону: ${cityShort(c.to)}` : "Готов ехать в любую сторону") : "Едет в другую сторону" });
  const last = lastDay(c);
  const dateOk = t.freeFrom <= last;
  checks.push({ key: "date", ok: dateOk, text: dateOk ? `Свободна ${dayLabel(t.freeFrom)}` : `Освободится только ${dayLabel(t.freeFrom)}` });
  checks.push({ key: "weight", ok: c.weight <= t.capacity, text: `Вес ${tons(c.weight)} — машина берёт ${tons(t.capacity)}` });
  if (c.volume) checks.push({ key: "volume", ok: !t.volume || c.volume <= t.volume, text: t.volume ? `Объём ${c.volume} м³ — в кузове ${t.volume} м³` : `Объём ${c.volume} м³ — открытая платформа` });
  const bodyOk = !c.bodies.length || c.bodies.includes(t.body);
  checks.push({ key: "body", ok: bodyOk, text: bodyOk ? `Кузов: ${BODIES[t.body].name.toLowerCase()}` : `Нужен кузов: ${c.bodies.map((b) => BODIES[b].name.toLowerCase()).join(" или ")}` });
  if (c.temp) {
    const ok = t.body === "reefer" && (!t.temp || (t.temp[0] <= c.temp[0] && t.temp[1] >= c.temp[1]));
    checks.push({ key: "temp", ok, text: ok ? `Держит ${c.temp[0]}…${c.temp[1]} °C` : `Нужен холод ${c.temp[0]}…${c.temp[1]} °C` });
  }
  if (intl && touchesChina(c)) {
    const ok = chinaReady(t, last);
    const noPermit = !t.intl.chinaEntry || !t.intl.permits.includes(CHINA_PERMIT);
    checks.push({ key: "border", ok, text: ok ? "Может въехать в Китай" : noPermit ? "Нет разрешения на въезд в Китай" : `Въезд в Китай только с ${dayLabel(t.intl.nextEntry!)}` });
  }
  const bad = checks.filter((x) => !x.ok);
  const level: Fit["level"] = !bad.length ? "full" : bad.length === 1 && bad[0].key === "date" && addDays(last, 3) >= t.freeFrom ? "partial" : "none";
  return { level, checks, dist };
}

const rank = (f: Fit) => (f.level === "full" ? 0 : f.level === "partial" ? 1 : 2);

export function matchTrucks(s: State, c: Cargo) {
  return s.trucks
    .filter((t) => t.state === "free")
    .map((t) => ({ t, f: fit(t, c) }))
    .filter((x) => x.f.level !== "none")
    .sort((a, b) => rank(a.f) - rank(b.f) || a.f.dist - b.f.dist);
}
export function matchCargo(s: State, t: Truck) {
  return s.cargo
    .filter((c) => isOpen(c.status) && !c.offers.some((o) => o.truckId === t.id && o.status !== "declined"))
    .map((c) => ({ c, f: fit(t, c) }))
    .filter((x) => x.f.level !== "none")
    .sort((a, b) => rank(a.f) - rank(b.f) || b.c.createdAt - a.c.createdAt);
}

/* ---------- ratings ---------- */

export const reviewAvg = (r: Review) => avg(r.scores);
export const criteria = (reviews: Review[], n: number) => Array.from({ length: n }, (_, i) => avg(reviews.map((r) => r.scores[i] ?? 0)));
export const driverOf = (s: State, id: string) => s.drivers.find((d) => d.id === id) ?? s.drivers[0];
export const clientOf = (s: State, id: string) => s.clients.find((c) => c.id === id) ?? s.clients[0];
export const truckOf = (s: State, id: string) => s.trucks.find((t) => t.id === id);
export const carrierOf = (s: State, id: string) => s.carriers.find((c) => c.id === id);

/* ---------- search (spec §6, §7) ---------- */

const within = (cityId: string, q: PlaceQ | undefined, radius: number) =>
  !q ? true : q.type === "country" ? countryOf(cityId) === q.code : cityId === q.id || km(cityId, q.id) <= radius;

export function dayFilter(v: string | undefined) {
  if (!v) return undefined;
  if (v === "today") return isoDay(0);
  if (v === "tomorrow") return isoDay(1);
  return v;
}

export function searchTrucks(s: State) {
  const { from, to, f } = s.q.client;
  const day = dayFilter(f.date);
  const target = s.cargo.find((c) => c.clientId === ME_CLIENT && isOpen(c.status));
  const rows = s.trucks
    .filter((t) => t.state === "free")
    .filter((t) => {
      if (from) {
        const atBorderForChina = from.type === "country" && from.code === "CN" && t.at === "khorgos-kz" && chinaReady(t);
        if (!within(t.at, from, 250) && !atBorderForChina) return false;
      }
      if (to && !goesToQ(t, to)) return false;
      if (day && t.freeFrom > day) return false;
      if (f.kinds.length && !f.kinds.includes(t.kind)) return false;
      if (f.bodies.length && !f.bodies.includes(t.body)) return false;
      if (f.minCap && t.capacity < f.minCap) return false;
      if (f.minVol && t.volume < f.minVol) return false;
      if (f.scope === "intl" && !chinaReady(t)) return false;
      if (f.scope === "domestic" && !(countryOf(t.at) === "KZ" && t.goingTo.every((g) => g === "KZ" || (isCity(g) && countryOf(g) === "KZ")))) return false;
      if (f.minRating && driverOf(s, t.driverId).rating < f.minRating) return false;
      if (f.verifiedOnly && t.verified !== true) return false;
      return true;
    })
    .map((t) => ({ t, f: target ? fit(t, target) : undefined, near: from?.type === "city" ? km(t.at, from.id) : 0 }));
  const by = f.sort;
  return rows.sort((a, b) => {
    if (by === "rating") return driverOf(s, b.t.driverId).rating - driverOf(s, a.t.driverId).rating;
    if (by === "near") return a.near - b.near || (a.t.freeFrom < b.t.freeFrom ? -1 : 1);
    const ra = a.f ? rank(a.f) : 0, rb = b.f ? rank(b.f) : 0;
    return ra - rb || (a.t.freeFrom < b.t.freeFrom ? -1 : 1) || (b.t.postedAt ?? 0) - (a.t.postedAt ?? 0);
  });
}

export function searchCargo(s: State) {
  const { from, to, f, truckId } = s.q.carrier;
  const truck = truckId ? truckOf(s, truckId) : undefined;
  const day = dayFilter(f.date);
  const rows = s.cargo
    .filter((c) => isOpen(c.status))
    .filter((c) => {
      if (from && !within(c.from, from, f.radius ?? 100000)) return false;
      if (to && !within(c.to, to, 60)) return false;
      if (day && (lastDay(c) < day || addDays(c.date, -c.flex) > day)) return false;
      if (f.maxWeight && c.weight > f.maxWeight) return false;
      if (f.maxVol && c.volume > f.maxVol) return false;
      if (f.categories.length && !f.categories.includes(c.category)) return false;
      if (f.minPrice && c.priceMode === "fixed" && (c.price ?? 0) < f.minPrice) return false;
      if (f.customs.length && !(c.customs && f.customs.includes(c.customs.where))) return false;
      if (f.fitTruck && truck && fit(truck, c).level === "none") return false;
      return true;
    })
    .map((c) => ({ c, f: truck ? fit(truck, c) : undefined, near: from?.type === "city" ? km(c.from, from.id) : 0 }));
  return rows.sort((a, b) => {
    if (f.sort === "price") return (b.c.price ?? 0) - (a.c.price ?? 0);
    if (f.sort === "near") return a.near - b.near;
    return b.c.createdAt - a.c.createdAt;
  });
}

export function activeFilterCount(role: "client" | "carrier", s: State) {
  if (role === "client") {
    const f = s.q.client.f;
    return [f.date, f.kinds.length, f.bodies.length, f.minCap, f.minVol, f.scope !== "all", f.minRating, f.verifiedOnly].filter(Boolean).length;
  }
  const f = s.q.carrier.f;
  return [f.radius, f.date, f.maxWeight, f.maxVol, f.categories.length, f.minPrice, f.customs.length].filter(Boolean).length;
}

/** Rough price range for a lane — labelled as an estimate, never as a quote. */
export function priceHint(from: string, to: string, weight: number) {
  const base = km(from, to) * 330 * (weight >= 15 ? 1 : 0.55 + (weight / 15) * 0.45) * (isIntl({ from, to }) ? 1.25 : 1);
  const lo = Math.round((base * 0.9) / 10000) * 10000, hi = Math.round((base * 1.15) / 10000) * 10000;
  return { lo: Math.max(lo, 50000), hi: Math.max(hi, 80000) };
}
