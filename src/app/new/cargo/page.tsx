"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowDownUp } from "lucide-react";
import { useStore } from "@/lib/store";
import { BODIES, BODY_IDS, CITY_IDS, CUSTOMS, city, isoDay, money, perKm, suggestPrice, type Body, type CityId, type Customs } from "@/lib/data";
import { CargoCard } from "@/components/cards";
import { Bar, Stepper } from "@/components/ui";
import { Field, Seg, CitySelect } from "@/components/form";

export default function NewCargo() {
  const router = useRouter();
  const { postCargo } = useStore();
  const [from, setFrom] = useState<CityId>("khorgos");
  const [to, setTo] = useState<CityId>("atyrau");
  const [what, setWhat] = useState("");
  const [body, setBody] = useState<Body>("tent");
  const [weight, setWeight] = useState(15);
  const [volume, setVolume] = useState(82);
  const [day, setDay] = useState(0);
  const [customs, setCustoms] = useState<Customs>("cleared");
  const [price, setPrice] = useState(() => suggestPrice("khorgos", "atyrau", "tent", 15));
  const [comment, setComment] = useState("");
  const est = suggestPrice(from, to, body, weight);
  const ok = from !== to && weight > 0 && price > 0;

  const draft = {
    id: "draft", from, to, what: what || "Что везём — напишите ниже", body, weight, volume, price, date: isoDay(day), customs,
    clientId: "me-client", at: Date.now(), mine: true, offers: [], status: "open" as const,
  };

  return (
    <main>
      <Bar title="Новый груз" sub="Так его увидят водители" />
      <div className="mx-auto max-w-xl px-3 pt-4">
        <div className="pointer-events-none"><CargoCard c={draft} /></div>

        <form
          className="mt-6 grid gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!ok) return;
            const id = postCargo({ from, to, what: what || "Груз", body, weight, volume, price, date: isoDay(day), customs, comment: comment || undefined });
            router.replace(`/cargo/${id}`);
          }}
        >
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <Field label="Откуда"><CitySelect value={from} onChange={setFrom} /></Field>
            <button type="button" aria-label="Поменять местами" onClick={() => { setFrom(to); setTo(from); }} className="mb-1 grid size-11 place-items-center rounded-[4px] border-2 border-line bg-white active:border-ink">
              <ArrowDownUp size={18} className="rotate-90" />
            </button>
            <Field label="Куда"><CitySelect value={to} onChange={setTo} /></Field>
          </div>
          {from === to && <p className="-mt-3 text-[13.5px] font-bold text-oxide">Города погрузки и выгрузки совпадают</p>}

          <Field label="Что везём">
            <input value={what} onChange={(e) => setWhat(e.target.value)} placeholder="Например: плитка на паллетах" className="h-12 w-full rounded-[4px] border-2 border-line bg-white px-3 text-[16px] outline-none placeholder:text-ink-3 focus:border-ink" />
          </Field>

          <Field label="Кузов">
            <Seg value={body} onChange={setBody} options={BODY_IDS.map((b) => [b, BODIES[b].name])} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Вес, т"><NumInput value={weight} onChange={setWeight} /></Field>
            <Field label="Объём, м³"><NumInput value={volume} onChange={setVolume} /></Field>
          </div>

          <Field label="Погрузка">
            <Seg value={String(day)} onChange={(v) => setDay(Number(v))} options={[["0", "Сегодня"], ["1", "Завтра"], ["2", "Послезавтра"]]} />
          </Field>

          <Field label="Таможня">
            <Seg value={customs} onChange={setCustoms} options={(Object.keys(CUSTOMS) as Customs[]).map((k) => [k, CUSTOMS[k].name])} />
            <p className="mt-1.5 text-[13px] text-ink-3">{CUSTOMS[customs].hint}</p>
          </Field>

          <Field label="Ваша цена">
            <Stepper value={price} onChange={setPrice} label="Цена в тенге" />
            <div className="mt-2 flex items-center justify-between gap-2 text-[13.5px]">
              <span className="text-ink-3">≈ {from !== to ? perKm(price, from, to) : 0} ₸/км</span>
              <button type="button" onClick={() => setPrice(est)} className="rounded-[3px] bg-customs-soft px-2 py-1 font-bold text-customs">Оценка рынка {money(est)}</button>
            </div>
          </Field>

          <Field label="Комментарий для водителя">
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Адрес склада, время погрузки, документы…" className="w-full rounded-[4px] border-2 border-line bg-white px-3 py-2.5 text-[16px] outline-none placeholder:text-ink-3 focus:border-ink" />
          </Field>

          <div className="sticky bottom-0 -mx-3 border-t border-line bg-yard/95 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
            <button disabled={!ok} className="w-full rounded-[5px] border-2 border-ink bg-signal py-4 text-[18px] font-extrabold active:bg-signal-deep disabled:opacity-50">
              Опубликовать за {money(price)}
            </button>
            <p className="mt-1.5 text-center text-[12.5px] text-ink-3">{city(from)} → {city(to)} · водители ответят в течение минут</p>
          </div>
        </form>
      </div>
    </main>
  );
}

function NumInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <input
      inputMode="decimal"
      value={value || ""}
      onChange={(e) => onChange(Number(e.target.value.replace(",", ".").replace(/[^\d.]/g, "")) || 0)}
      className="h-12 w-full rounded-[4px] border-2 border-line bg-white px-3 font-display text-[22px] font-bold tabular-nums outline-none focus:border-ink"
    />
  );
}
