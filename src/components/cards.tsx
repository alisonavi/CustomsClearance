"use client";

import Link from "next/link";
import { CalendarDays, MapPin, Navigation, ShieldCheck } from "lucide-react";
import { BODIES, CUSTOMS, KINDS, STATUS } from "@/lib/catalog";
import { cityFull, cityShort, countryOf, isCity, COUNTRIES, poi } from "@/lib/geo";
import { DayLabel, ago, count, money, nf, rangeLabel } from "@/lib/format";
import { clientOf, driverOf, intlStatus, isIntl, tons, type Fit } from "@/lib/match";
import { useStore } from "@/lib/store";
import type { Cargo, Truck } from "@/lib/types";
import { km } from "@/lib/geo";
import { FitBadge, Pill, Plate, Stars, StatusPill, TruckArt } from "./ui";

export const goingLabel = (t: Truck) =>
  !t.goingTo.length ? "Куда угодно" : t.goingTo.map((g) => (isCity(g) ? cityShort(g) : `весь ${COUNTRIES[g as keyof typeof COUNTRIES].name}`)).join(", ");
export const customsLabel = (c: Cargo) => {
  if (!c.customs) return "Не нужна — перевозка по стране";
  const where = c.customs.where === "post" ? "" : CUSTOMS[c.customs.where].name;
  const post = c.customs.post ? poi(c.customs.post)?.name : "";
  return [where, post].filter(Boolean).join(" · ");
};

/** Client side: a free truck. Photo stands in as an illustration of the body type. */
export function TruckCard({ t, fit }: { t: Truck; fit?: Fit }) {
  const { s } = useStore();
  const d = driverOf(s, t.driverId);
  const intl = intlStatus(t);
  return (
    <Link href={`/truck/${t.id}`} className={`block rounded-2xl border border-line bg-white p-4 active:bg-page ${t.fresh ? "pop-in" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="w-28 shrink-0 rounded-xl bg-brand-soft/60 px-1.5 py-1"><TruckArt body={t.body} kind={t.kind} /></div>
        <div className="min-w-0 flex-1">
          <div className="text-lg font-bold leading-snug">{BODIES[t.body].name}, {tons(t.capacity)}{t.volume ? ` · ${t.volume} м³` : ""}</div>
          <div className="truncate text-ink-2">{t.make} {t.model} · {KINDS[t.kind].name.toLowerCase()}</div>
          <div className="mt-1 flex items-center gap-2 text-[0.95rem]"><Stars value={d.rating} /> <span className="truncate text-ink-3">{d.name}</span></div>
        </div>
      </div>
      <ul className="mt-3 grid gap-1.5 border-t border-line pt-3">
        <li className="flex items-center gap-2.5"><MapPin size={19} className="shrink-0 text-brand" aria-hidden /><span>Сейчас: <b className="font-semibold">{cityFull(t.at)}</b></span></li>
        <li className="flex items-center gap-2.5"><CalendarDays size={19} className="shrink-0 text-brand" aria-hidden /><span>Свободна: <b className="font-semibold">{DayLabel(t.freeFrom)}</b></span></li>
        <li className="flex items-center gap-2.5"><Navigation size={19} className="shrink-0 text-brand" aria-hidden /><span className="truncate">Едет: <b className="font-semibold">{goingLabel(t)}</b></span></li>
      </ul>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {fit && <FitBadge fit={fit} />}
        {t.fresh && <Pill tone="brand">Новая</Pill>}
        <Pill tone={intl.ok ? "brand" : "gray"}>{intl.ok ? "Въезд в Китай" : "Только Казахстан"}</Pill>
        {t.verified === true && <Pill tone="ok"><ShieldCheck size={15} aria-hidden /> Проверена</Pill>}
      </div>
    </Link>
  );
}

/** Carrier side: a load. Client side: one of my requests (with status). */
export function CargoCard({ c, fit, from }: { c: Cargo; fit?: Fit; from?: string }) {
  const { s } = useStore();
  const k = clientOf(s, c.clientId);
  const mine = c.clientId === "me-client" && s.user.role === "client";
  const newOffers = c.offers.filter((o) => o.status === "new" && o.by === "carrier").length;
  const dist = km(c.from, c.to);
  const near = from ? km(from, c.from) : undefined;
  return (
    <Link href={`/cargo/${c.id}`} className={`block rounded-2xl border border-line bg-white p-4 active:bg-page ${c.fresh ? "pop-in" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xl font-bold leading-tight">{cityShort(c.from)} → {cityShort(c.to)}</div>
          <div className="mt-0.5 text-ink-3">
            {isIntl(c) ? `${COUNTRIES[countryOf(c.from)].name} → ${COUNTRIES[countryOf(c.to)].name}` : "По Казахстану"} · ≈ {nf(dist)} км
          </div>
        </div>
        {mine ? <StatusPill status={c.status} offers={newOffers} /> : c.urgent ? <Pill tone="bad">Срочно</Pill> : null}
      </div>
      <div className="mt-3 flex items-center gap-2.5"><CalendarDays size={19} className="shrink-0 text-brand" aria-hidden /><span>Загрузка: <b className="font-semibold">{rangeLabel(c.date, c.flex)}</b></span></div>
      <p className="mt-1.5 line-clamp-2 text-ink-2">{c.title}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Pill>{tons(c.weight)}</Pill>
        {!!c.volume && <Pill>{c.volume} м³</Pill>}
        {c.places ? <Pill>{count(c.places, ["место", "места", "мест"])}</Pill> : null}
        <Pill>{c.bodies.length ? c.bodies.map((b) => BODIES[b].name).join(" / ") : "Любой кузов"}</Pill>
        {c.customs && <Pill tone="brand">Растаможка: {CUSTOMS[c.customs.where].name.toLowerCase()}</Pill>}
      </div>
      <div className="mt-3 flex items-end justify-between gap-3 border-t border-line pt-3">
        <div>
          {c.deal ? (
            <div className="text-2xl font-bold tnum">{money(c.deal.price)}</div>
          ) : c.priceMode === "fixed" && c.price ? (
            <div className="text-2xl font-bold tnum">{money(c.price)}</div>
          ) : (
            <div className="text-lg font-bold text-brand-ink">{mine ? "Ждём цены водителей" : "Предложите свою цену"}</div>
          )}
          {near !== undefined && <div className="text-ink-3">{near < 40 ? "Загрузка рядом с вами" : `До загрузки ≈ ${nf(near)} км`}</div>}
        </div>
        <div className="min-w-0 text-right">
          {mine ? (
            <div className="text-ink-3">{c.deal ? STATUS[c.status] : ago(c.createdAt)}</div>
          ) : (
            <>
              <div className="truncate font-semibold">{k.company ?? k.name}</div>
              <div className="text-ink-3"><Stars value={k.rating} /> · {ago(c.createdAt)}</div>
            </>
          )}
        </div>
      </div>
      {fit && <div className="mt-3"><FitBadge fit={fit} /></div>}
    </Link>
  );
}
