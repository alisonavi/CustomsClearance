"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, MapPin, Pencil } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  BODIES, BODY_IDS, CATEGORIES, CUSTOMS, EXTRAS, LOADING, PACKAGING,
  type BodyId, type CustomsWhere, type LoadId, type PackId,
} from "@/lib/catalog";
import { CITIES, COUNTRIES, CUSTOMS_POSTS, city, cityFull, countryOf, poi } from "@/lib/geo";
import { DayLabel, isoDay, money, rangeLabel, round10k, weekday } from "@/lib/format";
import { priceHint, tons } from "@/lib/match";
import { PlacePicker } from "@/components/place-picker";
import { Button, Choice, Field, Option, Stepper, Toggle, TruckArt, inputCls } from "@/components/ui";

type Draft = {
  from?: string; fromPoint: string; to?: string; toPoint: string; customs?: CustomsWhere; post?: string;
  title: string; note: string; category?: string; packaging?: PackId; stackable?: boolean;
  weight: number; volume: number; places: number; dims: string;
  bodies: BodyId[]; temp: [number, number]; loading: LoadId[]; extras: string[];
  date?: string; flex: number; urgent: boolean; priceMode?: "fixed" | "offers"; price: number;
};
type Step = "from" | "to" | "customs" | "cargo" | "size" | "truck" | "date" | "price" | "check";
const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

