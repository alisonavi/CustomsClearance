"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Check, MessageCircle, Phone, Truck as TruckIcon } from "lucide-react";
import { useStore, route } from "@/lib/store";
import { BODIES, CARRIER_STEP, CATEGORIES, EXTRAS, LOADING, PACKAGING, RATE_CARRIER, RATE_CLIENT, isOpen } from "@/lib/catalog";
import { cityFull, km } from "@/lib/geo";
import { ago, count, money, nf, rangeLabel, round10k } from "@/lib/format";
import { clientOf, driverOf, fit, isIntl, matchTrucks, priceHint, tons, truckOf } from "@/lib/match";
import { ME_CARRIER, ME_CLIENT, type Cargo, type Offer, type Truck } from "@/lib/types";
import { customsLabel } from "@/components/cards";
import {
  Avatar, Button, Card, Choice, Empty, FitBadge, FitChecks, H2, Option, Page, Pill, Plate, RouteLine, Row, Sheet, StarInput, Stars, Stepper,
  Timeline, TopBar, TruckArt, Verified, inputCls,
} from "@/components/ui";

const demoCall = "Звонок в демо-версии не совершается";

export default function CargoPage() {
  const { id } = useParams<{ id: string }>();
  const { s } = useStore();
  const c = s.cargo.find((x) => x.id === id);
  if (!c) return (<><TopBar title="Груз" /><Page className="p-4"><Empty title="Заявка не найдена" text="Возможно, её уже закрыли." /></Page></>);
  return <CargoView c={c} />;
}

function CargoView({ c }: { c: Cargo }) {
  const { s } = useStore();
  const role = s.user.role;
  const dealTruck = c.deal ? truckOf(s, c.deal.truckId) : undefined;
  const owner = role === "client" && c.clientId === ME_CLIENT;
  const myTrip = role === "carrier" && dealTruck?.carrierId === ME_CARRIER;
  const hint = priceHint(c.from, c.to, c.weight, c.bodies[0]);
  return (
    <>
      <TopBar title={owner ? "Моя заявка" : myTrip ? "Мой рейс" : "Груз"} />
      <Page className="px-3 pb-48 pt-3">
        <Card className="p-5">
          <RouteLine big from={cityFull(c.from)} fromSub={c.fromPoint} to={cityFull(c.to)} toSub={c.toPoint} />
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-page px-3.5 py-2.5"><div className="text-ink-3">Загрузка</div><div className="text-lg font-bold">{rangeLabel(c.date, c.flex)}</div></div>
            <div className="rounded-xl bg-page px-3.5 py-2.5"><div className="text-ink-3">Расстояние</div><div className="text-lg font-bold">≈ {nf(km(c.from, c.to))} км</div></div>
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="text-ink-3">{c.deal ? "Цена сделки" : c.priceMode === "fixed" ? "Цена клиента" : "Цена"}</div>
              <div className="text-[1.9rem] font-bold leading-tight tnum">{c.deal ? money(c.deal.price) : c.priceMode === "fixed" && c.price ? money(c.price) : "Ждут предложений"}</div>
              {!c.deal && <div className="text-ink-3">Обычно на этом направлении: {money(hint.lo)} – {money(hint.hi)} (оценка)</div>}
            </div>
            {c.urgent && <Pill tone="bad">Срочно</Pill>}
          </div>
        </Card>

        {owner && isOpen(c.status) && <OwnerOffers c={c} />}
        {role === "carrier" && !myTrip && <CarrierSide c={c} />}
        {(owner || myTrip) && c.deal && dealTruck && <Deal c={c} t={dealTruck} side={owner ? "client" : "carrier"} />}

        <Details c={c} />
        {role === "carrier" && <ClientBlock id={c.clientId} />}
      </Page>
    </>
  );
}

/* ---------- details (spec §5) ---------- */

