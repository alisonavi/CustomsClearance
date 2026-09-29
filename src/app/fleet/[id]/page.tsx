"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ChevronRight, MapPin } from "lucide-react";
import { useStore, route } from "@/lib/store";
import { ACTIVE, BODIES, PERMITS, STATUS } from "@/lib/catalog";
import { CITIES, COUNTRIES, cityFull } from "@/lib/geo";
import { DayLabel, ago, count, dayLabel, isoDay } from "@/lib/format";
import { driverOf, intlStatus, matchCargo, tons } from "@/lib/match";
import { ME_CARRIER } from "@/lib/types";
import { CargoCard, goingLabel } from "@/components/cards";
import { PlacePicker } from "@/components/place-picker";
import { Avatar, Button, Card, Choice, Empty, Field, H2, Page, Pill, Plate, Row, Sheet, Stars, Toggle, TopBar, TruckArt, Verified } from "@/components/ui";

/** Carrier's own truck: post availability (DAT "post truck"), see matches, border readiness. */
export default function FleetTruck() {
  const { id } = useParams<{ id: string }>();
  const { s, postTruck, unpostTruck, updateTruck, toast } = useStore();
  const t = s.trucks.find((x) => x.id === id && x.carrierId === ME_CARRIER);
  const [post, setPost] = useState(false);
  const [picker, setPicker] = useState(false);
  const [at, setAt] = useState(t?.at ?? "almaty");
  const [free, setFree] = useState(t && t.freeFrom > isoDay(0) ? t.freeFrom : isoDay(0));
  const [going, setGoing] = useState<string[]>(t?.goingTo ?? []);
  if (!t) return (<><TopBar title="Машина" /><Page className="p-4"><Empty title="Машина не найдена" /></Page></>);

  const d = driverOf(s, t.driverId);
  const trip = s.cargo.find((c) => c.deal?.truckId === t.id && ACTIVE.includes(c.status));
  const matches = t.state === "free" ? matchCargo(s, t) : [];
  const intl = intlStatus(t);
  const days = Array.from({ length: 12 }, (_, k) => isoDay(k));
  const dest: [string, string][] = [["KZ", "Весь Казахстан"], ["CN", "Весь Китай"], ...CITIES.filter((c) => c.popular && c.id !== at).map((c): [string, string] => [c.id, c.id.startsWith("khorgos") ? `Хоргос (${c.country === "CN" ? "КНР" : "РК"})` : c.name])];

  return (
    <>
      <TopBar title={`${t.make} ${t.model}`} />
      <Page className="px-3 pb-12 pt-3">
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <span className="w-28 shrink-0 rounded-xl bg-brand-soft/60 p-1.5"><TruckArt body={t.body} kind={t.kind} /></span>
            <div className="min-w-0">
              <div className="text-xl font-bold leading-tight">{BODIES[t.body].name}, {tons(t.capacity)}{t.volume ? ` · ${t.volume} м³` : ""}</div>
              <div className="text-ink-2">{t.make} {t.model}, {t.year}</div>
              <div className="mt-1.5 flex flex-wrap gap-2"><Plate plate={t.plate} cn={t.cnPlate} /><Verified ok={t.verified} /></div>
            </div>
          </div>
        </Card>

        <H2>Где и когда свободна</H2>
        {t.state === "trip" ? (
          <Card className="p-5">
            <Pill tone="brand">В рейсе</Pill>
            {trip ? (
              <Link href={`/cargo/${trip.id}`} className="mt-3 flex items-center justify-between gap-3">
                <span><span className="block text-lg font-bold">{route(trip)}</span><span className="text-ink-3">{STATUS[trip.status]}</span></span>
                <ChevronRight className="text-ink-3" />
              </Link>
            ) : <p className="mt-2 text-lg">Освободится {DayLabel(t.freeFrom).toLowerCase()}</p>}
          </Card>
        ) : t.state === "free" ? (
          <Card className="p-5">
            <Pill tone="ok">Клиенты видят машину{t.postedAt ? ` · ${ago(t.postedAt)}` : ""}</Pill>
            <div className="mt-3 grid gap-1 text-lg">
              <p>Где: <b className="font-semibold">{cityFull(t.at)}</b></p>
              <p>Свободна: <b className="font-semibold">{DayLabel(t.freeFrom)}</b></p>
              <p>Куда готов ехать: <b className="font-semibold">{goingLabel(t)}</b></p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setPost(true)}>Изменить</Button>
              <Button variant="outline" onClick={() => { unpostTruck(t.id); toast({ title: "Машина снята", body: "Клиенты больше её не видят." }); }}>Снять</Button>
            </div>
          </Card>
        ) : (
          <Card className="p-5">
            <p className="text-lg">Машина сейчас <b>не видна клиентам</b>. Отметьте, где и когда она свободна — и мы покажем её тем, кому нужно везти груз по пути.</p>
            <Button full className="mt-4" onClick={() => setPost(true)}>Машина свободна — разместить</Button>
          </Card>
        )}

        {t.state === "free" && (
          <>
            <H2>{matches.length ? `Подходящие грузы: ${matches.length}` : "Подходящих грузов пока нет"}</H2>
            {matches.length ? <div className="grid gap-3">{matches.map(({ c, f }) => <CargoCard key={c.id} c={c} fit={f} from={t.at} />)}</div> : <p className="px-1 text-ink-3">Пришлём уведомление, как только появится груз по пути.</p>}
          </>
        )}

        <H2>Международные рейсы</H2>
        <Card className="px-4 pb-2">
          <div className="pt-4"><Pill tone={intl.ok ? "ok" : "gray"}>{intl.text}</Pill></div>
          <div className="border-b border-line py-2">
            <Toggle checked={t.intl.chinaEntry} onChange={(v) => updateTruck(t.id, { intl: { ...t.intl, chinaEntry: v } })} label="Может въезжать в Китай" />
          </div>
          <div className="border-b border-line py-4">
            <div className="mb-2 font-semibold">Документы и разрешения</div>
            <Choice multi options={PERMITS.map((p): [string, string] => [p, p])} value={t.intl.permits} onChange={(v) => updateTruck(t.id, { intl: { ...t.intl, permits: t.intl.permits.includes(v) ? t.intl.permits.filter((x) => x !== v) : [...t.intl.permits, v] } })} />
          </div>
          <Row label="Последний рейс за границу">{t.intl.lastTrip ? dayLabel(t.intl.lastTrip) : "—"}</Row>
          <Row label="Следующий въезд в Китай">{t.intl.nextEntry ? `с ${dayLabel(t.intl.nextEntry)}` : "Без ограничений"}</Row>
          <p className="py-3 text-[0.95rem] text-ink-3">Правила частоты пересечения границы в демо-версии условные — их нужно проверить перед запуском.</p>
        </Card>

        <H2>Водитель</H2>
        <Link href={`/driver/${d.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 active:bg-page">
          <Avatar name={d.name} />
          <div className="min-w-0 flex-1"><div className="truncate text-lg font-semibold">{d.name}</div><div className="text-ink-3">{d.ratingCount ? <Stars value={d.rating} /> : "новый водитель"} · {count(d.trips, ["рейс", "рейса", "рейсов"])}</div></div>
          <ChevronRight className="text-ink-3" />
        </Link>
        <Link href={`/truck/${t.id}`} className="mt-4 block text-center text-lg font-semibold text-brand">Как машину видят клиенты</Link>
      </Page>

      <Sheet open={post} onClose={() => setPost(false)} title="Где и когда свободна"
        footer={<Button full onClick={() => { postTruck(t.id, { at, freeFrom: free, goingTo: going }); setPost(false); toast({ title: "Машина размещена", body: "Ищем подходящие грузы. Клиенты уже видят машину." }); }}>Показать клиентам</Button>}>
        <div className="grid gap-6 pt-1">
          <Field label="Где будет машина">
            <button onClick={() => setPicker(true)} className="flex w-full items-center gap-3 rounded-2xl border-2 border-line-2 p-4 text-left active:bg-page">
              <MapPin size={24} className="text-brand" /><span className="text-lg font-semibold">{cityFull(at)}</span><span className="ml-auto font-semibold text-brand">Изменить</span>
            </button>
          </Field>
          <Field label="С какого числа свободна">
            <div className="grid grid-cols-4 gap-2">
              {days.map((day, k) => (
                <button key={day} onClick={() => setFree(day)} aria-pressed={free === day} className={`min-h-14 rounded-xl border-2 font-semibold ${free === day ? "border-brand bg-brand text-white" : "border-line bg-white"}`}>
                  {k === 0 ? "Сегодня" : k === 1 ? "Завтра" : new Date(day + "T12:00").toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Куда готовы ехать" hint="Ничего не выбрано — значит, в любую сторону">
            <Choice multi options={dest} value={going} onChange={(v) => setGoing(going.includes(v) ? going.filter((x) => x !== v) : [...going, v])} />
            {going.length > 0 && <p className="mt-2 text-ink-3">Выбрано: {going.map((g) => (g in COUNTRIES ? `весь ${COUNTRIES[g as keyof typeof COUNTRIES].name}` : dest.find(([k]) => k === g)?.[1])).join(", ")}</p>}
          </Field>
        </div>
      </Sheet>
      <PlacePicker open={picker} title="Где будет машина" onPick={(p) => p.type === "city" && setAt(p.id)} onClose={() => setPicker(false)} />
    </>
  );
}