export default function NewRequest() {
  const router = useRouter();
  const { s, createCargo, toast } = useStore();
  const q = s.q.client;
  const [d, setD] = useState<Draft>({
    from: q.from?.type === "city" ? q.from.id : undefined, fromPoint: "", to: q.to?.type === "city" ? q.to.id : undefined, toPoint: "",
    title: "", note: "", weight: 0, volume: 0, places: 0, dims: "", bodies: [], temp: [2, 6], loading: ["back"], extras: [], flex: 1, urgent: false, price: 0,
  });
  const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));
  const intl = !!d.from && !!d.to && countryOf(d.from) !== countryOf(d.to);
  const steps: Step[] = ["from", "to", ...(intl ? (["customs"] as Step[]) : []), "cargo", "size", "truck", "date", "price", "check"];
  const [i, setI] = useState(0);
  const step = steps[Math.min(i, steps.length - 1)];
  const [picker, setPicker] = useState<"from" | "to" | null>(null);
  const hint = d.from && d.to ? priceHint(d.from, d.to, d.weight || 10, d.bodies[0]) : undefined;

  const valid: Record<Step, boolean> = {
    from: !!d.from, to: !!d.to && d.to !== d.from, customs: !!d.customs && (d.customs !== "post" || !!d.post),
    cargo: d.title.trim().length > 1 && !!d.category, size: d.weight > 0, truck: true, date: !!d.date,
    price: d.priceMode === "offers" || (d.priceMode === "fixed" && d.price > 0), check: true,
  };
  const why: Partial<Record<Step, string>> = {
    from: "Выберите город загрузки", to: d.to && d.to === d.from ? "Город доставки совпадает с городом загрузки" : "Выберите город доставки",
    customs: "Выберите, где будет растаможка", cargo: "Напишите, что везёте, и выберите категорию", size: "Укажите вес груза", date: "Выберите день загрузки", price: "Выберите, как договоримся о цене",
  };
  const goto = (st: Step) => setI(steps.indexOf(st));
  const next = () => setI((x) => Math.min(x + 1, steps.length - 1));
  const back = () => (i === 0 ? router.back() : setI(i - 1));

  const publish = () => {
    if (!d.from || !d.to || !d.date || !d.category || !d.priceMode) return;
    const id = createCargo({
      from: d.from, fromPoint: d.fromPoint || undefined, to: d.to, toPoint: d.toPoint || undefined,
      customs: intl && d.customs ? { where: d.customs, post: d.customs === "post" || d.customs === "border" ? d.post : undefined } : undefined,
      title: d.title.trim(), note: d.note.trim() || undefined, category: d.category, weight: d.weight, volume: d.volume, places: d.places || undefined, dims: d.dims || undefined,
      packaging: d.packaging, stackable: d.stackable, bodies: d.bodies, temp: d.bodies.includes("reefer") ? d.temp : undefined, loading: d.loading, extras: d.extras,
      date: d.date, flex: d.flex, urgent: d.urgent, priceMode: d.priceMode, price: d.priceMode === "fixed" ? d.price : undefined,
    });
    toast({ title: "Заявка опубликована", body: "Ищем подходящие машины. Предложения водителей придут в уведомления." });
    router.replace(`/cargo/${id}`);
  };

  const cityList = (which: "from" | "to") => {
    const order = which === "from" ? ["CN", "KZ"] : ["KZ", "CN"];
    const list = order.flatMap((cc) => CITIES.filter((c) => c.country === cc && c.popular));
    const value = which === "from" ? d.from : d.to;
    if (value) {
      return (
        <>
          <div className="flex items-center gap-4 rounded-2xl border-2 border-brand bg-brand-soft p-4">
            <MapPin size={28} className="shrink-0 text-brand" />
            <div className="min-w-0 flex-1"><div className="text-xl font-bold">{city(value).name}</div><div className="text-ink-2">{COUNTRIES[city(value).country].name}</div></div>
            <Button variant="outline" size="md" onClick={() => (which === "from" ? set({ from: undefined }) : set({ to: undefined }))}>Изменить</Button>
          </div>
          <Field label={which === "from" ? "Адрес или склад загрузки" : "Адрес или склад разгрузки"} hint="Необязательно. Точный адрес увидит только выбранный водитель.">
            <input value={which === "from" ? d.fromPoint : d.toPoint} onChange={(e) => (which === "from" ? set({ fromPoint: e.target.value }) : set({ toPoint: e.target.value }))} placeholder={which === "from" ? "Например: склад поставщика" : "Например: СВХ Алматы"} className={inputCls} />
          </Field>
        </>
      );
    }
    return (
      <>
        <div className="grid gap-2">
          {list.map((c) => (
            <button key={c.id} onClick={() => (which === "from" ? set({ from: c.id }) : set({ to: c.id }))} disabled={which === "to" && c.id === d.from}
              className="flex items-center gap-4 rounded-2xl border-2 border-line bg-white p-4 text-left active:border-brand active:bg-brand-soft disabled:opacity-40">
              <MapPin size={24} className="shrink-0 text-brand" />
              <span className="text-lg font-semibold">{c.name}</span>
              <span className="ml-auto text-ink-3">{COUNTRIES[c.country].name}</span>
            </button>
          ))}
        </div>
        <Button variant="secondary" full onClick={() => setPicker(which)}>Другой город — найти по названию</Button>
      </>
    );
  };

  const days = Array.from({ length: 15 }, (_, k) => isoDay(k));

  const titles: Record<Step, string> = {
    from: "Откуда забрать груз?", to: "Куда доставить?", customs: "Где будет растаможка?", cargo: "Что везёте?", size: "Вес и объём",
    truck: "Какая машина нужна?", date: "Когда загрузка?", price: "Как договоримся о цене?", check: "Проверьте заявку",
  };

  return (
    <main className="flex min-h-dvh flex-col bg-white">
      <div className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-xl px-2 pt-[max(6px,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between">
            <button onClick={back} className="flex h-12 items-center gap-0.5 rounded-xl pl-1 pr-3 text-base font-semibold text-brand active:bg-brand-soft"><ChevronLeft size={26} /> Назад</button>
            <span className="pr-3 font-semibold text-ink-3">Шаг {i + 1} из {steps.length}</span>
          </div>
          <div className="mx-2 mb-2 mt-1 h-1.5 overflow-hidden rounded-full bg-page"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${((i + 1) / steps.length) * 100}%` }} /></div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-xl flex-1 px-4 pb-8 pt-6">
        <h1 className="mb-5 text-[1.9rem] font-bold leading-tight">{titles[step]}</h1>
        <div className="grid gap-6">
          {step === "from" && cityList("from")}
          {step === "to" && cityList("to")}

          {step === "customs" && (
            <>
              <p className="-mt-3 text-lg text-ink-2">Перевозка международная — укажите, где оформляете груз. Водитель заранее будет знать, где стоять.</p>
              <div className="grid gap-2" role="radiogroup">
                {(Object.keys(CUSTOMS) as CustomsWhere[]).map((k) => <Option key={k} selected={d.customs === k} onClick={() => set({ customs: k, post: k === "border" ? "nurzholy" : k === "post" ? d.post : undefined })} title={CUSTOMS[k].name} hint={CUSTOMS[k].hint} />)}
              </div>
              {(d.customs === "post" || d.customs === "border") && (
                <Field label={d.customs === "border" ? "Какой переход" : "Какой пост или СВХ"}>
                  <div className="grid gap-2" role="radiogroup">
                    {CUSTOMS_POSTS.filter((p) => (d.customs === "border" ? p.kind === "border" : true)).map((p) => <Option key={p.id} selected={d.post === p.id} onClick={() => set({ post: p.id })} title={p.name} hint={p.note} />)}
                  </div>
                </Field>
              )}
            </>
          )}

          {step === "cargo" && (
            <>
              <Field label="Название"><input value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder="Например: кондиционеры в коробках" className={inputCls} /></Field>
              <Field label="Категория"><Choice options={Object.entries(CATEGORIES)} value={d.category} onChange={(v) => set({ category: v })} /></Field>
              <Field label="Упаковка"><Choice options={Object.entries(PACKAGING) as [PackId, string][]} value={d.packaging} onChange={(v) => set({ packaging: v })} /></Field>
              <Field label="Можно ставить друг на друга?"><Choice columns={2} options={[["yes", "Да, можно"], ["no", "Нет, нельзя"]]} value={d.stackable === undefined ? undefined : d.stackable ? "yes" : "no"} onChange={(v) => set({ stackable: v === "yes" })} /></Field>
              <Field label="Особенности" hint="Необязательно. Например: хрупкое, не кантовать"><input value={d.note} onChange={(e) => set({ note: e.target.value })} className={inputCls} /></Field>
            </>
          )}

          {step === "size" && (
            <>
              <Field label="Вес"><Stepper value={d.weight} onChange={(n) => set({ weight: n })} step={0.5} max={60} unit="т" label="Вес в тоннах" /></Field>
              <Field label="Объём" hint="Если не знаете точно — укажите примерно"><Stepper value={d.volume} onChange={(n) => set({ volume: n })} step={1} max={200} unit="м³" label="Объём в кубометрах" /></Field>
              <Field label="Сколько мест или паллет"><Stepper value={d.places} onChange={(n) => set({ places: Math.round(n) })} step={1} max={5000} unit="шт" label="Количество мест" /></Field>
              <Field label="Размеры самого большого места" hint="Необязательно"><input value={d.dims} onChange={(e) => set({ dims: e.target.value })} placeholder="Например: 1,2 × 1,0 × 1,6 м" className={inputCls} /></Field>
            </>
          )}

          {step === "truck" && (
            <>
              <Field label="Кузов" hint="Можно выбрать несколько. Не знаете — оставьте «Любой».">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => set({ bodies: [] })} aria-pressed={!d.bodies.length} className={`flex min-h-24 flex-col items-center justify-center rounded-2xl border-2 p-2 text-lg font-semibold ${!d.bodies.length ? "border-brand bg-brand-soft text-brand-ink" : "border-line bg-white"}`}>Любой кузов</button>
                  {BODY_IDS.map((b) => {
                    const on = d.bodies.includes(b);
                    return (
                      <button key={b} onClick={() => set({ bodies: toggle(d.bodies, b) })} aria-pressed={on} className={`flex flex-col items-center rounded-2xl border-2 p-2 ${on ? "border-brand bg-brand-soft" : "border-line bg-white"}`}>
                        <TruckArt body={b} className="h-14 w-full" />
                        <span className={`text-base font-semibold ${on ? "text-brand-ink" : ""}`}>{BODIES[b].name}</span>
                      </button>
                    );
                  })}
                </div>
              </Field>
              {d.bodies.includes("reefer") && (
                <>
                  <Field label="Температура от"><Stepper value={d.temp[0]} onChange={(n) => set({ temp: [n, d.temp[1]] })} step={1} min={-30} max={30} label="Температура от" unit="°C" /></Field>
                  <Field label="Температура до"><Stepper value={d.temp[1]} onChange={(n) => set({ temp: [d.temp[0], n] })} step={1} min={-30} max={30} label="Температура до" unit="°C" /></Field>
                </>
              )}
              <Field label="Как грузить"><Choice multi options={Object.entries(LOADING) as [LoadId, string][]} value={d.loading} onChange={(v) => set({ loading: toggle(d.loading, v) })} /></Field>
              <Field label="Особые требования" hint="Необязательно"><Choice multi options={EXTRAS.map((e): [string, string] => [e, e])} value={d.extras} onChange={(v) => set({ extras: toggle(d.extras, v) })} /></Field>
            </>
          )}

          {step === "date" && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {days.map((day, k) => {
                  const on = d.date === day;
                  return (
                    <button key={day} onClick={() => set({ date: day })} aria-pressed={on} className={`flex min-h-[4.25rem] flex-col items-center justify-center rounded-2xl border-2 ${on ? "border-brand bg-brand text-white" : "border-line bg-white"}`}>
                      <span className="text-lg font-bold leading-tight">{k < 2 ? DayLabel(day) : new Date(day + "T12:00").getDate()}</span>
                      <span className={`text-sm ${on ? "text-white/85" : "text-ink-3"}`}>{k < 2 ? weekday(day) : `${weekday(day)}, ${new Date(day + "T12:00").toLocaleDateString("ru-RU", { month: "short" })}`}</span>
                    </button>
                  );
                })}
              </div>
              <Field label="Можно сдвинуть загрузку?">
                <Choice options={[["0", "Нет, точно в этот день"], ["1", "На 1 день"], ["2", "На 2 дня"], ["3", "На 3 дня"]]} value={String(d.flex)} onChange={(v) => set({ flex: Number(v) })} />
                {d.date && <p className="mt-2 text-ink-3">Водители увидят: загрузка {rangeLabel(d.date, d.flex)}</p>}
              </Field>
              <Toggle checked={d.urgent} onChange={(v) => set({ urgent: v })} label="Срочно" hint="Покажем заявку выше остальных" />
            </>
          )}

          {step === "price" && (
            <>
              <div className="grid gap-2" role="radiogroup">
                <Option selected={d.priceMode === "fixed"} onClick={() => set({ priceMode: "fixed", price: d.price || (hint ? round10k((hint.lo + hint.hi) / 2) : 0) })} title="Назначу свою цену" hint="Водитель сможет сразу взять груз или предложить свою цену" />
                <Option selected={d.priceMode === "offers"} onClick={() => set({ priceMode: "offers" })} title="Пусть водители предложат" hint="Сравните предложения и выберите лучшее" />
              </div>
              {d.priceMode === "fixed" && (
                <Field label="Ваша цена" hint={hint ? `Обычно на этом направлении: ${money(hint.lo)} – ${money(hint.hi)}. Это примерная оценка.` : undefined}>
                  <Stepper value={d.price} onChange={(n) => set({ price: n })} step={10000} unit="₸" label="Цена в тенге" big />
                </Field>
              )}
            </>
          )}

          {step === "check" && d.from && d.to && (
            <div className="grid gap-3">
              {[
                ["from", "Маршрут", `${cityFull(d.from)}${d.fromPoint ? `, ${d.fromPoint}` : ""} → ${cityFull(d.to)}${d.toPoint ? `, ${d.toPoint}` : ""}`],
                ...(intl ? [["customs", "Растаможка", `${d.customs ? CUSTOMS[d.customs].name : "—"}${d.post ? ` · ${poi(d.post)?.name}` : ""}`]] : []),
                ["cargo", "Груз", `${d.title}${d.category ? ` · ${CATEGORIES[d.category]}` : ""}${d.packaging ? ` · ${PACKAGING[d.packaging].toLowerCase()}` : ""}${d.stackable === false ? " · не штабелировать" : ""}${d.note ? ` · ${d.note}` : ""}`],
                ["size", "Вес и объём", `${tons(d.weight)}${d.volume ? ` · ${d.volume} м³` : ""}${d.places ? ` · ${d.places} мест` : ""}`],
                ["truck", "Машина", `${d.bodies.length ? d.bodies.map((b) => BODIES[b].name).join(", ") : "Любой кузов"}${d.bodies.includes("reefer") ? ` · ${d.temp[0]}…${d.temp[1]} °C` : ""}${d.extras.length ? ` · ${d.extras.join(", ")}` : ""}`],
                ["date", "Загрузка", `${d.date ? rangeLabel(d.date, d.flex) : "—"}${d.urgent ? " · срочно" : ""}`],
                ["price", "Цена", d.priceMode === "fixed" ? money(d.price) : "Предложат водители"],
              ].map(([k, label, value]) => (
                <div key={k} className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4">
                  <div className="min-w-0 flex-1"><div className="text-ink-3">{label}</div><div className="text-lg font-semibold leading-snug">{value}</div></div>
                  <button onClick={() => goto(k as Step)} className="flex h-10 shrink-0 items-center gap-1 rounded-xl px-2 font-semibold text-brand active:bg-brand-soft"><Pencil size={18} /> Изменить</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-xl px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
          {!valid[step] && why[step] && <p className="mb-2 text-center text-ink-3">{why[step]}</p>}
          {step === "check"
            ? <Button full onClick={publish}>Опубликовать заявку</Button>
            : <Button full disabled={!valid[step]} onClick={next}>Далее</Button>}
        </div>
      </div>

      <PlacePicker open={picker === "from"} title="Город загрузки" onPick={(p) => p.type === "city" && set({ from: p.id })} onClose={() => setPicker(null)} />
      <PlacePicker open={picker === "to"} title="Город доставки" onPick={(p) => p.type === "city" && set({ to: p.id })} onClose={() => setPicker(null)} />
    </main>
  );
}