function Details({ c }: { c: Cargo }) {
  return (
    <>
      <H2>Груз</H2>
      <Card className="px-4">
        <Row label="Что везём">{c.title}</Row>
        <Row label="Категория">{CATEGORIES[c.category] ?? "—"}</Row>
        <Row label="Вес">{tons(c.weight)}</Row>
        <Row label="Объём">{c.volume ? `${c.volume} м³` : "—"}</Row>
        {!!c.places && <Row label="Мест / паллет">{c.places}</Row>}
        {c.dims && <Row label="Размеры">{c.dims}</Row>}
        {c.packaging && <Row label="Упаковка">{PACKAGING[c.packaging]}</Row>}
        {c.stackable !== undefined && <Row label="Штабелировать">{c.stackable ? "Можно" : "Нельзя"}</Row>}
        {c.note && <Row label="Особенности">{c.note}</Row>}
      </Card>
      <H2>Какая нужна машина</H2>
      <Card className="px-4">
        <Row label="Кузов">{c.bodies.length ? c.bodies.map((b) => BODIES[b].name).join(", ") : "Любой"}</Row>
        {c.temp && <Row label="Температура">{c.temp[0]}…{c.temp[1]} °C</Row>}
        {!!c.loading?.length && <Row label="Загрузка">{c.loading.map((l) => LOADING[l]).join(", ")}</Row>}
        {!!c.extras?.length && <Row label="Особые требования">{c.extras.filter((e) => EXTRAS.includes(e)).join(", ")}</Row>}
      </Card>
      <H2>Таможня</H2>
      <Card className="px-4">
        <Row label="Где оформление">{customsLabel(c)}</Row>
        <Row label="Перевозка">{isIntl(c) ? "Международная" : "По Казахстану"}</Row>
      </Card>
    </>
  );
}

