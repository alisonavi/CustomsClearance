"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Check, MessageCircle, Phone } from "lucide-react";
import { useStore } from "@/lib/store";
import { BODIES, ago, city, client, dayLabel, driver, money, plural } from "@/lib/data";
import { Avatar, Bar, DataPlate, Empty, Plate, Rating, Route, Seal, Tag } from "@/components/ui";

export default function TruckPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { state, inviteTruck, answerInvite, openChat, removeTruck, toast } = useStore();
  const t = state.trucks.find((x) => x.id === id);
  const [picking, setPicking] = useState(false);

  if (!t) return (<><Bar title="Машина" /><div className="mx-auto max-w-xl p-4"><Empty title="Машина уже не на линии" body="Водитель снял объявление или уже взял груз." href="/" cta="В ленту" /></div></>);

  const d = driver(t.driverId);
  const myOpen = state.cargo.filter((c) => c.mine && c.status === "open");
  const sentCargo = t.sent ? state.cargo.find((c) => c.id === t.sent!.cargoId) : undefined;
  const chat = () => router.push(`/chats/${openChat("client", d.id, sentCargo ? { from: sentCargo.from, to: sentCargo.to, price: sentCargo.price } : undefined)}`);

  return (
    <main>
      <Bar title={t.mine ? "Ваша машина на линии" : d.name} sub={d.truck} />
      <section className="corrugated text-white">
        <div className="mx-auto max-w-xl px-4 pb-6 pt-2">
          <Plate plate={d.plate} big />
          <div className="mt-4 text-[12px] font-bold uppercase tracking-[0.08em] text-oxide-soft">Сейчас в {city(t.from)} · свободен {dayLabel(t.date).toLowerCase()}</div>
          <div className="mt-1 font-display text-[40px] font-extrabold uppercase leading-[0.92] sm:text-[46px]">{t.to.length ? t.to.map(city).join(" · ") : "Любое направление"}</div>
          <div className="mt-5 flex items-end justify-between gap-3">
            <div>
              <div className="font-display text-[40px] font-extrabold leading-none tabular-nums">{t.rateType === "km" ? `${t.rate} ₸/км` : money(t.rate)}</div>
              <div className="mt-1 text-[13px] font-semibold text-oxide-soft">{t.rateType === "km" ? "ставка за километр, торг уместен" : "за рейс"} · {ago(t.at)}</div>
            </div>
            {t.sent?.status === "accepted" && sentCargo?.seal && <Seal code={sentCargo.seal} animate small />}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-xl px-3">
        <div className="-mt-3 rounded-[3px] border border-line bg-white p-4 shadow-[0_6px_16px_-10px_rgba(0,0,0,0.3)]">
          <DataPlate items={[["Кузов", BODIES[t.body].name], ["Грузоподъёмн.", `${t.capacity} т`], ["Объём", t.volume ? `${t.volume} м³` : "—"]]} />
          <div className="mt-3 flex flex-wrap gap-1.5">{d.docs.map((x) => <Tag key={x} tone="dark">{x}</Tag>)}<Tag>{dayLabel(t.date)}</Tag></div>
          {t.comment && <p className="mt-3 border-t border-dashed border-line pt-3 text-[15px] leading-relaxed text-ink-2">{t.comment}</p>}
        </div>

        {!t.mine && (
          <div className="mt-3 flex items-center gap-3 rounded-[3px] border border-line bg-white p-3.5">
            <Avatar name={d.name} kind="driver" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-bold">{d.name}</div>
              <Rating value={d.rating} sub={`${d.trips} рейсов · стаж ${d.years} ${plural(d.years, ["год", "года", "лет"])}`} />
            </div>
          </div>
        )}

        {/* ------- client: offer my cargo to this truck ------- */}
        {!t.mine && state.role === "client" && (
          <section className="mt-5">
            {t.sent?.status === "pending" && sentCargo ? (
              <div className="relative overflow-hidden rounded-[3px] border-2 border-ink bg-white p-4">
                <div className="sweep absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-signal/40 to-transparent" aria-hidden />
                <div className="relative">
                  <div className="text-[13px] font-bold uppercase tracking-[0.08em] text-ink-3">Предложение отправлено водителю</div>
                  <div className="mt-1"><Route from={sentCargo.from} to={sentCargo.to} size="sm" /></div>
                  <p className="mt-1 text-[14px] text-ink-2">{sentCargo.weight} т · {money(sentCargo.price)}. Ждём ответа.</p>
                </div>
              </div>
            ) : t.sent?.status === "accepted" && sentCargo ? (
              <div className="rounded-[3px] border-2 border-seal bg-seal-soft p-4">
                <div className="flex items-center gap-2 text-[15px] font-extrabold text-seal"><Check size={18} strokeWidth={3} /> {d.name.split(" ")[0]} взял ваш груз</div>
                <p className="mt-1 text-[14px] text-ink-2">{city(sentCargo.from)} → {city(sentCargo.to)} · {money(sentCargo.price)}</p>
              </div>
            ) : picking ? (
              <div className="rounded-[3px] border border-line bg-white p-4">
                <div className="text-[16px] font-extrabold">Какой груз предложить?</div>
                <div className="mt-3 grid gap-2">
                  {myOpen.map((c) => (
                    <button key={c.id} onClick={() => { inviteTruck(t.id, c.id); setPicking(false); }} className="rounded-[4px] border-2 border-line p-3 text-left active:border-ink">
                      <Route from={c.from} to={c.to} size="sm" />
                      <div className="mt-1 text-[13.5px] text-ink-2">{c.what} · {c.weight} т · <b>{money(c.price)}</b></div>
                    </button>
                  ))}
                  {!myOpen.length && <p className="text-[14px] text-ink-3">У вас нет открытых грузов.</p>}
                  <Link href="/new/cargo" className="rounded-[4px] border-2 border-dashed border-ink/40 p-3 text-center text-[15px] font-bold">+ Новый груз</Link>
                </div>
              </div>
            ) : null}

            <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-2">
              {!t.sent && !picking && (
                <button onClick={() => setPicking(true)} className="rounded-[5px] border-2 border-ink bg-signal py-3.5 text-[17px] font-extrabold active:bg-signal-deep">Предложить груз</button>
              )}
              {(t.sent || picking) && <span />}
              <button onClick={chat} aria-label="Написать водителю" className="grid size-[54px] place-items-center rounded-[5px] border-2 border-ink bg-white active:bg-yard"><MessageCircle size={22} /></button>
              <button onClick={() => toast({ title: "Демо-режим", body: "Звонки появятся вместе с бэкендом." })} aria-label="Позвонить" className="grid size-[54px] place-items-center rounded-[5px] border-2 border-ink bg-white active:bg-yard"><Phone size={22} /></button>
            </div>
          </section>
        )}

        {/* ------- driver: my post, incoming offers ------- */}
        {t.mine && (
          <section className="mt-6">
            <h2 className="mb-3 px-1 text-[20px] font-extrabold">Клиенты предлагают груз</h2>
            <div className="grid gap-3">
              {t.invites.length ? t.invites.map((i) => {
                const k = client(i.clientId);
                return (
                  <article key={i.id} className="toast-in rounded-[3px] border border-line bg-white p-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={k.company} kind="client" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-bold">{k.company}</div>
                        <Rating value={k.rating} sub={ago(i.at)} />
                      </div>
                    </div>
                    <div className="mt-3"><Route from={i.from} to={i.to} size="sm" /></div>
                    <div className="mt-1 text-[14px] text-ink-2">{i.what} · {i.weight} т</div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="font-display text-[28px] font-extrabold leading-none">{money(i.price)}</div>
                      {i.status === "new" ? (
                        <div className="flex gap-2">
                          <button onClick={() => answerInvite(t.id, i.id, false)} className="rounded-[4px] border-2 border-line px-3 py-2.5 text-[14px] font-bold active:border-ink">Отказать</button>
                          <button onClick={() => { const cid = answerInvite(t.id, i.id, true); if (cid) router.push(`/chats/${cid}`); }} className="rounded-[4px] border-2 border-ink bg-signal px-4 py-2.5 text-[15px] font-extrabold active:bg-signal-deep">Беру</button>
                        </div>
                      ) : (
                        <Tag tone={i.status === "accepted" ? "seal" : "plain"}>{i.status === "accepted" ? "Опломбировано" : "Отказано"}</Tag>
                      )}
                    </div>
                  </article>
                );
              }) : (
                <div className="relative overflow-hidden rounded-[3px] border border-line bg-white p-5">
                  <div className="sweep absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-signal/30 to-transparent" aria-hidden />
                  <p className="relative text-[15px] font-semibold text-ink-2">Ваша машина видна клиентам. Как только кто-то предложит груз — он появится здесь.</p>
                </div>
              )}
            </div>
            <button onClick={() => { removeTruck(t.id); router.push("/"); }} className="mt-5 w-full rounded-[5px] border-2 border-line bg-white py-3 text-[15px] font-bold text-ink-2 active:border-ink">
              Снять машину с линии
            </button>
          </section>
        )}
        <div className="h-6" />
      </div>
    </main>
  );
}
