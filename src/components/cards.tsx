"use client";

import Link from "next/link";
import { Clock, MessageSquareText } from "lucide-react";
import { BODIES, ago, client, dayLabel, driver, km, money, num, perKm, plural, city, type Cargo, type Truck } from "@/lib/data";
import { Castings, CustomsTag, DataPlate, Plate, Rating, Route, Tag } from "./ui";

export function CargoCard({ c }: { c: Cargo }) {
  const k = client(c.clientId);
  const dist = km(c.from, c.to);
  return (
    <Link
      href={`/cargo/${c.id}`}
      className={`relative block rounded-[3px] border border-line bg-white px-4 pb-3.5 pt-4 shadow-[0_1px_0_rgba(0,0,0,0.06),0_6px_16px_-10px_rgba(0,0,0,0.25)] transition-transform active:scale-[0.99] ${c.fresh ? "pull-in" : ""}`}
    >
      <Castings />
      <div className="flex items-start justify-between gap-3">
        <Route from={c.from} to={c.to} />
        <span className="mt-1 shrink-0 font-display text-[16px] font-bold text-ink-3">{num(dist)} км</span>
      </div>
      <p className="mt-1.5 truncate text-[15px] font-medium text-ink-2">{c.what}</p>
      <div className="mt-3">
        <DataPlate items={[["Вес", `${c.weight} т`], ["Объём", c.volume ? `${c.volume} м³` : "—"], ["Кузов", BODIES[c.body].name]]} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <CustomsTag c={c.customs} />
        <Tag><Clock size={13} strokeWidth={2.4} aria-hidden />{dayLabel(c.date)}</Tag>
        {c.status === "sealed" && <Tag tone="seal">Опломбировано</Tag>}
        {c.bid?.status === "pending" && <Tag tone="dark">Ваша ставка {money(c.bid.price)}</Tag>}
        {c.fresh && <Tag tone="signal">Новый</Tag>}
      </div>
      <div className="mt-3 flex items-end justify-between gap-3 border-t border-dashed border-line pt-3">
        <div>
          <div className="font-display text-[30px] font-extrabold leading-none tabular-nums">{money(c.price)}</div>
          <div className="mt-1 text-[12.5px] font-semibold text-ink-3">≈ {perKm(c.price, c.from, c.to)} ₸/км</div>
        </div>
        <div className="min-w-0 text-right">
          <div className="truncate text-[13.5px] font-bold">{c.mine ? "Ваш груз" : k.company}</div>
          <div className="text-[12.5px] text-ink-3">{c.mine ? `${c.offers.length} ${plural(c.offers.length, ["предложение", "предложения", "предложений"])}` : ago(c.at)}</div>
        </div>
      </div>
    </Link>
  );
}

export function TruckCard({ t }: { t: Truck }) {
  const d = driver(t.driverId);
  return (
    <Link
      href={`/truck/${t.id}`}
      className={`block rounded-[3px] border border-line bg-white px-4 py-3.5 shadow-[0_1px_0_rgba(0,0,0,0.06),0_6px_16px_-10px_rgba(0,0,0,0.25)] transition-transform active:scale-[0.99] ${t.fresh ? "pull-in" : ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <Plate plate={d.plate} />
        <span className="text-[12.5px] font-semibold text-ink-3">{t.fresh ? "только что" : ago(t.at)}</span>
      </div>
      <div className="mt-3">
        <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-ink-3">Сейчас в {city(t.from)} · едет в</div>
        <div className="mt-0.5 font-display text-[26px] font-extrabold uppercase leading-[0.95]">{t.to.length ? t.to.map(city).join(" · ") : "Любое направление"}</div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Tag tone="dark">{BODIES[t.body].name}</Tag>
        <Tag>{t.capacity} т{t.volume ? ` · ${t.volume} м³` : ""}</Tag>
        <Tag><Clock size={13} strokeWidth={2.4} aria-hidden />{dayLabel(t.date)}</Tag>
        {d.docs.includes("TIR") && <Tag>TIR</Tag>}
        {t.fresh && <Tag tone="signal">На линии</Tag>}
      </div>
      <div className="mt-3 flex items-end justify-between gap-3 border-t border-dashed border-line pt-3">
        <div>
          <div className="font-display text-[26px] font-extrabold leading-none tabular-nums">
            {t.rateType === "km" ? `${t.rate} ₸/км` : money(t.rate)}
          </div>
          <div className="mt-1 text-[12.5px] font-semibold text-ink-3">{t.rateType === "km" ? "ставка за километр" : "за рейс"}</div>
        </div>
        <div className="min-w-0 text-right">
          <div className="truncate text-[13.5px] font-bold">{t.mine ? "Ваша машина" : d.name}</div>
          {t.mine ? (
            <div className="inline-flex items-center gap-1 text-[12.5px] font-bold text-oxide"><MessageSquareText size={13} aria-hidden />{t.invites.filter((i) => i.status === "new").length} новых</div>
          ) : (
            <Rating value={d.rating} sub={`${d.trips} рейсов`} />
          )}
        </div>
      </div>
    </Link>
  );
}
