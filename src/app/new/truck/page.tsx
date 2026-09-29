"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { BODIES, BODY_IDS, city, isoDay, money, type Body, type CityId } from "@/lib/data";
import { TruckCard } from "@/components/cards";
import { Bar, Stepper } from "@/components/ui";
import { CityMulti, CitySelect, Field, Seg } from "@/components/form";

export default function NewTruck() {
  const router = useRouter();
  const { postTruck } = useStore();
  const [from, setFrom] = useState<CityId>("khorgos");
  const [to, setTo] = useState<CityId[]>(["atyrau", "aktobe"]);
  const [body, setBody] = useState<Body>("tent");
  const [capacity, setCapacity] = useState(20);
  const [volume, setVolume] = useState(86);
  const [day, setDay] = useState(0);
  const [rateType, setRateType] = useState<"km" | "trip">("km");
  const [rate, setRate] = useState(360);
  const [comment, setComment] = useState("");

  const draft = {
    id: "draft", driverId: "me-driver", from, to, body, capacity, volume, date: isoDay(day), rate, rateType, at: Date.now(), mine: true, invites: [],
  };

  return (
    <main>
      <Bar title="Выйти на линию" sub="Так вашу машину увидят клиенты" />
      <div className="mx-auto max-w-xl px-3 pt-4">
        <div className="pointer-events-none"><TruckCard t={draft} /></div>
        <form
          className="mt-6 grid gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            const id = postTruck({ from, to: to.filter((c) => c !== from), body, capacity, volume, date: isoDay(day), rate, rateType, comment: comment || undefined });
            router.replace(`/truck/${id}`);
          }}
        >
          <Field label="Где вы сейчас"><CitySelect value={from} onChange={setFrom} /></Field>
          <Field label="Куда можете ехать">
            <CityMulti value={to} onChange={setTo} exclude={from} />
            <p className="mt-1.5 text-[13px] text-ink-3">{to.length ? `Выбрано: ${to.map(city).join(", ")}` : "Ничего не выбрано — покажем как «любое направление»"}</p>
          </Field>
          <Field label="Кузов"><Seg value={body} onChange={setBody} options={BODY_IDS.map((b) => [b, BODIES[b].name])} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Грузоподъёмность, т">
              <input inputMode="numeric" value={capacity || ""} onChange={(e) => setCapacity(Number(e.target.value.replace(/\D/g, "")) || 0)} className="h-12 w-full rounded-[4px] border-2 border-line bg-white px-3 font-display text-[22px] font-bold outline-none focus:border-ink" />
            </Field>
            <Field label="Объём, м³">
              <input inputMode="numeric" value={volume || ""} onChange={(e) => setVolume(Number(e.target.value.replace(/\D/g, "")) || 0)} className="h-12 w-full rounded-[4px] border-2 border-line bg-white px-3 font-display text-[22px] font-bold outline-none focus:border-ink" />
            </Field>
          </div>
          <Field label="Свободен">
            <Seg value={String(day)} onChange={(v) => setDay(Number(v))} options={[["0", "Сегодня"], ["1", "Завтра"], ["2", "Послезавтра"]]} />
          </Field>
          <Field label="Ставка">
            <Seg value={rateType} onChange={(v) => { setRateType(v); setRate(v === "km" ? 360 : 900000); }} options={[["km", "За километр"], ["trip", "За рейс"]]} />
            <div className="mt-2.5">
              <Stepper value={rate} onChange={setRate} step={rateType === "km" ? 10 : 10000} min={rateType === "km" ? 50 : 10000} label="Ставка" />
            </div>
            <p className="mt-1.5 text-[13px] text-ink-3">{rateType === "km" ? `${rate} ₸ за километр — клиенты увидят ориентир и предложат груз` : `${money(rate)} за рейс`}</p>
          </Field>
          <Field label="Комментарий">
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Например: только что прошёл Нур Жолы, есть TIR" className="w-full rounded-[4px] border-2 border-line bg-white px-3 py-2.5 text-[16px] outline-none placeholder:text-ink-3 focus:border-ink" />
          </Field>
          <div className="sticky bottom-0 -mx-3 border-t border-line bg-yard/95 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
            <button className="w-full rounded-[5px] border-2 border-ink bg-signal py-4 text-[18px] font-extrabold active:bg-signal-deep">Выйти на линию</button>
            <p className="mt-1.5 text-center text-[12.5px] text-ink-3">Машина появится у клиентов сразу</p>
          </div>
        </form>
      </div>
    </main>
  );
}
