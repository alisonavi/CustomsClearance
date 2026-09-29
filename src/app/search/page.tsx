"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { useStore } from "@/lib/store";
import { count } from "@/lib/format";
import { searchCargo, searchTrucks, truckOf, tons } from "@/lib/match";
import { cityShort } from "@/lib/geo";
import { RouteBox } from "@/components/place-picker";
import { FilterBar } from "@/components/filters";
import { CargoCard, TruckCard } from "@/components/cards";
import { MapView, mapCity } from "@/components/map-view";
import { Button, Empty, Page, Segmented, TopBar } from "@/components/ui";

export default function SearchPage() {
  const { s, setQuery, resetFilters, toggleSaved, toast } = useStore();
  const router = useRouter();
  const role = s.user.role;
  const [view, setView] = useState<"list" | "map">("list");
  const [city, setCity] = useState<string | undefined>();
  const q = s.q[role];
  const trucks = role === "client" ? searchTrucks(s) : [];
  const cargo = role === "carrier" ? searchCargo(s) : [];
  const total = role === "client" ? trucks.length : cargo.length;
  const truck = role === "carrier" && s.q.carrier.truckId ? truckOf(s, s.q.carrier.truckId) : undefined;
  const saved = s.saved.some((x) => x.role === role && JSON.stringify(x.from) === JSON.stringify(q.from) && JSON.stringify(x.to) === JSON.stringify(q.to));

  const groups = useMemo(() => {
    const m: Record<string, number> = {};
    (role === "client" ? trucks.map((r) => r.t.at) : cargo.map((r) => r.c.from)).forEach((id) => { const k = mapCity(id); m[k] = (m[k] ?? 0) + 1; });
    return Object.entries(m).map(([cityId, n]) => ({ cityId, count: n }));
  }, [role, trucks, cargo]);

  const listTrucks = view === "map" && city ? trucks.filter((r) => mapCity(r.t.at) === city) : trucks;
  const listCargo = view === "map" && city ? cargo.filter((r) => mapCity(r.c.from) === city) : cargo;
  const noun: [string, string, string] = role === "client" ? ["машина", "машины", "машин"] : ["груз", "груза", "грузов"];

  return (
    <>
      <TopBar title={role === "client" ? "Свободные машины" : "Грузы"} onBack={() => router.push("/")} />
      <Page className="px-3 pb-10 pt-3">
        <RouteBox
          from={q.from} to={q.to}
          onFrom={(v) => setQuery(role, { from: v })} onTo={(v) => setQuery(role, { to: v })}
          toEmpty={role === "carrier" ? "Любое направление" : "Город или страна"}
        />
        {role === "carrier" && (
          <p className="mt-2 px-1 text-ink-3">{truck ? `Проверяем по машине ${truck.make} ${truck.model}: ${tons(truck.capacity)}${truck.volume ? `, ${truck.volume} м³` : ""}` : "Без проверки по машине — все грузы"}</p>
        )}
        <div className="mt-3"><FilterBar /></div>
        <div className="mt-3"><Segmented options={[["list", "Списком"], ["map", "На карте"]]} value={view} onChange={(v) => { setView(v); setCity(undefined); }} /></div>

        {view === "map" && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-line">
            <div className="h-[52dvh] min-h-80">
              <MapView groups={groups} selected={city} onSelect={(c) => setCity(c === city ? undefined : c)} layers={{ border: true, customs: false, hub: false }} />
            </div>
            <p className="bg-white px-4 py-2.5 text-[0.95rem] text-ink-3">Показываем примерно — по городу, без точного адреса. Нажмите на кружок, чтобы увидеть список.</p>
          </div>
        )}

        <div className="mt-5 flex items-baseline justify-between gap-3 px-1">
          <h2 className="text-xl font-bold">
            {view === "map" && city ? `${city.startsWith("khorgos") ? "Хоргос" : cityShort(city)}: ${count(role === "client" ? listTrucks.length : listCargo.length, noun)}` : total ? `Нашли ${count(total, noun)}` : "Ничего не нашли"}
          </h2>
          {view === "map" && city && <button onClick={() => setCity(undefined)} className="font-semibold text-brand">Все</button>}
        </div>

        <div className="mt-3 grid gap-3">
          {role === "client" ? listTrucks.map((r) => <TruckCard key={r.t.id} t={r.t} fit={r.f} />) : listCargo.map((r) => <CargoCard key={r.c.id} c={r.c} fit={r.f} from={truck?.at} />)}
        </div>

        {!total && (
          <Empty
            title={role === "client" ? "Свободных машин по этим условиям нет" : "Грузов по этим условиям нет"}
            text="Попробуйте убрать фильтры или выбрать страну целиком. Или включите уведомления — сообщим, как только появится."
            action={<Button variant="secondary" onClick={() => resetFilters(role)}>Сбросить фильтры</Button>}
          />
        )}

        <button
          onClick={() => { const on = toggleSaved(); toast({ title: on ? "Будем сообщать о новых" : "Уведомления выключены", body: on ? (role === "client" ? "Пришлём, когда на этом направлении появится машина." : "Пришлём, когда появится подходящий груз.") : "Для этого направления больше не пишем." }); }}
          className={`mt-5 flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left ${saved ? "border-brand bg-brand-soft" : "border-line bg-white"}`}
        >
          {saved ? <BellRing size={26} className="shrink-0 text-brand" /> : <Bell size={26} className="shrink-0 text-brand" />}
          <span>
            <span className="block text-lg font-semibold">{saved ? "Сообщаем о новых" : role === "client" ? "Сообщать о новых машинах" : "Сообщать о новых грузах"}</span>
            <span className="block text-ink-3">{saved ? "Нажмите, чтобы выключить" : "По этому направлению и фильтрам"}</span>
          </span>
        </button>
      </Page>
    </>
  );
}
