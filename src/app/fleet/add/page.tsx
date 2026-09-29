"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Camera, Check, ChevronLeft, UserPlus } from "lucide-react";
import { useStore } from "@/lib/store";
import { BODIES, BODY_IDS, KINDS, KIND_IDS, LOADING, PERMITS, type BodyId, type KindId, type LoadId } from "@/lib/catalog";
import { isoDay } from "@/lib/format";
import { tons } from "@/lib/match";
import { ME_CARRIER } from "@/lib/types";
import { Button, Choice, Field, Option, Plate, Stepper, Toggle, TruckArt, inputCls } from "@/components/ui";

type Step = "type" | "id" | "size" | "photos" | "intl" | "driver" | "check";
const STEPS: Step[] = ["type", "id", "size", "photos", "intl", "driver", "check"];
const MAKES = ["MAN", "Volvo", "Scania", "DAF", "Mercedes", "Shacman", "Howo", "Sitrak", "FAW", "КамАЗ", "ГАЗ"];
const DEFAULTS: Record<KindId, { capacity: number; volume: number; dims: [number, number, number] }> = {
  fura: { capacity: 20, volume: 86, dims: [13.6, 2.45, 2.7] },
  truck: { capacity: 10, volume: 45, dims: [7.2, 2.45, 2.5] },
  small: { capacity: 1.5, volume: 12, dims: [3.1, 2.0, 1.9] },
};
const PHOTOS = ["Спереди", "Сбоку", "Кузов внутри"];

