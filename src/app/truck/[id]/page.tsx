"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarDays, MapPin, MessageCircle, Navigation, Phone, ShieldCheck } from "lucide-react";
import { useStore, route } from "@/lib/store";
import { BODIES, KINDS, LOADING, isOpen } from "@/lib/catalog";
import { cityFull } from "@/lib/geo";
import { DayLabel, count, dayLabel, money } from "@/lib/format";
import { driverOf, fit, intlStatus, tons } from "@/lib/match";
import { ME_CARRIER, ME_CLIENT } from "@/lib/types";
import { goingLabel } from "@/components/cards";
import { Avatar, Button, Card, Empty, FitBadge, FitChecks, H2, LinkButton, Option, Page, Pill, Plate, Row, Sheet, Stars, TopBar, TruckArt, Verified } from "@/components/ui";

export default function TruckPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { s, proposeToTruck, openChat, toast } = useStore();
  const [pick, setPick] = useState(false);
  const t = s.trucks.find((x) => x.id === id);
  if (!t) return (<><TopBar title="Машина" /><Page className="p-4"><Empty title="Машина не найдена" text="Возможно, водитель снял её с размещения." /></Page></>);

  const d = driverOf(s, t.driverId);
  const intl = intlStatus(t);
  const role = s.user.role;
  const mine = t.carrierId === ME_CARRIER;
  const myOpen = s.cargo.filter((c) => c.clientId === ME_CLIENT && isOpen(c.status));
  const best = myOpen.map((c) => ({ c, f: fit(t, c) })).sort((a, b) => (a.f.level === "full" ? -1 : 1) - (b.f.level === "full" ? -1 : 1))[0];
  const proposed = (cid: string) => s.cargo.find((c) => c.id === cid)?.offers.some((o) => o.truckId === t.id && o.by === "client" && o.status === "new");

  return (
    <>
      <TopBar title="Машина" />
      <Page className="px-3 pb-36 pt-3">
        <Card className="p-5">
          <div className="rounded-2xl bg-brand-soft/60 px-4 py-3"><TruckArt body={t.body} kind={t.kind} className="mx-auto max-w-sm" /></div>
          <p className="mt-1.5 text-center text-sm text-ink-3">Иллюстрация. В рабочей версии здесь будут фото машины ({t.photos} шт.)</p>
          <h1 className="mt-4 text-2xl font-bold leading-tight">{BODIES[t.body].name}, {tons(t.capacity)}{t.volume ? ` · ${t.volume} м³` : ""}</h1>
          <p className="text-lg text-ink-2">{t.make} {t.model}, {t.year} год</p>
          <div className="mt-3 flex flex-wrap items-center gap-2"><Plate plate={t.plate} cn={t.cnPlate} /><Verified ok={t.verified} text="Документы проверены" /></div>
          <ul className="mt-4 grid gap-2 border-t border-line pt-4 text-lg">
            <li className="flex items-center gap-3"><MapPin size={22} className="shrink-0 text-brand" aria-hidden />Сейчас: <b className="font-semibold">{cityFull(t.at)}</b></li>
            <li className="flex items-center gap-3"><CalendarDays size={22} className="shrink-0 text-brand" aria-hidden />{t.state === "trip" ? "В рейсе, освободится" : "Свободна"}: <b className="font-semibold">{DayLabel(t.freeFrom)}</b></li>
            <li className="flex items-start gap-3"><Navigation size={22} className="mt-0.5 shrink-0 text-brand" aria-hidden /><span>Готов ехать: <b className="font-semibold">{goingLabel(t)}</b></span></li>
          </ul>
          <p className="mt-3 text-[0.95rem] text-ink-3">Место показано по городу — точный адрес водитель сообщит сам.</p>
        </Card>

        {role === "client" && best && (
          <>
            <H2>Для вашей заявки {route(best.c)}</H2>
            <Card className="p-4">
              <div className="mb-3"><FitBadge fit={best.f} /></div>
              <FitChecks fit={best.f} />
            </Card>
          </>
        )}

        <H2>Характеристики</H2>
        <Card className="px-4">
          <Row label="Тип">{KINDS[t.kind].name}</Row>
          <Row label="Кузов">{BODIES[t.body].name}</Row>
          <Row label="Грузоподъёмность">{tons(t.capacity)}</Row>
          <Row label="Объём">{t.volume ? `${t.volume} м³` : "—"}</Row>
          <Row label="Размеры кузова">{t.dims.map((x) => String(x).replace(".", ",")).join(" × ")} м</Row>
          <Row label="Загрузка">{t.loading.map((l) => LOADING[l]).join(", ")}</Row>
          {t.temp && <Row label="Температура">{t.temp[0]}…{t.temp[1]} °C</Row>}
          {!!t.extras.length && <Row label="Дополнительно">{t.extras.join(", ")}</Row>}
        </Card>

        <H2>Международные рейсы</H2>
        <Card className="px-4">
          <div className="py-3"><Pill tone={intl.ok ? "ok" : "gray"}>{intl.text}</Pill></div>
          <Row label="Въезд в Китай">{t.intl.chinaEntry ? "Да" : "Нет"}</Row>
          <Row label="Последний рейс за границу">{t.intl.lastTrip ? dayLabel(t.intl.lastTrip) : "—"}</Row>
          <Row label="Следующий въезд">{t.intl.nextEntry ? `с ${dayLabel(t.intl.nextEntry)}` : "Без ограничений"}</Row>
          <Row label="Документы">{t.intl.permits.length ? t.intl.permits.join(", ") : "—"}</Row>
        </Card>

        <H2>Водитель</H2>
        <Link href={`/driver/${d.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 active:bg-page">
          <Avatar name={d.name} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-semibold">{d.name}</div>
            <div className="text-ink-3"><Stars value={d.rating} /> · {count(d.trips, ["перевозка", "перевозки", "перевозок"])} · стаж {count(d.years, ["год", "года", "лет"])}</div>
          </div>
          {d.verified && <ShieldCheck size={24} className="shrink-0 text-ok" aria-label="Телефон подтверждён" />}
        </Link>
      </Page>

      {role === "client" && !mine && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
          <div className="mx-auto grid max-w-xl grid-cols-[auto_auto_1fr] gap-2 px-3">
            <Button variant="outline" aria-label="Позвонить водителю" onClick={() => toast({ title: "Звонок в демо-версии не совершается", body: d.name })}><Phone size={22} /></Button>
            <Button variant="outline" aria-label="Написать водителю" onClick={() => router.push(`/chats/${openChat(ME_CLIENT, d.id, best?.c.id)}`)}><MessageCircle size={22} /></Button>
            <Button onClick={() => setPick(true)} disabled={t.state !== "free"}>Предложить груз</Button>
          </div>
        </div>
      )}
      {mine && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
          <div className="mx-auto max-w-xl px-3"><LinkButton href={`/fleet/${t.id}`} full>Управлять машиной</LinkButton></div>
        </div>
      )}

      <Sheet open={pick} onClose={() => setPick(false)} title="Какой груз предложить">
        <div className="grid gap-2 pt-1">
          {myOpen.map((c) => {
            const f = fit(t, c);
            const sent = proposed(c.id);
            return (
              <Option key={c.id} selected={!!sent} onClick={() => {
                if (sent) return;
                proposeToTruck(c.id, t.id);
                setPick(false);
                toast({ title: "Предложение отправлено", body: `${d.name} получит заявку ${route(c)}.` });
              }}
                title={`${route(c)} · ${tons(c.weight)}`} hint={sent ? "Уже предложили — ждём ответа" : `${c.price ? money(c.price) : "цену предложит водитель"} · ${f.level === "full" ? "подходит" : f.level === "partial" ? "почти подходит" : "может не подойти"}`} />
            );
          })}
          {!myOpen.length && <p className="text-lg text-ink-2">У вас нет открытых заявок.</p>}
          <LinkButton href="/new" variant="secondary" full className="mt-2">Новая заявка</LinkButton>
        </div>
      </Sheet>
    </>
  );
}
