"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronLeft, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { isOpen } from "@/lib/catalog";
import { cityShort, poi } from "@/lib/geo";
import { count } from "@/lib/format";
import { CargoCard, TruckCard } from "@/components/cards";
import { MapView, type Layers } from "@/components/map-view";
import { Segmented } from "@/components/ui";

/** Spec §9: map of free trucks / loads, border crossings, customs points, logistics centres. */
export default function MapPage() {
  const { s } = useStore();
  const router = useRouter();
  const [mode, setMode] = useState<"trucks" | "cargo">(s.user.role === "client" ? "trucks" : "cargo");
  const [layers, setLayers] = useState<Layers>({ border: true, customs: true, hub: false });
  const [city, setCity] = useState<string>();
  const [point, setPoint] = useState<string>();

  const trucks = s.trucks.filter((t) => t.state === "free");
  const cargo = s.cargo.filter((c) => isOpen(c.status));
  const groups = useMemo(() => {
    const m: Record<string, number> = {};
    (mode === "trucks" ? trucks.map((t) => t.at) : cargo.map((c) => c.from)).forEach((id) => { m[id] = (m[id] ?? 0) + 1; });
    return Object.entries(m).map(([cityId, n]) => ({ cityId, count: n }));
  }, [mode, trucks, cargo]);
  const p = point ? poi(point) : undefined;

  const layerChip = (k: keyof Layers, label: string) => (
    <button onClick={() => setLayers({ ...layers, [k]: !layers[k] })} aria-pressed={layers[k]}
      className={`h-10 shrink-0 rounded-full border-2 px-3.5 text-[0.95rem] font-semibold shadow-sm ${layers[k] ? "border-brand bg-brand-soft text-brand-ink" : "border-line bg-white text-ink-2"}`}>
      {label}
    </button>
  );

  return (
    <main className="fixed inset-0 flex flex-col bg-white">
      <div className="relative z-10 border-b border-line bg-white px-3 pb-3 pt-[max(8px,env(safe-area-inset-top))]">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center gap-2">
            <button onClick={() => (history.length > 1 ? router.back() : router.push("/"))} className="flex h-11 items-center gap-0.5 rounded-xl pr-2 font-semibold text-brand"><ChevronLeft size={26} /> Назад</button>
            <div className="flex-1"><Segmented options={[["trucks", "Машины"], ["cargo", "Грузы"]]} value={mode} onChange={(v) => { setMode(v); setCity(undefined); }} /></div>
          </div>
          <div className="no-scrollbar mt-2.5 flex gap-2 overflow-x-auto">
            {layerChip("border", "Погранпереходы")}
            {layerChip("customs", "Таможня и СВХ")}
            {layerChip("hub", "Логистические центры")}
          </div>
        </div>
      </div>
      <div className="relative flex-1">
        <MapView groups={groups} selected={city} onSelect={(c) => { setPoint(undefined); setCity(c === city ? undefined : c); }} layers={layers} onPoi={(id) => { setCity(undefined); setPoint(id); }} />
        {!city && !p && (
          <div className="pointer-events-none absolute inset-x-3 bottom-4 z-[500] mx-auto max-w-xl rounded-2xl bg-white/95 px-4 py-3 text-ink-2 shadow-md">
            {mode === "trucks" ? count(trucks.length, ["свободная машина", "свободные машины", "свободных машин"]) : count(cargo.length, ["груз ждёт", "груза ждут", "грузов ждут"]) + " машину"}. Нажмите на синий кружок. Машины показаны по городу, без точного места.
          </div>
        )}
      </div>
      {(city || p) && (
        <div className="sheet-in absolute inset-x-0 bottom-0 z-[600] mx-auto max-h-[62dvh] max-w-xl overflow-y-auto rounded-t-3xl bg-white px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_30px_rgba(14,26,43,0.2)]">
          <div className="flex items-center justify-between gap-3 pb-3">
            <h2 className="text-xl font-bold">{p ? p.name : `${cityShort(city!)}: ${mode === "trucks" ? count(groups.find((g) => g.cityId === city)?.count ?? 0, ["машина", "машины", "машин"]) : count(groups.find((g) => g.cityId === city)?.count ?? 0, ["груз", "груза", "грузов"])}`}</h2>
            <button onClick={() => { setCity(undefined); setPoint(undefined); }} className="flex h-11 items-center gap-1 rounded-xl px-3 font-semibold text-brand"><X size={22} /> Закрыть</button>
          </div>
          {p ? (
            <p className="pb-2 text-lg text-ink-2">{p.note}. {p.kind === "border" ? "Время ожидания на переходе в демо-версии не показываем." : ""}</p>
          ) : (
            <div className="grid gap-3">
              {mode === "trucks" ? trucks.filter((t) => t.at === city).map((t) => <TruckCard key={t.id} t={t} />) : cargo.filter((c) => c.from === city).map((c) => <CargoCard key={c.id} c={c} />)}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