/** Spec §3, §11: add a truck, step by step. */
export default function AddTruck() {
  const router = useRouter();
  const { s, addTruck, addDriver, toast } = useStore();
  const drivers = s.drivers.filter((d) => d.carrierId === ME_CARRIER);
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const [kind, setKind] = useState<KindId>("fura");
  const [body, setBody] = useState<BodyId>("tent");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(2020);
  const [plate, setPlate] = useState("");
  const [capacity, setCapacity] = useState(20);
  const [volume, setVolume] = useState(86);
  const [dims, setDims] = useState<[number, number, number]>([13.6, 2.45, 2.7]);
  const [loading, setLoading] = useState<LoadId[]>(["back"]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [china, setChina] = useState(false);
  const [permits, setPermits] = useState<string[]>(["Страховка CMR"]);
  const [last, setLast] = useState("none");
  const [driverId, setDriverId] = useState(drivers[0]?.id ?? "");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const plateOk = /^\d{3}\s?[A-Za-z]{2,3}\s?\d{2}$/.test(plate.trim());
  const normPlate = () => { const m = plate.trim().toUpperCase().match(/^(\d{3})\s?([A-Z]{2,3})\s?(\d{2})$/); return m ? `${m[1]} ${m[2]} ${m[3]}` : plate.trim().toUpperCase(); };
  const valid: Record<Step, boolean> = {
    type: true, id: !!make && model.trim().length > 0 && plateOk, size: capacity > 0, photos: true, intl: true,
    driver: driverId === "new" ? newName.trim().length > 2 && newPhone.replace(/\D/g, "").length >= 10 : !!driverId, check: true,
  };
  const why: Partial<Record<Step, string>> = { id: !make ? "Выберите марку" : !model.trim() ? "Напишите модель" : "Номер в формате 123 ABC 02", size: "Укажите грузоподъёмность", driver: "Укажите имя и телефон водителя" };
  const pickKind = (k: KindId) => { setKind(k); setCapacity(DEFAULTS[k].capacity); setVolume(DEFAULTS[k].volume); setDims(DEFAULTS[k].dims); };

  const save = () => {
    const did = driverId === "new" ? addDriver(newName.trim(), `+7 ${newPhone.replace(/\D/g, "").slice(-10)}`) : driverId;
    const lastTrip = last === "none" ? undefined : isoDay(-Number(last));
    const id = addTruck({
      driverId: did, kind, body, make, model: model.trim(), year, plate: normPlate(), capacity, volume,
      dims, loading, extras: [], photos: photos.length, intl: { chinaEntry: china, lastTrip, permits: china ? permits : permits.filter((p) => p !== PERMITS[0]) },
      at: "almaty", freeFrom: isoDay(0), goingTo: [],
    });
    toast({ title: "Машина добавлена", body: "Проверка документов займёт немного времени. Отметьте, где она свободна." });
    router.replace(`/fleet/${id}`);
  };

  const title: Record<Step, string> = { type: "Какая у вас машина?", id: "Марка и номер", size: "Сколько берёт", photos: "Фотографии", intl: "Рейсы в Китай", driver: "Кто водитель", check: "Проверьте данные" };

  return (
    <main className="flex min-h-dvh flex-col bg-white">
      <div className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-xl px-2 pt-[max(6px,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between">
            <button onClick={() => (i === 0 ? router.back() : setI(i - 1))} className="flex h-12 items-center gap-0.5 rounded-xl pl-1 pr-3 text-base font-semibold text-brand active:bg-brand-soft"><ChevronLeft size={26} /> Назад</button>
            <span className="pr-3 font-semibold text-ink-3">Шаг {i + 1} из {STEPS.length}</span>
          </div>
          <div className="mx-2 mb-2 mt-1 h-1.5 overflow-hidden rounded-full bg-page"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${((i + 1) / STEPS.length) * 100}%` }} /></div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-xl flex-1 px-4 pb-8 pt-6">
        <h1 className="mb-5 text-[1.9rem] font-bold leading-tight">{title[step]}</h1>
        <div className="grid gap-6">
          {step === "type" && (
            <>
              <div className="grid gap-2" role="radiogroup">{KIND_IDS.map((k) => <Option key={k} selected={kind === k} onClick={() => pickKind(k)} title={KINDS[k].name} hint={KINDS[k].hint} icon={<span className="w-10"><TruckArt body="tent" kind={k} /></span>} />)}</div>
              <Field label="Кузов">
                <div className="grid grid-cols-2 gap-2">
                  {BODY_IDS.map((b) => (
                    <button key={b} onClick={() => setBody(b)} aria-pressed={body === b} className={`flex flex-col items-center rounded-2xl border-2 p-2 ${body === b ? "border-brand bg-brand-soft" : "border-line bg-white"}`}>
                      <TruckArt body={b} kind={kind} className="h-14 w-full" />
                      <span className="font-semibold">{BODIES[b].name}</span>
                    </button>
                  ))}
                </div>
              </Field>
            </>
          )}
          {step === "id" && (
            <>
              <Field label="Марка"><Choice options={[...MAKES.map((m): [string, string] => [m, m]), ["Другая", "Другая"]]} value={make} onChange={setMake} /></Field>
              <Field label="Модель"><input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Например: TGX 18.440" className={inputCls} /></Field>
              <Field label="Год выпуска"><Stepper value={year} onChange={(n) => setYear(Math.round(n))} min={1990} max={2026} label="Год выпуска" /></Field>
              <Field label="Госномер" hint="Как на номере: 3 цифры, буквы, код региона">
                <input value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="123 ABC 02" autoCapitalize="characters" className={`${inputCls} tnum uppercase`} />
                {plateOk && <div className="mt-3"><Plate plate={normPlate()} /></div>}
              </Field>
            </>
          )}
          {step === "size" && (
            <>
              <Field label="Грузоподъёмность"><Stepper value={capacity} onChange={setCapacity} step={0.5} max={60} unit="т" label="Грузоподъёмность" /></Field>
              <Field label="Объём кузова"><Stepper value={volume} onChange={setVolume} step={1} max={150} unit="м³" label="Объём кузова" /></Field>
              <Field label="Размеры кузова, м" hint="Длина × ширина × высота">
                <div className="grid grid-cols-3 gap-2">
                  {(["Длина", "Ширина", "Высота"] as const).map((l, k) => (
                    <label key={l} className="block">
                      <span className="mb-1 block text-ink-3">{l}</span>
                      <input inputMode="decimal" value={String(dims[k]).replace(".", ",")} onChange={(e) => { const n = Number(e.target.value.replace(",", ".")); setDims(dims.map((x, j) => (j === k && !isNaN(n) ? n : x)) as [number, number, number]); }} className={`${inputCls} tnum px-3 text-center`} />
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Как грузить"><Choice multi options={Object.entries(LOADING) as [LoadId, string][]} value={loading} onChange={(v) => setLoading(loading.includes(v) ? loading.filter((x) => x !== v) : [...loading, v])} /></Field>
            </>
          )}
          {step === "photos" && (
            <>
              <p className="-mt-2 text-lg text-ink-2">Клиенты чаще выбирают машины с фото. Сделайте три снимка при дневном свете.</p>
              <div className="grid grid-cols-3 gap-2">
                {PHOTOS.map((p) => {
                  const on = photos.includes(p);
                  return (
                    <button key={p} onClick={() => setPhotos(on ? photos.filter((x) => x !== p) : [...photos, p])} aria-pressed={on} className={`flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-2 ${on ? "border-brand bg-brand-soft" : "border-dashed border-line-2 bg-white"}`}>
                      {on ? <><TruckArt body={body} kind={kind} className="w-full" /><span className="inline-flex items-center gap-1 font-semibold text-brand-ink"><Check size={16} strokeWidth={3} /> {p}</span></> : <><Camera size={30} className="text-brand" /><span className="font-semibold">{p}</span></>}
                    </button>
                  );
                })}
              </div>
              <p className="rounded-xl bg-brand-soft px-4 py-3 text-brand-ink">Демо-версия: фото не загружаются, вместо них — иллюстрация.</p>
            </>
          )}
          {step === "intl" && (
            <>
              <Toggle checked={china} onChange={setChina} label="Машина может въезжать в Китай" hint="Если нет — будем показывать только грузы по Казахстану и до границы" />
              <Field label="Документы и разрешения"><Choice multi options={PERMITS.map((p): [string, string] => [p, p])} value={permits} onChange={(v) => setPermits(permits.includes(v) ? permits.filter((x) => x !== v) : [...permits, v])} /></Field>
              {china && (
                <Field label="Когда был последний рейс за границу" hint="Нужно, чтобы учитывать частоту пересечения границы">
                  <Choice options={[["none", "Ещё не был"], ["45", "Больше месяца назад"], ["21", "2–4 недели назад"], ["7", "Меньше 2 недель"]]} value={last} onChange={setLast} />
                </Field>
              )}
            </>
          )}
          {step === "driver" && (
            <div className="grid gap-2" role="radiogroup">
              {drivers.map((d) => <Option key={d.id} selected={driverId === d.id} onClick={() => setDriverId(d.id)} title={d.id === "me-d1" ? `${d.name} (я)` : d.name} hint={d.phone} />)}
              <Option selected={driverId === "new"} onClick={() => setDriverId("new")} icon={<UserPlus size={24} />} title="Новый водитель" hint="Добавить имя и телефон" />
              {driverId === "new" && (
                <div className="mt-3 grid gap-3">
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Имя и фамилия" aria-label="Имя водителя" className={inputCls} />
                  <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+7 700 000 00 00" inputMode="tel" aria-label="Телефон водителя" className={`${inputCls} tnum`} />
                </div>
              )}
            </div>
          )}
          {step === "check" && (
            <div className="grid gap-3">
              <div className="rounded-2xl bg-brand-soft/60 p-4"><TruckArt body={body} kind={kind} className="mx-auto max-w-xs" /></div>
              {[
                ["Машина", `${KINDS[kind].name}, ${BODIES[body].name.toLowerCase()}`],
                ["Марка", `${make} ${model}, ${year}`],
                ["Госномер", normPlate()],
                ["Берёт", `${tons(capacity)} · ${volume} м³ · ${dims.map((x) => String(x).replace(".", ",")).join(" × ")} м`],
                ["Фото", photos.length ? `${photos.length} из 3` : "Добавите позже"],
                ["В Китай", china ? "Может въезжать" : "Только Казахстан"],
                ["Водитель", driverId === "new" ? newName : drivers.find((d) => d.id === driverId)?.name ?? "—"],
              ].map(([k, v]) => <div key={k} className="flex justify-between gap-4 border-b border-line py-2.5 text-lg"><span className="text-ink-3">{k}</span><span className="text-right font-semibold">{v}</span></div>)}
              <p className="text-ink-3">После добавления проверим документы. Пока проверка идёт, машину уже можно разместить.</p>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-xl px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
          {!valid[step] && why[step] && <p className="mb-2 text-center text-ink-3">{why[step]}</p>}
          {step === "check" ? <Button full onClick={save}>Добавить машину</Button> : <Button full disabled={!valid[step]} onClick={() => setI(i + 1)}>{step === "photos" && !photos.length ? "Пропустить" : "Далее"}</Button>}
        </div>
      </div>
    </main>
  );
}