function ClientBlock({ id }: { id: string }) {
  const { s } = useStore();
  const k = clientOf(s, id);
  return (
    <>
      <H2>Клиент</H2>
      <Link href={`/client/${k.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 active:bg-page">
        <Avatar name={k.company ?? k.name} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-semibold">{k.company ?? k.name}</div>
          <div className="text-ink-3"><Stars value={k.rating} /> · {count(k.deals, ["перевозка", "перевозки", "перевозок"])}</div>
        </div>
        <Verified ok={k.verified} />
      </Link>
    </>
  );
}

/* ---------- client: offers + matching trucks ---------- */

function OwnerOffers({ c }: { c: Cargo }) {
  const { s, choose, proposeToTruck, openChat, toast } = useStore();
  const router = useRouter();
  const [confirm, setConfirm] = useState<Offer | null>(null);
  const bids = c.offers.filter((o) => o.by === "carrier" && o.status === "new").sort((a, b) => a.price - b.price);
  const sent = c.offers.filter((o) => o.by === "client" && o.status === "new");
  const matches = matchTrucks(s, c).filter((m) => !c.offers.some((o) => o.truckId === m.t.id && o.status !== "declined"));
  const chat = (driverId: string) => router.push(`/chats/${openChat(c.clientId, driverId, c.id)}`);
  const ct = confirm ? truckOf(s, confirm.truckId) : undefined;
  return (
    <>
      <H2 right={bids.length ? <span className="text-ink-3">дешевле сверху</span> : undefined}>{bids.length ? `Предложения: ${bids.length}` : "Ждём предложений"}</H2>
      {!bids.length && (
        <Card className="relative overflow-hidden p-5">
          <div className="scan absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-brand-soft to-transparent" aria-hidden />
          <p className="relative text-lg text-ink-2">Водители уже видят заявку. Как только кто-то предложит цену — покажем здесь и пришлём уведомление.</p>
        </Card>
      )}
      <div className="grid gap-3">
        {bids.map((o) => {
          const t = truckOf(s, o.truckId);
          if (!t) return null;
          const d = driverOf(s, t.driverId);
          const diff = c.price ? o.price - c.price : 0;
          return (
            <Card key={o.id} as="article" className="p-4">
              <Link href={`/driver/${d.id}`} className="flex items-center gap-3">
                <Avatar name={d.name} />
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-semibold leading-snug">{d.name}</div>
                  <div className="text-ink-3"><Stars value={d.rating} /> · {count(d.trips, ["перевозка", "перевозки", "перевозок"])} · {ago(o.at)}</div>
                </div>
              </Link>
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-page p-2.5">
                <span className="w-20 shrink-0"><TruckArt body={t.body} kind={t.kind} /></span>
                <span className="min-w-0">
                  <span className="block font-semibold">{BODIES[t.body].name}, {tons(t.capacity)}{t.volume ? ` · ${t.volume} м³` : ""}</span>
                  <span className="block truncate text-ink-3">{t.make} {t.model}</span>
                </span>
              </div>
              {o.note && <p className="mt-3 text-lg">«{o.note}»</p>}
              <div className="mt-3"><FitBadge fit={fit(t, c)} /></div>
              <div className="mt-3 flex items-end justify-between gap-3 border-t border-line pt-3">
                <div>
                  <div className="text-[1.75rem] font-bold leading-none tnum">{money(o.price)}</div>
                  {!!diff && <div className={`mt-1 font-semibold ${diff > 0 ? "text-bad" : "text-ok"}`}>{diff > 0 ? "дороже" : "дешевле"} вашей цены на {money(Math.abs(diff))}</div>}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-[auto_1fr] gap-2">
                <Button variant="outline" onClick={() => chat(d.id)} aria-label={`Написать: ${d.name}`}><MessageCircle size={22} /> Написать</Button>
                <Button onClick={() => setConfirm(o)}>Выбрать</Button>
              </div>
            </Card>
          );
        })}
      </div>

      {sent.length > 0 && (
        <>
          <H2>Вы предложили груз</H2>
          <div className="grid gap-2">
            {sent.map((o) => {
              const t = truckOf(s, o.truckId);
              return t ? <Card key={o.id} className="flex items-center justify-between gap-3 p-4"><span className="font-semibold">{driverOf(s, t.driverId).name} · {t.make}</span><Pill tone="warn">Ждём ответа</Pill></Card> : null;
            })}
          </div>
        </>
      )}

      <H2>{matches.length ? `Подходящие машины: ${matches.length}` : "Подходящих машин пока нет"}</H2>
      {matches.length ? (
        <div className="grid gap-3">
          {matches.slice(0, 6).map(({ t, f }) => {
            const d = driverOf(s, t.driverId);
            return (
              <Card key={t.id} className="p-4">
                <Link href={`/truck/${t.id}`} className="flex items-start gap-3">
                  <span className="w-24 shrink-0 rounded-xl bg-brand-soft/60 p-1"><TruckArt body={t.body} kind={t.kind} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{BODIES[t.body].name}, {tons(t.capacity)}{t.volume ? ` · ${t.volume} м³` : ""}</span>
                    <span className="block text-ink-3">{d.name} · <Stars value={d.rating} /></span>
                    <span className="mt-1.5 block"><FitBadge fit={f} /></span>
                  </span>
                </Link>
                <div className="mt-3"><FitChecks fit={f} /></div>
                <Button variant="secondary" full className="mt-3" onClick={() => { proposeToTruck(c.id, t.id); toast({ title: "Предложение отправлено", body: `${d.name} получит вашу заявку. Ответ придёт в уведомления.` }); }}>
                  Предложить груз этой машине
                </Button>
              </Card>
            );
          })}
        </div>
      ) : (
        <p className="px-1 text-ink-3">Сообщим, как только появится машина по вашему маршруту и датам.</p>
      )}

      <Sheet open={!!confirm} onClose={() => setConfirm(null)} title="Выбрать перевозчика?"
        footer={<Button full onClick={() => { if (confirm) { choose(c.id, confirm.id); toast({ title: "Перевозчик выбран", body: "Открыли чат с водителем. Статус перевозки — на этой странице." }); } setConfirm(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Да, выбрать за {confirm ? money(confirm.price) : ""}</Button>}>
        {confirm && ct && (
          <div className="grid gap-3 text-lg">
            <p>{driverOf(s, ct.driverId).name}, {ct.make} {ct.model}.</p>
            <p className="text-ink-2">Остальным водителям сообщим, что вы выбрали другого. Дальше — договоритесь о загрузке в чате.</p>
          </div>
        )}
      </Sheet>
    </>
  );
}

/* ---------- carrier: fit, bid, take ---------- */

function CarrierSide({ c }: { c: Cargo }) {
  const { s, bid, answerProposal, openChat, toast } = useStore();
  const router = useRouter();
  const mine = s.trucks.filter((t) => t.carrierId === ME_CARRIER);
  const fits = mine.map((t) => ({ t, f: fit(t, c) }));
  const best = [...fits].sort((a, b) => (a.f.level === "full" ? 0 : a.f.level === "partial" ? 1 : 2) - (b.f.level === "full" ? 0 : b.f.level === "partial" ? 1 : 2))[0];
  const [truckId, setTruckId] = useState(s.q.carrier.truckId && mine.some((t) => t.id === s.q.carrier.truckId) ? s.q.carrier.truckId : best?.t.id);
  const [sheet, setSheet] = useState(false);
  const hint = priceHint(c.from, c.to, c.weight, c.bodies[0]);
  const [price, setPrice] = useState(c.price ?? round10k((hint.lo + hint.hi) / 2));
  const [notes, setNotes] = useState<string[]>([]);
  const t = mine.find((x) => x.id === truckId);
  const f = t ? fit(t, c) : undefined;
  const myIds = new Set(mine.map((x) => x.id));
  const myBid = c.offers.find((o) => o.by === "carrier" && myIds.has(o.truckId) && o.status !== "accepted");
  const proposal = c.offers.find((o) => o.by === "client" && o.status === "new" && myIds.has(o.truckId));
  const taken = !isOpen(c.status);
  const k = clientOf(s, c.clientId);
  const chat = () => t && router.push(`/chats/${openChat(c.clientId, t.driverId, c.id)}`);

  if (taken) return <Card className="mt-3 p-5"><p className="text-lg font-semibold">Этот груз уже забрал другой перевозчик.</p><p className="text-ink-3">Посмотрите похожие грузы в поиске.</p></Card>;

  const send = (p: number) => {
    if (!t) return;
    bid(c.id, t.id, p, notes.join(", ") || undefined);
    setSheet(false);
    toast({ title: "Предложение отправлено", body: `${k.company ?? k.name} получит вашу цену ${money(p)}. Ответ придёт в уведомления.` });
  };

  return (
    <>
      {proposal && (
        <Card className="mt-3 border-2 border-brand p-5">
          <div className="text-xl font-bold">Клиент предлагает этот груз вам</div>
          <p className="mt-1 text-lg text-ink-2">Для машины {truckOf(s, proposal.truckId)?.make} {truckOf(s, proposal.truckId)?.model} за <b className="text-ink">{money(proposal.price)}</b></p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => answerProposal(c.id, proposal.id, false)}>Отказаться</Button>
            <Button onClick={() => { const id = answerProposal(c.id, proposal.id, true); toast({ title: "Груз ваш", body: "Открыли чат с клиентом. Не забудьте отметить выезд на загрузку." }); if (id) router.push(`/cargo/${c.id}`); }}>Беру</Button>
          </div>
        </Card>
      )}

      <H2>Подходит ли вашей машине</H2>
      {mine.length > 1 && (
        <div className="-mt-1 mb-3"><Choice options={mine.map((x): [string, string] => [x.id, `${x.make} ${x.model}`])} value={truckId} onChange={setTruckId} /></div>
      )}
      {t && f ? (
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between gap-2"><span className="font-semibold">{t.make} {t.model} · {t.plate}</span><FitBadge fit={f} /></div>
          <FitChecks fit={f} />
        </Card>
      ) : (
        <Empty title="Добавьте машину" text="Чтобы откликаться на грузы, добавьте свою машину." action={<Link className="font-semibold text-brand" href="/fleet/add">Добавить машину</Link>} />
      )}

      {myBid && (
        <Card className={`mt-3 p-4 ${myBid.status === "declined" ? "" : "border-2 border-brand"}`}>
          {myBid.status === "new" ? (
            <>
              <div className="text-lg font-semibold">Ваше предложение: {money(myBid.price)}</div>
              <p className="text-ink-3">Ждём ответа клиента. Можно изменить цену.</p>
            </>
          ) : (
            <>
              <div className="text-lg font-semibold">Клиент выбрал другое предложение</div>
              <p className="text-ink-3">Можно предложить снова, ближе к {money(c.price ?? hint.lo)}.</p>
            </>
          )}
        </Card>
      )}

      {t && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
          <div className="mx-auto grid max-w-xl gap-2 px-3">
            {!proposal && (c.priceMode === "fixed" && c.price && !myBid
              ? <Button full onClick={() => send(c.price!)}>Взять за {money(c.price)}</Button>
              : <Button full onClick={() => setSheet(true)}>{myBid?.status === "new" ? "Изменить цену" : "Предложить цену"}</Button>)}
            <div className={`grid gap-2 ${!proposal && c.priceMode === "fixed" && c.price && !myBid ? "grid-cols-3" : "grid-cols-2"}`}>
              {!proposal && c.priceMode === "fixed" && c.price && !myBid && <Button variant="secondary" size="md" className="whitespace-nowrap px-2" onClick={() => setSheet(true)}>Своя цена</Button>}
              <Button variant="outline" size="md" className="whitespace-nowrap px-2" onClick={chat}><MessageCircle size={20} aria-hidden /> Написать</Button>
              <Button variant="outline" size="md" className="whitespace-nowrap px-2" onClick={() => toast({ title: demoCall, body: `${k.company ?? k.name}` })}><Phone size={20} aria-hidden /> Позвонить</Button>
            </div>
          </div>
        </div>
      )}

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Ваша цена" footer={<Button full disabled={!price} onClick={() => send(price)}>Отправить {money(price)}</Button>}>
        <div className="grid gap-5 pt-2">
          <div>
            <Stepper value={price} onChange={setPrice} step={10000} min={10000} unit="₸" label="Цена в тенге" big />
            <p className="mt-2 text-ink-3">{c.price ? `Клиент предлагает ${money(c.price)}. ` : ""}Обычно на этом направлении {money(hint.lo)} – {money(hint.hi)}.</p>
            <div className="mt-3 flex gap-2">
              {[-0.05, 0.05, 0.1].map((p) => <Button key={p} variant="outline" size="md" className="flex-1" onClick={() => setPrice(round10k((c.price ?? price) * (1 + p)))}>{p > 0 ? "+" : "−"}{Math.abs(p * 100)}%</Button>)}
            </div>
          </div>
          {mine.length > 1 && (
            <div>
              <div className="mb-2 text-lg font-bold">Какая машина поедет</div>
              <div className="grid gap-2">
                {fits.map(({ t: x, f: xf }) => <Option key={x.id} selected={truckId === x.id} onClick={() => setTruckId(x.id)} icon={<TruckIcon size={24} />} title={`${x.make} ${x.model}`} hint={xf.level === "full" ? "Подходит" : xf.level === "partial" ? "Почти подходит" : xf.checks.find((ch) => !ch.ok)?.text} />)}
              </div>
            </div>
          )}
          <div>
            <div className="mb-2 text-lg font-bold">Добавить к предложению</div>
            <Choice multi options={["Могу загрузиться в срок", "Есть TIR и CMR", "Опыт на этом маршруте", "Могу раньше"].map((n): [string, string] => [n, n])} value={notes} onChange={(v) => setNotes(notes.includes(v) ? notes.filter((x) => x !== v) : [...notes, v])} />
          </div>
        </div>
      </Sheet>
    </>
  );
}

/* ---------- deal: status, contacts, next step, ratings ---------- */

function Deal({ c, t, side }: { c: Cargo; t: Truck; side: "client" | "carrier" }) {
  const { s, advance, openChat, toast } = useStore();
  const router = useRouter();
  const d = driverOf(s, t.driverId);
  const k = clientOf(s, c.clientId);
  const step = CARRIER_STEP[c.status];
  const simulated = side === "client" && t.carrierId !== ME_CARRIER;
  const chat = () => router.push(`/chats/${openChat(c.clientId, t.driverId, c.id)}`);
  return (
    <>
      <H2>{side === "client" ? "Перевозчик" : "Клиент"}</H2>
      <Card className="p-4">
        <Link href={side === "client" ? `/driver/${d.id}` : `/client/${k.id}`} className="flex items-center gap-3">
          <Avatar name={side === "client" ? d.name : k.company ?? k.name} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-semibold">{side === "client" ? d.name : k.company ?? k.name}</div>
            <div className="text-ink-3"><Stars value={side === "client" ? d.rating : k.rating} /> · {side === "client" ? `${t.make} ${t.model}` : k.name}</div>
          </div>
        </Link>
        {side === "client" && <div className="mt-3 flex items-center gap-2"><Plate plate={t.plate} cn={t.cnPlate} /><span className="text-ink-3">{BODIES[t.body].name}, {tons(t.capacity)}</span></div>}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => toast({ title: demoCall, body: side === "client" ? d.name : k.company ?? k.name })}><Phone size={22} /> Позвонить</Button>
          <Button variant="secondary" onClick={chat}><MessageCircle size={22} /> Написать</Button>
        </div>
      </Card>

      <H2>Статус перевозки</H2>
      <Card className="p-5">
        <Timeline status={c.status} log={c.log} intl={isIntl(c)} />
        {side === "carrier" && step && (
          <Button full className="mt-2" onClick={() => { advance(c.id); toast({ title: "Статус обновлён", body: "Клиент получит уведомление." }); }}>
            <Check size={22} strokeWidth={3} /> {step}
          </Button>
        )}
        {simulated && step && (
          <Button variant="ghost" full className="mt-1" onClick={() => advance(c.id)}>Демо: следующий этап</Button>
        )}
        {side === "client" && step && !simulated && <p className="mt-2 text-ink-3">Статус меняет водитель. Вы получите уведомление.</p>}
      </Card>

      {(c.status === "done" || c.status === "rated") && <Ratings c={c} side={side} />}
    </>
  );
}

function Ratings({ c, side }: { c: Cargo; side: "client" | "carrier" }) {
  const { rate, toast } = useStore();
  const criteria = side === "client" ? RATE_CARRIER : RATE_CLIENT;
  const [scores, setScores] = useState<number[]>(criteria.map(() => 0));
  const [text, setText] = useState("");
  const mine = side === "client" ? c.byClient : c.byCarrier;
  const theirs = side === "client" ? c.byCarrier : c.byClient;
  const ready = scores.every((x) => x > 0);
  return (
    <>
      <H2>{mine ? "Ваш отзыв" : side === "client" ? "Оцените перевозчика" : "Оцените клиента"}</H2>
      {mine ? (
        <Card className="p-4">
          <div className="grid gap-1">{criteria.map((cr, i) => <div key={cr} className="flex justify-between"><span className="text-ink-2">{cr}</span><Stars value={mine.scores[i]} /></div>)}</div>
          {mine.text && <p className="mt-3 text-lg">«{mine.text}»</p>}
        </Card>
      ) : (
        <Card className="grid gap-4 p-4">
          <p className="text-ink-3">Отзыв увидят другие {side === "client" ? "клиенты" : "перевозчики"}. Он привязан к этой перевозке.</p>
          {criteria.map((cr, i) => <StarInput key={cr} label={cr} value={scores[i]} onChange={(n) => setScores(scores.map((x, j) => (j === i ? n : x)))} />)}
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Пара слов (необязательно)" aria-label="Комментарий к отзыву" className={`${inputCls} h-auto py-3`} />
          <Button full disabled={!ready} onClick={() => { rate(c.id, side, scores, text); toast({ title: "Спасибо за отзыв", body: "Оценка сохранена в профиле." }); }}>{ready ? "Отправить отзыв" : "Поставьте оценки"}</Button>
        </Card>
      )}
      {theirs && (
        <>
          <H2>{side === "client" ? "Отзыв перевозчика о вас" : "Отзыв клиента о вас"}</H2>
          <Card className="p-4">
            <div className="grid gap-1">{(side === "client" ? RATE_CLIENT : RATE_CARRIER).map((cr, i) => <div key={cr} className="flex justify-between"><span className="text-ink-2">{cr}</span><Stars value={theirs.scores[i]} /></div>)}</div>
            {theirs.text && <p className="mt-3 text-lg">«{theirs.text}»</p>}
          </Card>
        </>
      )}
    </>
  );
}
