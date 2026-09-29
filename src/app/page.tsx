"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Radio } from "lucide-react";
import { useStore } from "@/lib/store";
import { city, plural, driver } from "@/lib/data";
import { CargoCard, TruckCard } from "@/components/cards";
import { Castings, Chips, Empty, Plate, RoleSwitch, Route, Section } from "@/components/ui";

export default function Home() {
  const { state } = useStore();
  return state.role === "client" ? <ClientHome /> : <DriverHome />;
}

function Top({ greeting, children }: { greeting: string; children: React.ReactNode }) {
  return (
    <header className="corrugated relative text-white">
      <div className="mx-auto max-w-xl px-4 pb-6 pt-[max(14px,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-display text-[26px] font-extrabold uppercase leading-none tracking-[0.05em]">Keruen</span>
            <span className="rounded-[3px] border border-white/50 px-1 py-px text-[10px] font-bold uppercase tracking-[0.1em] text-oxide-soft">демо</span>
          </div>
          <RoleSwitch />
        </div>
        <h1 className="mt-6 text-balance text-[30px] font-extrabold leading-[1.05] tracking-[-0.02em]">{greeting}</h1>
        <div className="mt-5">{children}</div>
      </div>
    </header>
  );
}

function ClientHome() {
  const { state } = useStore();
  const [f, setF] = useState<"all" | "khorgos" | "tent" | "reefer" | "container">("all");
  const mine = state.cargo.filter((c) => c.mine);
  const trucks = state.trucks
    .filter((t) => !t.mine)
    .filter((t) => (f === "all" ? true : f === "khorgos" ? t.from === "khorgos" : t.body === f))
    .sort((a, b) => b.at - a.at);
  return (
    <main>
      <Top greeting="Айгерим, что и куда везём?">
        <Link href="/new/cargo" className="flex items-center justify-between rounded-[5px] border-2 border-ink bg-signal px-4 py-3.5 text-ink shadow-[0_8px_18px_-8px_rgba(0,0,0,0.5)] active:translate-y-px active:bg-signal-deep">
          <span>
            <span className="block text-[18px] font-extrabold leading-tight">Разместить груз</span>
            <span className="block text-[13.5px] font-semibold text-ink/75">Назовите цену — водители ответят</span>
          </span>
          <ArrowRight size={26} strokeWidth={2.8} />
        </Link>
        {mine.length > 0 && (
          <div className="no-scrollbar -mx-4 mt-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
            {mine.map((c) => (
              <Link key={c.id} href={`/cargo/${c.id}`} className="relative w-[248px] shrink-0 rounded-[3px] bg-white/10 px-3.5 py-3 ring-1 ring-white/25 active:bg-white/20">
                <Castings light />
                <Route from={c.from} to={c.to} size="sm" light />
                <div className="mt-1.5 flex items-center justify-between text-[13px]">
                  <span className="text-oxide-soft">{c.weight} т · {c.what.split(",")[0]}</span>
                </div>
                <div className="mt-2 text-[13.5px] font-extrabold">
                  {c.status === "sealed" ? (
                    <span className="text-[#bff0d2]">Опломбировано · {driver(c.dealDriverId ?? "").name.split(" ")[0]}</span>
                  ) : c.offers.length ? (
                    <span className="rounded-[3px] bg-signal px-1.5 py-0.5 text-ink">
                      {c.offers.length} {plural(c.offers.length, ["предложение", "предложения", "предложений"])}
                    </span>
                  ) : (
                    <span className="text-oxide-soft">Ищем водителей…</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Top>
      <Section title="Свободные машины" right={<span className="text-[13px] font-semibold text-ink-3">{trucks.length} на линии</span>}>
        <Chips value={f} onChange={setF} options={[["all", "Все"], ["khorgos", "В Хоргосе"], ["tent", "Тент"], ["reefer", "Реф"], ["container", "Контейнер"]]} />
        <div className="grid gap-3">
          {trucks.length ? trucks.map((t) => <TruckCard key={t.id} t={t} />) : <Empty title="Машин с таким фильтром нет" body="Новые машины появляются здесь сразу, как водитель выходит на линию." />}
        </div>
      </Section>
    </main>
  );
}

function DriverHome() {
  const { state } = useStore();
  const [f, setF] = useState<"all" | "way" | "khorgos" | "tent" | "reefer" | "container">("all");
  const myTruck = state.trucks.find((t) => t.mine);
  const cargo = state.cargo
    .filter((c) => !c.mine && !(c.status === "sealed" && c.dealDriverId !== "me-driver"))
    .filter((c) => {
      if (f === "all") return true;
      if (f === "way") return !!myTruck && c.from === myTruck.from && myTruck.to.includes(c.to);
      if (f === "khorgos") return c.from === "khorgos";
      return c.body === f;
    })
    .sort((a, b) => b.at - a.at);
  const fresh = myTruck?.invites.filter((i) => i.status === "new").length ?? 0;
  return (
    <main>
      <Top greeting="Бауыржан, грузы на сегодня">
        {myTruck ? (
          <Link href={`/truck/${myTruck.id}`} className="block rounded-[5px] bg-white px-4 py-3.5 text-ink shadow-[0_8px_18px_-8px_rgba(0,0,0,0.5)] active:bg-yard">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[13px] font-extrabold uppercase tracking-[0.06em] text-seal">
                <Radio size={16} strokeWidth={2.6} aria-hidden /> Вы на линии
              </span>
              <Plate plate="482 AKB 05" />
            </div>
            <div className="mt-2 font-display text-[24px] font-extrabold uppercase leading-none">
              {city(myTruck.from)} → {myTruck.to.map(city).join(" · ")}
            </div>
            <div className="mt-2 text-[14px] font-bold">
              {fresh ? (
                <span className="rounded-[3px] bg-signal px-1.5 py-0.5">{fresh} {plural(fresh, ["клиент предлагает", "клиента предлагают", "клиентов предлагают"])} груз</span>
              ) : (
                <span className="text-ink-3">Клиенты видят вашу машину</span>
              )}
            </div>
          </Link>
        ) : (
          <Link href="/new/truck" className="flex items-center justify-between rounded-[5px] border-2 border-ink bg-signal px-4 py-3.5 text-ink shadow-[0_8px_18px_-8px_rgba(0,0,0,0.5)] active:translate-y-px active:bg-signal-deep">
            <span>
              <span className="block text-[18px] font-extrabold leading-tight">Я свободен — выйти на линию</span>
              <span className="block text-[13.5px] font-semibold text-ink/75">Клиенты увидят вашу машину и предложат груз</span>
            </span>
            <ArrowRight size={26} strokeWidth={2.8} />
          </Link>
        )}
      </Top>
      <Section title="Грузы" right={<span className="text-[13px] font-semibold text-ink-3">{cargo.length} открыто</span>}>
        <Chips
          value={f}
          onChange={setF}
          options={[["all", "Все"], ...(myTruck ? ([["way", "По пути"]] as [typeof f, string][]) : []), ["khorgos", "Из Хоргоса"], ["tent", "Тент"], ["reefer", "Реф"], ["container", "Контейнер"]]}
        />
        <div className="grid gap-3">
          {cargo.length ? cargo.map((c) => <CargoCard key={c.id} c={c} />) : <Empty title="Грузов по фильтру нет" body="Попробуйте другой кузов или направление — новые грузы появляются каждые несколько минут." />}
        </div>
      </Section>
    </main>
  );
}
