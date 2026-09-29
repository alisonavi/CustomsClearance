"use client";

import { FileCheck2, RotateCcw } from "lucide-react";
import { useStore } from "@/lib/store";
import { ME_CLIENT, ME_DRIVER, plural } from "@/lib/data";
import { Avatar, Bar, Plate, Rating, RoleSwitch, Section } from "@/components/ui";

export default function Profile() {
  const { state, reset, toast } = useStore();
  const isDriver = state.role === "driver";
  const docs = isDriver
    ? ["Водительское удостоверение, кат. CE", "Техпаспорт тягача и прицепа", "TIR-карнет", "Страховка CMR"]
    : ["БИН и свидетельство ТОО", "Договор-оферта с перевозчиком", "Доверенность на получение груза"];
  return (
    <main>
      <Bar title="Профиль" back={false} right={<RoleSwitch />} />
      <div className="mx-auto max-w-xl">
        <div className="mx-3 mt-3 rounded-[3px] border border-line bg-white p-4">
          <div className="flex items-center gap-3">
            <Avatar name={isDriver ? ME_DRIVER.name : ME_CLIENT.company} kind={isDriver ? "driver" : "client"} />
            <div className="min-w-0">
              <div className="truncate text-[18px] font-extrabold">{isDriver ? ME_DRIVER.name : ME_CLIENT.name}</div>
              <div className="truncate text-[14px] text-ink-3">{isDriver ? ME_DRIVER.truck : ME_CLIENT.company}</div>
              {isDriver ? (
                <Rating value={ME_DRIVER.rating} sub={`${ME_DRIVER.trips} рейсов`} />
              ) : (
                <Rating value={ME_CLIENT.rating} sub={`${ME_CLIENT.deals} ${plural(ME_CLIENT.deals, ["сделка", "сделки", "сделок"])}`} />
              )}
            </div>
          </div>
          {isDriver && <div className="mt-3"><Plate plate={ME_DRIVER.plate} big /></div>}
        </div>

        <Section title="Документы">
          <ul className="overflow-hidden rounded-[3px] border border-line bg-white">
            {docs.map((d) => (
              <li key={d} className="flex items-center gap-3 border-b border-line px-4 py-3 text-[15px] last:border-0">
                <FileCheck2 size={20} className="shrink-0 text-seal" aria-hidden />
                <span className="flex-1">{d}</span>
                <button onClick={() => toast({ title: "Демо-режим", body: "Загрузка документов появится вместе с бэкендом." })} className="text-[13.5px] font-bold text-customs">Обновить</button>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Демо">
          <div className="rounded-[3px] border border-line bg-white p-4 text-[14.5px] leading-relaxed text-ink-2">
            Все люди, компании, машины, цены и рейтинги здесь — выдуманные демо-данные. Данные хранятся только в этом браузере.
            Переключайте «Клиент / Водитель», чтобы увидеть обе стороны сделки.
            <button onClick={() => { reset(); toast({ title: "Демо сброшено", body: "Вернули исходные грузы, машины и чаты." }); }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-[4px] border-2 border-ink py-3 text-[15px] font-extrabold text-ink active:bg-yard">
              <RotateCcw size={18} /> Сбросить демо-данные
            </button>
          </div>
        </Section>
      </div>
    </main>
  );
}
