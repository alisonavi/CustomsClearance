"use client";

import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { BODIES, BODY_IDS, CATEGORIES, CUSTOMS, KINDS, KIND_IDS, type CustomsWhere } from "@/lib/catalog";
import { dayLabel, isoDay, nf, plural } from "@/lib/format";
import { activeFilterCount, searchCargo, searchTrucks } from "@/lib/match";
import { useStore } from "@/lib/store";
import { Button, Choice, Sheet, Toggle } from "./ui";

type ClientKey = "date" | "kind" | "body" | "cap" | "vol" | "scope" | "rating" | "sort";
type CarrierKey = "radius" | "date" | "weight" | "volume" | "category" | "price" | "customs" | "sort";
export type FilterKey = ClientKey | CarrierKey | "all";

const days = () => Array.from({ length: 5 }, (_, i) => isoDay(i + 2));
const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-haspopup="dialog"
      className={`flex h-11 shrink-0 items-center gap-1 rounded-full border-2 pl-4 pr-3 text-base font-semibold ${active ? "border-brand bg-brand-soft text-brand-ink" : "border-line-2 bg-white text-ink"}`}>
      {label} <ChevronDown size={18} aria-hidden />
    </button>
  );
}

/** inDrive-style: a row of big chips; each opens just its own question. */
export function FilterBar() {
  const { s } = useStore();
  const [open, setOpen] = useState<FilterKey | null>(null);
  const role = s.user.role;
  const n = activeFilterCount(role, s);
  const chips: [FilterKey, string, boolean][] = role === "client" ? clientChips(s.q.client.f) : carrierChips(s.q.carrier.f);
  return (
    <>
      <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 py-1">
        <button onClick={() => setOpen("all")} className={`flex h-11 shrink-0 items-center gap-2 rounded-full border-2 px-4 text-base font-semibold ${n ? "border-brand bg-brand text-white" : "border-line-2 bg-white text-ink"}`}>
          <SlidersHorizontal size={19} aria-hidden /> Фильтры{n ? ` · ${n}` : ""}
        </button>
        {chips.map(([k, label, active]) => <Chip key={k} label={label} active={active} onClick={() => setOpen(k)} />)}
      </div>
      <FilterSheet focus={open} onClose={() => setOpen(null)} />
    </>
  );
}

function clientChips(f: ReturnType<typeof useStore>["s"]["q"]["client"]["f"]): [FilterKey, string, boolean][] {
  return [
    ["date", f.date ? (f.date === "today" ? "Сегодня" : f.date === "tomorrow" ? "Завтра" : `До ${dayLabel(f.date)}`) : "Дата", !!f.date],
    ["body", f.bodies.length ? `${BODIES[f.bodies[0] as keyof typeof BODIES].name}${f.bodies.length > 1 ? ` +${f.bodies.length - 1}` : ""}` : "Кузов", f.bodies.length > 0],
    ["cap", f.minCap ? `От ${f.minCap} т` : "Грузоподъёмность", !!f.minCap],
    ["vol", f.minVol ? `От ${f.minVol} м³` : "Объём", !!f.minVol],
    ["scope", f.scope === "intl" ? "Международные" : f.scope === "domestic" ? "По Казахстану" : "Перевозка", f.scope !== "all"],
    ["rating", f.minRating ? `Рейтинг от ${String(f.minRating).replace(".", ",")}` : "Рейтинг", !!f.minRating || f.verifiedOnly],
  ];
}
function carrierChips(f: ReturnType<typeof useStore>["s"]["q"]["carrier"]["f"]): [FilterKey, string, boolean][] {
  return [
    ["radius", f.radius ? `До ${f.radius} км от вас` : "Расстояние", !!f.radius],
    ["date", f.date ? (f.date === "today" ? "Сегодня" : f.date === "tomorrow" ? "Завтра" : dayLabel(f.date)) : "Дата", !!f.date],
    ["weight", f.maxWeight ? `До ${f.maxWeight} т` : "Вес", !!f.maxWeight],
    ["volume", f.maxVol ? `До ${f.maxVol} м³` : "Объём", !!f.maxVol],
    ["category", f.categories.length ? `${CATEGORIES[f.categories[0]]}${f.categories.length > 1 ? ` +${f.categories.length - 1}` : ""}` : "Тип груза", f.categories.length > 0],
    ["price", f.minPrice ? `От ${nf(f.minPrice / 1000)} тыс ₸` : "Цена", !!f.minPrice],
    ["customs", f.customs.length ? `Растаможка: ${f.customs.map((c) => CUSTOMS[c as CustomsWhere].name.toLowerCase()).join(", ")}` : "Растаможка", f.customs.length > 0],
  ];
}

