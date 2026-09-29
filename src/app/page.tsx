"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, ChevronRight, Map as MapIcon, Package, Search, Star, Truck as TruckIcon } from "lucide-react";
import { useStore, route } from "@/lib/store";
import { ACTIVE, BODIES, STATUS, isOpen } from "@/lib/catalog";
import { cityShort, placeLabel, type PlaceQ } from "@/lib/geo";
import { DayLabel, count, money } from "@/lib/format";
import { matchCargo, tons, truckOf } from "@/lib/match";
import { ME_CARRIER, ME_CLIENT } from "@/lib/types";
import { RouteBox } from "@/components/place-picker";
import { Button, LinkButton, Option, Sheet, TruckArt } from "@/components/ui";

const C = (id: string): PlaceQ => ({ type: "city", id });
const CN: PlaceQ = { type: "country", code: "CN" };

export default function Home() {
  const { s } = useStore();
  return s.user.role === "client" ? <ClientHome /> : <CarrierHome />;
}

function Header() {
  const { s } = useStore();
  const unread = s.notifs.filter((n) => n.role === s.user.role && !n.read).length;
  return (
    <header className="mx-auto flex max-w-xl items-center justify-between px-4 pt-[max(10px,env(safe-area-inset-top))]">
      <span className="text-2xl font-bold text-brand">Keruen</span>
      <div className="flex items-center gap-1">
        <Link href="/profile" className="rounded-full bg-page px-3.5 py-2 text-[0.95rem] font-semibold text-ink-2">{s.user.role === "client" ? "Я клиент" : "Я перевозчик"}</Link>
        <Link href="/notifications" aria-label={`Уведомления${unread ? `: ${unread} новых` : ""}`} className="relative grid size-12 place-items-center rounded-xl text-ink active:bg-page">
          <Bell size={26} />
          {unread > 0 && <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-bad px-1 text-xs font-bold text-white">{unread}</span>}
        </Link>
      </div>
    </header>
  );
}

function Frequent({ routes, onPick }: { routes: [PlaceQ, PlaceQ | undefined][]; onPick: (f: PlaceQ, t?: PlaceQ) => void }) {
  return (
    <div className="mt-7">
      <div className="mb-2.5 font-semibold text-ink-3">Частые направления</div>
      <div className="flex flex-wrap gap-2">
        {routes.map(([f, t]) => (
          <button key={placeLabel(f) + placeLabel(t)} onClick={() => onPick(f, t)} className="h-11 rounded-full border-2 border-line px-4 font-semibold active:border-brand active:bg-brand-soft">
            {placeLabel(f)} → {t ? placeLabel(t) : "куда угодно"}
          </button>
        ))}
      </div>
    </div>
  );
}

function Tile({ href, title, text, icon, tone = "brand" }: { href: string; title: string; text: string; icon: React.ReactNode; tone?: "brand" | "warn" }) {
  return (
    <Link href={href} className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4 active:bg-page">
      <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${tone === "warn" ? "bg-warn-soft text-warn" : "bg-brand-soft text-brand"}`}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-semibold leading-snug">{title}</span>
        <span className="block text-ink-3">{text}</span>
      </span>
      <ChevronRight size={24} className="shrink-0 text-ink-3" aria-hidden />
    </Link>
  );
}

function ClientHome() {
  const { s, setQuery } = useStore();
  const router = useRouter();
  const q = s.q.client;
  const mine = s.cargo.filter((c) => c.clientId === ME_CLIENT);
  const open = mine.filter((c) => isOpen(c.status));
  const active = mine.filter((c) => ACTIVE.includes(c.status));
  const toRate = mine.filter((c) => c.status === "done" && !c.byClient);
  const offers = open.reduce((n, c) => n + c.offers.filter((o) => o.status === "new" && o.by === "carrier").length, 0);
  const go = (f?: PlaceQ, t?: PlaceQ) => { setQuery("client", { from: f ?? null, to: t ?? null }); router.push("/search"); };
  return (
    <main className="min-h-dvh bg-white">
      <Header />
      <div className="mx-auto max-w-xl px-4 pb-8">
        <h1 className="mt-5 text-[2rem] font-bold leading-tight">Найти машину</h1>
        <p className="mt-1 text-lg text-ink-3">Китай — Казахстан и по всей стране</p>
        <div className="mt-5">
          <RouteBox from={q.from} to={q.to} onFrom={(v) => setQuery("client", { from: v })} onTo={(v) => setQuery("client", { to: v })} />
        </div>
        <Button full className="mt-3" onClick={() => router.push("/search")}><Search size={22} aria-hidden /> Найти машину</Button>
        <Frequent routes={[[CN, C("almaty")], [C("urumqi"), C("almaty")], [C("khorgos-cn"), C("astana")], [C("yiwu"), C("almaty")], [C("khorgos-kz"), C("shymkent")]]} onPick={go} />
      </div>
      <div className="border-t border-line bg-page px-4 pb-10 pt-6">
        <div className="mx-auto grid max-w-xl gap-3">
          {toRate.map((c) => <Tile key={c.id} href={`/cargo/${c.id}`} tone="warn" icon={<Star size={26} />} title="Оцените перевозку" text={`${route(c)} — как всё прошло?`} />)}
          {(open.length > 0 || active.length > 0) && (
            <Tile href="/orders" icon={<Package size={26} />} title={`Мои заявки: ${open.length + active.length}`}
              text={[offers ? `${count(offers, ["новое предложение", "новых предложения", "новых предложений"])}` : "", active.length ? `в пути: ${active.length}` : ""].filter(Boolean).join(" · ") || "Ждём предложений"} />
          )}
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="text-xl font-bold leading-snug">Не хотите искать сами?</div>
            <p className="mt-1 text-ink-2">Опишите груз один раз — подходящие водители сами предложат цену.</p>
            <LinkButton href="/new" variant="secondary" full className="mt-4">Разместить заявку</LinkButton>
          </div>
          <Tile href="/map" icon={<MapIcon size={26} />} title="Машины на карте" text="Где сейчас свободные машины" />
        </div>
      </div>
    </main>
  );
}

function CarrierHome() {
  const { s, setQuery } = useStore();
  const router = useRouter();
  const [pickTruck, setPickTruck] = useState(false);
  const q = s.q.carrier;
  const myTrucks = s.trucks.filter((t) => t.carrierId === ME_CARRIER);
  const truck = q.truckId ? truckOf(s, q.truckId) : undefined;
  const myIds = new Set(myTrucks.map((t) => t.id));
  const proposals = s.cargo.filter((c) => isOpen(c.status) && c.offers.some((o) => o.by === "client" && o.status === "new" && myIds.has(o.truckId)));
  const trips = s.cargo.filter((c) => c.deal && myIds.has(c.deal.truckId) && ACTIVE.includes(c.status));
  const toRate = s.cargo.filter((c) => c.deal && myIds.has(c.deal.truckId) && c.status === "done" && !c.byCarrier);
  const posted = myTrucks.filter((t) => t.state === "free");
  const idle = myTrucks.filter((t) => t.state === "off");
  const go = (f?: PlaceQ, t?: PlaceQ) => { setQuery("carrier", { from: f ?? null, to: t ?? null }); router.push("/search"); };
  return (
    <main className="min-h-dvh bg-white">
      <Header />
      <div className="mx-auto max-w-xl px-4 pb-8">
        <h1 className="mt-5 text-[2rem] font-bold leading-tight">Найти груз</h1>
        <p className="mt-1 text-lg text-ink-3">Где машина и куда готовы ехать</p>
        <div className="mt-5">
          <RouteBox from={q.from} to={q.to} onFrom={(v) => setQuery("carrier", { from: v })} onTo={(v) => setQuery("carrier", { to: v })} toEmpty="Любое направление" />
        </div>
        <button onClick={() => setPickTruck(true)} className="mt-3 flex w-full items-center gap-3 rounded-2xl border-2 border-line bg-white p-3 text-left active:bg-page">
          <span className="w-20 shrink-0">{truck ? <TruckArt body={truck.body} kind={truck.kind} /> : <TruckIcon size={30} className="mx-auto text-ink-3" />}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.95rem] text-ink-3">Для какой машины</span>
            <span className="block truncate font-semibold">{truck ? `${truck.make} ${truck.model}` : "Любая машина"}</span>
            <span className="block truncate text-ink-2">{truck ? `${BODIES[truck.body].name}, ${tons(truck.capacity)}${truck.volume ? ` · ${truck.volume} м³` : ""}` : "Показать все грузы"}</span>
          </span>
          <ChevronRight size={22} className="shrink-0 text-ink-3" aria-hidden />
        </button>
        <Button full className="mt-3" onClick={() => router.push("/search")}><Search size={22} aria-hidden /> Найти груз</Button>
        <Frequent routes={[[C("khorgos-kz"), C("almaty")], [C("khorgos-cn"), C("astana")], [C("urumqi"), C("almaty")], [C("almaty"), C("urumqi")], [C("almaty"), undefined]]} onPick={go} />
      </div>
      <div className="border-t border-line bg-page px-4 pb-10 pt-6">
        <div className="mx-auto grid max-w-xl gap-3">
          {proposals.map((c) => <Tile key={c.id} href={`/cargo/${c.id}`} tone="warn" icon={<Package size={26} />} title="Клиент предлагает груз" text={`${route(c)} · ${money(c.offers.find((o) => o.by === "client" && o.status === "new")!.price)}`} />)}
          {toRate.map((c) => <Tile key={c.id} href={`/cargo/${c.id}`} tone="warn" icon={<Star size={26} />} title="Оцените клиента" text={route(c)} />)}
          {trips.map((c) => <Tile key={c.id} href={`/cargo/${c.id}`} icon={<TruckIcon size={26} />} title={`Рейс: ${route(c)}`} text={STATUS[c.status]} />)}
          {posted.map((t) => {
            const n = matchCargo(s, t).length;
            return <Tile key={t.id} href={`/fleet/${t.id}`} icon={<TruckIcon size={26} />} title={`${t.make} ${t.model} видна клиентам`} text={`${cityShort(t.at)} · свободна ${DayLabel(t.freeFrom).toLowerCase()} · ${count(n, ["подходящий груз", "подходящих груза", "подходящих грузов"])}`} />;
          })}
          {idle.map((t) => <Tile key={t.id} href={`/fleet/${t.id}`} tone="warn" icon={<TruckIcon size={26} />} title={`${t.make} ${t.model} простаивает`} text="Отметьте, где и когда свободна — клиенты увидят её" />)}
          <Tile href="/map" icon={<MapIcon size={26} />} title="Грузы на карте" text="Где сейчас ждут машину" />
        </div>
      </div>
      <Sheet open={pickTruck} onClose={() => setPickTruck(false)} title="Для какой машины">
        <div className="grid gap-2">
          {myTrucks.map((t) => (
            <Option key={t.id} selected={q.truckId === t.id} onClick={() => { setQuery("carrier", { truckId: t.id, from: { type: "city", id: t.at } }); setPickTruck(false); }}
              icon={<span className="w-10"><TruckArt body={t.body} kind={t.kind} /></span>}
              title={`${t.make} ${t.model} · ${BODIES[t.body].name}`} hint={`${tons(t.capacity)}${t.volume ? ` · ${t.volume} м³` : ""} · ${cityShort(t.at)} · ${t.state === "trip" ? "в рейсе" : `свободна ${DayLabel(t.freeFrom).toLowerCase()}`}`} />
          ))}
          <Option selected={!q.truckId} onClick={() => { setQuery("carrier", { truckId: undefined }); setPickTruck(false); }} icon={<TruckIcon size={24} />} title="Любая машина" hint="Показать все грузы без проверки" />
        </div>
      </Sheet>
    </main>
  );
}
