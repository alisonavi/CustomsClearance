"use client";

import Link from "next/link";
import { useState } from "react";
import { ClipboardList, Route as RouteIcon } from "lucide-react";
import { useStore, route } from "@/lib/store";
import { ACTIVE, STATUS, isOpen } from "@/lib/catalog";
import { ago, money } from "@/lib/format";
import { truckOf } from "@/lib/match";
import { ME_CARRIER, ME_CLIENT, type Cargo } from "@/lib/types";
import { CargoCard } from "@/components/cards";
import { Empty, LinkButton, Page, Pill, Segmented, Stars, TopBar } from "@/components/ui";

/** Client: my requests. Carrier: my trips, bids and history (spec §4, §16 #14). */
export default function Orders() {
  const { s } = useStore();
  return s.user.role === "client" ? <ClientOrders /> : <CarrierTrips />;
}

function ClientOrders() {
  const { s } = useStore();
  const [tab, setTab] = useState<"active" | "history">("active");
  const mine = s.cargo.filter((c) => c.clientId === ME_CLIENT).sort((a, b) => b.createdAt - a.createdAt);
  const active = mine.filter((c) => isOpen(c.status) || ACTIVE.includes(c.status) || (c.status === "done" && !c.byClient));
  const history = mine.filter((c) => !active.includes(c));
  const list = tab === "active" ? active : history;
  return (
    <>
      <TopBar title="Мои заявки" back={false} />
      <Page className="px-3 pb-10 pt-3">
        <Segmented options={[["active", `Активные · ${active.length}`], ["history", `История · ${history.length}`]]} value={tab} onChange={setTab} />
        <div className="mt-4 grid gap-3">
          {list.map((c) => <CargoCard key={c.id} c={c} />)}
          {!list.length && (tab === "active"
            ? <Empty icon={<ClipboardList size={28} />} title="Активных заявок нет" text="Опишите груз — подходящие водители предложат цену." action={<LinkButton href="/new">Разместить заявку</LinkButton>} />
            : <Empty title="История пуста" text="Здесь будут завершённые перевозки и отзывы." />)}
        </div>
      </Page>
    </>
  );
}

function CarrierTrips() {
  const { s } = useStore();
  const [tab, setTab] = useState<"work" | "offers" | "history">("work");
  const myIds = new Set(s.trucks.filter((t) => t.carrierId === ME_CARRIER).map((t) => t.id));
  const deals = s.cargo.filter((c) => c.deal && myIds.has(c.deal.truckId));
  const work = deals.filter((c) => ACTIVE.includes(c.status) || (c.status === "done" && !c.byCarrier));
  const history = deals.filter((c) => !work.includes(c)).sort((a, b) => b.createdAt - a.createdAt);
  const offers = s.cargo.filter((c) => isOpen(c.status) && c.offers.some((o) => myIds.has(o.truckId)));
  return (
    <>
      <TopBar title="Мои рейсы" back={false} />
      <Page className="px-3 pb-10 pt-3">
        <Segmented options={[["work", `В работе · ${work.length}`], ["offers", `Предложения · ${offers.length}`], ["history", "История"]]} value={tab} onChange={setTab} />
        <div className="mt-4 grid gap-3">
          {tab === "work" && (work.length ? work.map((c) => <Trip key={c.id} c={c} />) : <Empty icon={<RouteIcon size={28} />} title="Рейсов в работе нет" text="Найдите груз и предложите цену — клиент выберет вас." action={<LinkButton href="/">Найти груз</LinkButton>} />)}
          {tab === "offers" && (offers.length ? offers.map((c) => <OfferRow key={c.id} c={c} myIds={myIds} />) : <Empty title="Предложений нет" text="Здесь будут ваши ставки и грузы, которые клиенты предложили вашим машинам." />)}
          {tab === "history" && (history.length ? history.map((c) => <Trip key={c.id} c={c} />) : <Empty title="История пуста" text="Здесь будут завершённые перевозки." />)}
        </div>
      </Page>
    </>
  );
}

function Trip({ c }: { c: Cargo }) {
  const { s } = useStore();
  const t = c.deal ? truckOf(s, c.deal.truckId) : undefined;
  const review = c.byClient;
  return (
    <Link href={`/cargo/${c.id}`} className="block rounded-2xl border border-line bg-white p-4 active:bg-page">
      <div className="flex items-start justify-between gap-3">
        <div className="text-xl font-bold leading-tight">{route(c)}</div>
        {c.status === "done" && !c.byCarrier ? <Pill tone="warn">Оцените клиента</Pill> : c.status === "rated" ? <Pill tone="ok">Завершено</Pill> : <Pill tone="brand">{STATUS[c.status]}</Pill>}
      </div>
      <div className="mt-1 text-ink-2">{c.title}</div>
      <div className="mt-3 flex items-end justify-between gap-3 border-t border-line pt-3">
        <div><div className="text-2xl font-bold tnum">{money(c.deal!.price)}</div><div className="text-ink-3">{t ? `${t.make} ${t.model} · ${t.plate}` : ""}</div></div>
        {review && <div className="text-right text-ink-3">Оценка клиента<br /><Stars value={review.scores.reduce((a, b) => a + b, 0) / review.scores.length} /></div>}
      </div>
    </Link>
  );
}

function OfferRow({ c, myIds }: { c: Cargo; myIds: Set<string> }) {
  const o = c.offers.filter((x) => myIds.has(x.truckId)).sort((a, b) => b.at - a.at)[0];
  const label = o.by === "client" ? (o.status === "new" ? "Клиент предлагает вам" : o.status === "declined" ? "Вы отказались" : "Принято")
    : o.status === "new" ? "Ждём ответа клиента" : o.status === "declined" ? "Клиент выбрал другого" : "Принято";
  const tone = o.status === "declined" ? "gray" : o.by === "client" ? "warn" : "brand";
  return (
    <Link href={`/cargo/${c.id}`} className="block rounded-2xl border border-line bg-white p-4 active:bg-page">
      <div className="flex items-start justify-between gap-3">
        <div className="text-xl font-bold leading-tight">{route(c)}</div>
        <Pill tone={tone}>{label}</Pill>
      </div>
      <div className="mt-1 text-ink-2">{c.title}</div>
      <div className="mt-3 flex items-end justify-between border-t border-line pt-3">
        <div className="text-2xl font-bold tnum">{money(o.price)}</div>
        <div className="text-ink-3">{ago(o.at)}</div>
      </div>
    </Link>
  );
}