const TITLES: Record<string, string> = {
  all: "Фильтры", date: "Дата", kind: "Тип машины", body: "Кузов", cap: "Грузоподъёмность", vol: "Объём", scope: "Перевозка", rating: "Рейтинг перевозчика",
  sort: "Сортировка", radius: "Расстояние до загрузки", weight: "Вес груза", volume: "Объём груза", category: "Тип груза", price: "Цена", customs: "Где растаможка",
};

function Block({ show, title, children }: { show: boolean; title?: string; children: React.ReactNode }) {
  if (!show) return null;
  return (
    <section className="border-b border-line py-5 last:border-0">
      {title && <h3 className="mb-3 text-lg font-bold">{title}</h3>}
      {children}
    </section>
  );
}

export function FilterSheet({ focus, onClose }: { focus: FilterKey | null; onClose: () => void }) {
  const { s, setClientF, setCarrierF, resetFilters } = useStore();
  const role = s.user.role;
  const all = focus === "all";
  const is = (k: FilterKey) => all || focus === k;
  const total = role === "client" ? searchTrucks(s).length : searchCargo(s).length;
  const noun = role === "client" ? plural(total, ["машину", "машины", "машин"]) : plural(total, ["груз", "груза", "грузов"]);
  const t = (k: FilterKey) => (all ? TITLES[k] : undefined);

  const dateOptions: [string, string][] = [["", "Любая"], ["today", "Сегодня"], ["tomorrow", "Завтра"], ...days().map((d): [string, string] => [d, dayLabel(d)])];

  return (
    <Sheet
      open={!!focus}
      onClose={onClose}
      title={focus ? TITLES[focus] : ""}
      footer={
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="lg" onClick={() => resetFilters(role)}>Сбросить</Button>
          <Button full onClick={onClose}>{total ? `Показать ${total} ${noun}` : "Ничего не найдено"}</Button>
        </div>
      }
    >
      {role === "client" ? (
        <>
          <Block show={is("date")} title={t("date")}>
            <p className="mb-3 text-ink-3">Машина должна освободиться не позже этого дня</p>
            <Choice options={dateOptions} value={s.q.client.f.date ?? ""} onChange={(v) => setClientF({ date: v || undefined })} />
          </Block>
          <Block show={is("kind") && all} title={t("kind")}>
            <Choice multi options={KIND_IDS.map((k): [string, string] => [k, KINDS[k].name])} value={s.q.client.f.kinds} onChange={(v) => setClientF({ kinds: toggle(s.q.client.f.kinds, v) })} />
          </Block>
          <Block show={is("body")} title={t("body")}>
            <Choice multi options={BODY_IDS.map((b): [string, string] => [b, BODIES[b].name])} value={s.q.client.f.bodies} onChange={(v) => setClientF({ bodies: toggle(s.q.client.f.bodies, v) })} />
          </Block>
          <Block show={is("cap")} title={t("cap")}>
            <Choice options={[["0", "Любая"], ["5", "от 5 т"], ["10", "от 10 т"], ["20", "от 20 т"]]} value={String(s.q.client.f.minCap ?? 0)} onChange={(v) => setClientF({ minCap: Number(v) || undefined })} />
          </Block>
          <Block show={is("vol")} title={t("vol")}>
            <Choice options={[["0", "Любой"], ["30", "от 30 м³"], ["60", "от 60 м³"], ["80", "от 80 м³"]]} value={String(s.q.client.f.minVol ?? 0)} onChange={(v) => setClientF({ minVol: Number(v) || undefined })} />
          </Block>
          <Block show={is("scope")} title={t("scope")}>
            <Choice options={[["all", "Все"], ["intl", "Международные (Китай)"], ["domestic", "По Казахстану"]]} value={s.q.client.f.scope} onChange={(v) => setClientF({ scope: v as "all" | "intl" | "domestic" })} />
          </Block>
          <Block show={is("rating")} title={t("rating")}>
            <Choice options={[["0", "Любой"], ["4.5", "от 4,5"], ["4.8", "от 4,8"]]} value={String(s.q.client.f.minRating ?? 0)} onChange={(v) => setClientF({ minRating: Number(v) || undefined })} />
            <div className="mt-3"><Toggle checked={s.q.client.f.verifiedOnly} onChange={(v) => setClientF({ verifiedOnly: v })} label="Только проверенные" hint="Документы машины и водителя проверены" /></div>
          </Block>
          <Block show={all} title="Сортировка">
            <Choice options={[["match", "Сначала подходящие"], ["near", "Ближе к загрузке"], ["rating", "Выше рейтинг"]]} value={s.q.client.f.sort} onChange={(v) => setClientF({ sort: v as "match" | "near" | "rating" })} />
          </Block>
        </>
      ) : (
        <>
          <Block show={is("radius")} title={t("radius")}>
            <p className="mb-3 text-ink-3">Сколько готовы проехать пустым до загрузки</p>
            <Choice options={[["0", "Любое"], ["50", "до 50 км"], ["150", "до 150 км"], ["300", "до 300 км"], ["700", "до 700 км"]]} value={String(s.q.carrier.f.radius ?? 0)} onChange={(v) => setCarrierF({ radius: Number(v) || undefined })} />
          </Block>
          <Block show={is("date")} title={t("date")}>
            <Choice options={dateOptions} value={s.q.carrier.f.date ?? ""} onChange={(v) => setCarrierF({ date: v || undefined })} />
          </Block>
          <Block show={is("weight")} title={t("weight")}>
            <Choice options={[["0", "Любой"], ["5", "до 5 т"], ["10", "до 10 т"], ["20", "до 20 т"], ["25", "до 25 т"]]} value={String(s.q.carrier.f.maxWeight ?? 0)} onChange={(v) => setCarrierF({ maxWeight: Number(v) || undefined })} />
          </Block>
          <Block show={is("volume")} title={t("volume")}>
            <Choice options={[["0", "Любой"], ["40", "до 40 м³"], ["60", "до 60 м³"], ["86", "до 86 м³"], ["100", "до 100 м³"]]} value={String(s.q.carrier.f.maxVol ?? 0)} onChange={(v) => setCarrierF({ maxVol: Number(v) || undefined })} />
          </Block>
          <Block show={is("category")} title={t("category")}>
            <Choice multi options={Object.entries(CATEGORIES)} value={s.q.carrier.f.categories} onChange={(v) => setCarrierF({ categories: toggle(s.q.carrier.f.categories, v) })} />
          </Block>
          <Block show={is("price")} title={t("price")}>
            <Choice options={[["0", "Любая"], ["300000", "от 300 тыс ₸"], ["500000", "от 500 тыс ₸"], ["1000000", "от 1 млн ₸"]]} value={String(s.q.carrier.f.minPrice ?? 0)} onChange={(v) => setCarrierF({ minPrice: Number(v) || undefined })} />
            <p className="mt-3 text-ink-3">Грузы, где клиент ждёт вашу цену, показываем всегда.</p>
          </Block>
          <Block show={is("customs")} title={t("customs")}>
            <Choice multi options={(Object.keys(CUSTOMS) as CustomsWhere[]).map((k): [string, string] => [k, CUSTOMS[k].name])} value={s.q.carrier.f.customs} onChange={(v) => setCarrierF({ customs: toggle(s.q.carrier.f.customs, v) })} />
          </Block>
          <Block show={all} title="Машина">
            <Toggle checked={s.q.carrier.f.fitTruck} onChange={(v) => setCarrierF({ fitTruck: v })} label="Только то, что подходит моей машине" hint="По весу, объёму, кузову, датам и въезду в Китай" />
          </Block>
          <Block show={all} title="Сортировка">
            <Choice options={[["new", "Сначала новые"], ["price", "Дороже"], ["near", "Ближе ко мне"]]} value={s.q.carrier.f.sort} onChange={(v) => setCarrierF({ sort: v as "new" | "price" | "near" })} />
          </Block>
        </>
      )}
    </Sheet>
  );
}
