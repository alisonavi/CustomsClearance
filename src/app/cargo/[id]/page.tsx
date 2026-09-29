"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Check, MessageCircle, Phone } from "lucide-react";
import { useStore } from "@/lib/store";
import { BODIES, CUSTOMS, ago, client, dayLabel, driver, km, money, num, perKm, plural, suggestPrice } from "@/lib/data";
import { Avatar, Bar, Castings, CustomsTag, DataPlate, Empty, Plate, Rating, Route, Seal, Stepper, Tag } from "@/components/ui";

export default function CargoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { state, acceptOffer, placeBid, openChat, toast } = useStore();
  const c = state.cargo.find((x) => x.id === id);
  const [counter, setCounter] = useState<number | null>(null);
  const [justSealed, setJustSealed] = useState(false);

  if (!c) return (<><Bar title="Груз" /><div className="mx-auto max-w-xl p-4"><Empty title="Груз не найден" body="Возможно, его уже сняли с биржи." href="/" cta="В ленту" /></div></>);

  const k = client(c.clientId);
  const dist = km(c.from, c.to);
  const est = suggestPrice(c.from, c.to, c.body, c.weight);
  const iAmDriver = state.role === "driver" && !c.mine;
  const dealDriver = c.dealDriverId ? driver(c.dealDriverId) : null;
  const sealedForMe = c.status === "sealed" && (c.mine || c.dealDriverId === "me-driver");

  const chatWithDriver = (driverId: string) => router.push(`/chats/${openChat("client", driverId, { from: c.from, to: c.to, price: c.price })}`);
  const chatWithClient = () => router.push(`/chats/${openChat("driver", c.clientId, { from: c.from, to: c.to, price: c.bid?.price ?? c.price })}`);

  return (
    <main>
      <Bar title={c.mine ? "Ваш груз" : k.company} sub={`${c.what}`} />
      {/* door panel */}
      <section className="corrugated relative text-white">
        <div className="mx-auto max-w-xl px-4 pb-6 pt-2">
          <Route from={c.from} to={c.to} size="lg" light />
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] font-semibold text-oxide-soft">
            <span>{num(dist)} км</span><span aria-hidden>·</span><span>погрузка {dayLabel(c.date).toLowerCase()}</span><span aria-hidden>·</span><span>{ago(c.at)}</span>
          </div>
          <div className="mt-5 flex items-end justify-between gap-3">
            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-oxide-soft">{c.status === "sealed" ? "Цена сделки" : "Цена клиента"}</div>
              <div className="font-display text-[44px] font-extrabold leading-none tabular-nums">{money(c.dealPrice ?? c.price)}</div>
              <div className="mt-1 text-[13px] font-semibold text-oxide-soft">≈ {perKm(c.dealPrice ?? c.price, c.from, c.to)} ₸/км · оценка рынка {money(est)}</div>
            </div>
            {c.status === "sealed" && c.seal && <Seal code={c.seal} animate={justSealed} small />}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-xl px-3">
        <div className="relative -mt-3 rounded-[3px] border border-line bg-white p-4 shadow-[0_6px_16px_-10px_rgba(0,0,0,0.3)]">
          <Castings />
          <p className="text-[17px] font-bold leading-snug">{c.what}</p>
          <div className="mt-3">
            <DataPlate items={[["Вес", `${c.weight} т`], ["Объём", c.volume ? `${c.volume} м³` : "—"], ["Кузов", BODIES[c.body].name]]} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5"><CustomsTag c={c.customs} /><Tag>{dayLabel(c.date)}</Tag></div>
          <p className="mt-2 text-[13.5px] text-ink-3">{CUSTOMS[c.customs].hint}</p>
          {c.comment && <p className="mt-3 border-t border-dashed border-line pt-3 text-[15px] leading-relaxed text-ink-2">{c.comment}</p>}
        </div>

        {!c.mine && (
          <div className="mt-3 flex items-center gap-3 rounded-[3px] border border-line bg-white p-3.5">
            <Avatar name={k.company} kind="client" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-bold">{k.company}</div>
              <div className="text-[13px] text-ink-3">{k.name}</div>
              <Rating value={k.rating} sub={`${k.deals} ${plural(k.deals, ["сделка", "сделки", "сделок"])}`} />
            </div>
            {state.role === "driver" && (
              <button onClick={chatWithClient} aria-label="Написать клиенту" className="grid size-11 place-items-center rounded-[4px] border-2 border-ink active:bg-yard"><MessageCircle size={20} /></button>
            )}
          </div>
        )}

        {/* ------- sealed deal ------- */}
        {sealedForMe && dealDriver && (
          <div className="mt-3 rounded-[3px] border-2 border-seal bg-seal-soft p-4">
            <div className="flex items-center gap-2 text-[15px] font-extrabold text-seal"><Check size={18} strokeWidth={3} /> Сделка опломбирована · {c.seal}</div>
            {c.mine ? (
              <div className="mt-3 flex items-center gap-3">
                <Avatar name={dealDriver.name} kind="driver" />
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-bold">{dealDriver.name}</div>
                  <div className="mt-1"><Plate plate={dealDriver.plate} /></div>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-[14px] text-ink-2">Клиент ждёт вас на погрузке. Детали — в чате.</p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => (c.mine ? chatWithDriver(dealDriver.id) : chatWithClient())} className="flex items-center justify-center gap-2 rounded-[4px] bg-ink py-3 text-[15px] font-extrabold text-white active:bg-ink-2">
                <MessageCircle size={18} /> Чат
              </button>
              <button onClick={() => toast({ title: "Демо-режим", body: "Звонки появятся вместе с бэкендом." })} className="flex items-center justify-center gap-2 rounded-[4px] border-2 border-ink bg-white py-3 text-[15px] font-extrabold active:bg-yard">
                <Phone size={18} /> Позвонить
              </button>
            </div>
          </div>
        )}

        {/* ------- client: offers from drivers ------- */}
        {c.mine && c.status === "open" && (
          <section className="mt-6">
            <h2 className="mb-3 px-1 text-[20px] font-extrabold">
              {c.offers.length ? `${c.offers.length} ${plural(c.offers.length, ["предложение", "предложения", "предложений"])} от водителей` : "Ищем водителей"}
            </h2>
            {!c.offers.length && (
              <div className="relative overflow-hidden rounded-[3px] border border-line bg-white p-5">
                <div className="sweep absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-signal/30 to-transparent" aria-hidden />
                <p className="relative text-[15px] font-semibold text-ink-2">Груз опубликован. Водители рядом с {c.from === "khorgos" ? "Хоргосом" : "точкой погрузки"} уже видят его — предложения появятся здесь.</p>
              </div>
            )}
            <div className="grid gap-3">
              {c.offers.map((o) => {
                const d = driver(o.driverId);
                const diff = o.price - c.price;
                return (
                  <article key={o.id} className="toast-in rounded-[3px] border border-line bg-white p-4 shadow-[0_6px_16px_-12px_rgba(0,0,0,0.3)]">
                    <div className="flex items-start gap-3">
                      <Avatar name={d.name} kind="driver" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[16px] font-bold">{d.name}</span>
                          <span className="shrink-0 text-[12.5px] text-ink-3">{ago(o.at)}</span>
                        </div>
                        <Rating value={d.rating} sub={`${d.trips} рейсов · ${d.years} лет`} />
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5"><Plate plate={d.plate} />{d.docs.map((x) => <Tag key={x}>{x}</Tag>)}</div>
                        <div className="mt-1 text-[13.5px] text-ink-2">{d.truck}</div>
                      </div>
                    </div>
                    <p className="mt-3 rounded-[3px] bg-[#f3f4f3] px-3 py-2 text-[14.5px] text-ink-2">«{o.note}»</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-display text-[30px] font-extrabold leading-none tabular-nums">{money(o.price)}</div>
                        <div className={`mt-1 text-[13px] font-bold ${diff > 0 ? "text-oxide" : diff < 0 ? "text-seal" : "text-ink-3"}`}>
                          {diff === 0 ? "ваша цена" : `${diff > 0 ? "+" : "−"}${money(Math.abs(diff))} к вашей цене`}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => chatWithDriver(d.id)} aria-label={`Написать: ${d.name}`} className="grid size-12 place-items-center rounded-[4px] border-2 border-ink active:bg-yard"><MessageCircle size={20} /></button>
                        <button
                          onClick={() => { setJustSealed(true); acceptOffer(c.id, o.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                          className="rounded-[4px] border-2 border-ink bg-signal px-4 text-[15px] font-extrabold active:bg-signal-deep"
                        >
                          Принять
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ------- driver: accept or counter ------- */}
        {iAmDriver && c.status === "open" && (
          <section className="mt-6">
            {c.bid?.status === "pending" ? (
              <div className="relative overflow-hidden rounded-[3px] border-2 border-ink bg-white p-4">
                <div className="sweep absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-signal/40 to-transparent" aria-hidden />
                <div className="relative">
                  <div className="text-[13px] font-bold uppercase tracking-[0.08em] text-ink-3">Ваше предложение отправлено</div>
                  <div className="font-display text-[32px] font-extrabold leading-tight">{money(c.bid.price)}</div>
                  <p className="text-[14px] text-ink-2">Ждём ответа клиента. Уведомим, как только он решит.</p>
                </div>
              </div>
            ) : c.bid?.status === "declined" ? (
              <div className="rounded-[3px] border border-line bg-white p-4">
                <div className="text-[15px] font-extrabold">Клиент выбрал другое предложение</div>
                <p className="mt-1 text-[14px] text-ink-2">Ваша цена {money(c.bid.price)} оказалась выше, чем он готов платить. Можно предложить снова.</p>
                <button onClick={() => setCounter(c.price)} className="mt-3 rounded-[4px] border-2 border-ink px-4 py-2.5 text-[15px] font-extrabold active:bg-yard">Предложить ещё раз</button>
              </div>
            ) : null}

            {(!c.bid || c.bid.status === "declined") && (
              <div className="mt-3 grid gap-2.5">
                {counter === null ? (
                  <>
                    <button onClick={() => placeBid(c.id, c.price)} className="rounded-[5px] border-2 border-ink bg-signal py-4 text-[18px] font-extrabold shadow-[0_8px_18px_-10px_rgba(0,0,0,0.5)] active:translate-y-px active:bg-signal-deep">
                      Принять за {money(c.price)}
                    </button>
                    <button onClick={() => setCounter(Math.round((c.price * 1.05) / 10000) * 10000)} className="rounded-[5px] border-2 border-ink bg-white py-3.5 text-[16px] font-extrabold active:bg-yard">
                      Предложить свою цену
                    </button>
                  </>
                ) : (
                  <div className="rounded-[3px] border border-line bg-white p-4">
                    <div className="mb-3 text-[16px] font-extrabold">Ваша цена</div>
                    <Stepper value={counter} onChange={setCounter} label="Ваша цена в тенге" />
                    <div className="mt-2.5 flex gap-2">
                      {[-0.05, 0.05, 0.1].map((p) => (
                        <button key={p} onClick={() => setCounter(Math.round((c.price * (1 + p)) / 10000) * 10000)} className="flex-1 rounded-[4px] border-2 border-line py-2 text-[14px] font-bold active:border-ink">
                          {p > 0 ? "+" : "−"}{Math.abs(p * 100)}%
                        </button>
                      ))}
                    </div>
                    <p className="mt-2.5 text-[13px] text-ink-3">≈ {perKm(counter, c.from, c.to)} ₸/км. Клиент предлагает {money(c.price)}.</p>
                    <div className="mt-3 grid grid-cols-[auto_1fr] gap-2">
                      <button onClick={() => setCounter(null)} className="rounded-[4px] border-2 border-line px-4 text-[15px] font-bold active:border-ink">Отмена</button>
                      <button onClick={() => { placeBid(c.id, counter); setCounter(null); }} className="rounded-[4px] border-2 border-ink bg-signal py-3.5 text-[16px] font-extrabold active:bg-signal-deep">
                        Отправить {money(counter)}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {state.role === "client" && !c.mine && (
          <p className="mt-4 rounded-[3px] bg-white/60 px-4 py-3 text-[14px] text-ink-2">Это груз другого клиента. Переключитесь в режим «Водитель», чтобы взять его или предложить цену.</p>
        )}
        {c.mine && c.status === "open" && (
          <p className="mt-4 px-1 text-[13px] text-ink-3">Оценка рынка {money(est)} — приблизительный расчёт по расстоянию и кузову, не гарантия цены.</p>
        )}
        <div className="h-6" />
        <Link href="/" className="sr-only">В ленту</Link>
      </div>
    </main>
  );
}
