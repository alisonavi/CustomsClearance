"use client";

import Link from "next/link";
import { ChevronRight, Plus, ShieldCheck } from "lucide-react";
import { useStore, route } from "@/lib/store";
import { ACTIVE, BODIES } from "@/lib/catalog";
import { cityShort } from "@/lib/geo";
import { DayLabel, count } from "@/lib/format";
import { driverOf, intlStatus, matchCargo, tons } from "@/lib/match";
import { ME_CARRIER, type Truck } from "@/lib/types";
import { Avatar, Card, H2, LinkButton, Page, Pill, Plate, Stars, TopBar, TruckArt } from "@/components/ui";

/** Spec §4.2–4.3: my trucks, their availability, drivers, active trips. */
export default function Fleet() {
  const { s } = useStore();
  const trucks = s.trucks.filter((t) => t.carrierId === ME_CARRIER);
  const drivers = s.drivers.filter((d) => d.carrierId === ME_CARRIER);
  const company = s.user.carrierType === "company";
  const n = { free: trucks.filter((t) => t.state === "free").length, trip: trucks.filter((t) => t.state === "trip").length, off: trucks.filter((t) => t.state === "off").length };
  return (
    <>
      <TopBar title={company ? "Мой парк" : "Мои машины"} back={false} />
      <Page className="px-3 pb-10 pt-3">
        <div className="grid grid-cols-3 gap-2">
          <Stat n={n.free} label="Свободны" tone="ok" />
          <Stat n={n.trip} label="В рейсе" tone="brand" />
          <Stat n={n.off} label="Простой" tone="warn" />
        </div>
        <H2>{count(trucks.length, ["машина", "машины", "машин"])}</H2>
        <div className="grid gap-3">{trucks.map((t) => <TruckRow key={t.id} t={t} />)}</div>
        <LinkButton href="/fleet/add" variant="secondary" full className="mt-3"><Plus size={22} /> Добавить машину</LinkButton>

        {(company || drivers.length > 1) && (
          <>
            <H2>Водители</H2>
            <Card className="divide-y divide-line">
              {drivers.map((d) => {
                const t = trucks.find((x) => x.driverId === d.id);
                return (
                  <Link key={d.id} href={`/driver/${d.id}`} className="flex items-center gap-3 p-4 active:bg-page">
                    <Avatar name={d.name} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-lg font-semibold">{d.name}</div>
                      <div className="truncate text-ink-3">{t ? `${t.make} ${t.model}` : "Без машины"} · {d.ratingCount ? <Stars value={d.rating} /> : "новый"}</div>
                    </div>
                    {d.verified && <ShieldCheck size={22} className="shrink-0 text-ok" aria-label="Телефон подтверждён" />}
                  </Link>
                );
              })}
            </Card>
          </>
        )}
      </Page>
    </>
  );
}

function Stat({ n, label, tone }: { n: number; label: string; tone: "ok" | "brand" | "warn" }) {
  const c = { ok: "bg-ok-soft text-ok", brand: "bg-brand-soft text-brand-ink", warn: "bg-warn-soft text-warn" }[tone];
  return <div className={`rounded-2xl px-3 py-3 ${c}`}><div className="text-2xl font-bold">{n}</div><div className="font-semibold">{label}</div></div>;
}

function TruckRow({ t }: { t: Truck }) {
  const { s } = useStore();
  const d = driverOf(s, t.driverId);
  const trip = s.cargo.find((c) => c.deal?.truckId === t.id && ACTIVE.includes(c.status));
  const matches = t.state === "free" ? matchCargo(s, t).length : 0;
  const intl = intlStatus(t);
  return (
    <Link href={`/fleet/${t.id}`} className="block rounded-2xl border border-line bg-white p-4 active:bg-page">
      <div className="flex items-start gap-3">
        <span className="w-24 shrink-0 rounded-xl bg-brand-soft/60 p-1"><TruckArt body={t.body} kind={t.kind} /></span>
        <div className="min-w-0 flex-1">
          <div className="text-lg font-bold leading-snug">{t.make} {t.model}</div>
          <div className="text-ink-2">{BODIES[t.body].name}</div>
          <div className="text-ink-2">{tons(t.capacity)}{t.volume ? ` · ${t.volume} м³` : ""}</div>
          <div className="mt-1"><Plate plate={t.plate} cn={t.cnPlate} /></div>
        </div>
      </div>
      <div className="mt-3 border-t border-line pt-3">
        {t.state === "trip" && trip && <p><Pill tone="brand">В рейсе</Pill> <span className="ml-1 font-semibold">{route(trip)}</span></p>}
        {t.state === "trip" && !trip && <p><Pill tone="brand">В рейсе</Pill> <span className="ml-1 text-ink-3">освободится {DayLabel(t.freeFrom).toLowerCase()}</span></p>}
        {t.state === "free" && <p><Pill tone="ok">Видна клиентам</Pill> <span className="ml-1">{cityShort(t.at)} · с {DayLabel(t.freeFrom).toLowerCase()}</span></p>}
        {t.state === "off" && <p><Pill tone="warn">Не размещена</Pill> <span className="ml-1 text-ink-3">клиенты её не видят</span></p>}
        <p className="mt-2 text-ink-3">Водитель: {d.name} · {intl.ok ? "въезд в Китай есть" : "только Казахстан"}{t.verified === "pending" ? " · документы на проверке" : ""}</p>
        {t.state === "free" && <p className="mt-1 inline-flex items-center gap-1 font-semibold text-brand">{count(matches, ["подходящий груз", "подходящих груза", "подходящих грузов"])} <ChevronRight size={20} aria-hidden /></p>}
        {t.state === "off" && <p className="mt-1 inline-flex items-center gap-1 font-semibold text-brand">Отметить, что свободна <ChevronRight size={20} aria-hidden /></p>}
      </div>
    </Link>
  );
}
