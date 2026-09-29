"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { FLOW, STATUS, isOpen, type Status } from "./catalog";
import { cityShort, type PlaceQ } from "./geo";
import { count, isoDay, money, round10k, uid } from "./format";
import { clientOf, driverOf, fit, isIntl, matchCargo, matchTrucks, priceHint, tons, truckOf } from "./match";
import { poolCargo, poolTrucks, seedState } from "./seed";
import { ME_CARRIER, ME_CLIENT, type Cargo, type CargoFilters, type Chat, type Msg, type Notif, type Offer, type Review, type Role, type State, type Truck, type TruckFilters } from "./types";

export type Toast = { id: string; title: string; body: string; href?: string };

type Action = { t: "set"; fn: (s: State) => State } | { t: "replace"; state: State };
const reducer = (s: State, a: Action): State => (a.t === "set" ? a.fn(s) : a.state);

const KEY = "keruen-v2";
function load(): State {
  if (typeof window === "undefined") return seedState();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as State;
      if (s.v === 2) return s;
    }
  } catch {}
  return seedState();
}

const upd = <T extends { id: string }>(arr: T[], id: string, fn: (x: T) => T) => arr.map((x) => (x.id === id ? fn(x) : x));
export const route = (c: Pick<Cargo, "from" | "to">) => `${cityShort(c.from)} → ${cityShort(c.to)}`;
export const clientLabel = (s: State, id: string) => { const c = clientOf(s, id); return c.company ?? c.name; };
const priceMid = (c: Cargo) => { const h = priceHint(c.from, c.to, c.weight, c.bodies[0]); return round10k((h.lo + h.hi) / 2); };
const isMeClient = (id: string) => id === ME_CLIENT;
const isMeCarrier = (id: string) => id === ME_CARRIER;

const DRIVER_REPLIES = ["Понял, принял.", "На границе очередь около трёх часов. Как пройду — напишу.", "Скиньте, пожалуйста, точку загрузки.", "Хорошо, договорились. До связи!"];
const CLIENT_REPLIES = ["Отлично, ждём вас на складе.", "Пришлите фото техпаспорта и номер прицепа для пропуска.", "Оплата по факту выгрузки, безналичный расчёт. Подходит?", "Хорошо, договорились!"];
const BID_NOTES = ["Могу загрузиться в срок", "Есть TIR и CMR, опыт по этому маршруту", "Свободен раньше, могу подъехать заранее"];

/** Next lifecycle step; customs is skipped for domestic runs. */
export function nextStatus(c: Cargo): Status | undefined {
  const flow = FLOW.filter((s) => s !== "customs" || isIntl(c));
  const i = flow.indexOf(c.status);
  const next = flow[i + 1];
  return next && next !== "rated" ? next : undefined;
}

function useStoreValue() {
  const [s, dispatch] = useReducer(reducer, undefined, load);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const ref = useRef(s);
  const activeChat = useRef<string | null>(null);
  useEffect(() => {
    ref.current = s;
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  }, [s]);

  const set = useCallback((fn: (s: State) => State) => {
    dispatch({ t: "set", fn });
    ref.current = fn(ref.current); // keep timers in sync before the next render
  }, []);
  const later = useCallback((ms: number, fn: () => void) => { window.setTimeout(fn, ms); }, []);

  const toast = useCallback((x: Omit<Toast, "id">) => {
    const id = uid("t");
    setToasts((all) => [{ ...x, id }, ...all].slice(0, 2));
    window.setTimeout(() => setToasts((all) => all.filter((y) => y.id !== id)), 5500);
  }, []);
  const dismiss = useCallback((id: string) => setToasts((all) => all.filter((y) => y.id !== id)), []);

  const notify = useCallback((role: Role, kind: Notif["kind"], title: string, body: string, href: string) => {
    const n: Notif = { id: uid("n"), role, kind, title, body, href, at: Date.now(), read: false };
    set((s) => ({ ...s, notifs: [n, ...s.notifs] }));
    if (ref.current.user.role === role) toast({ title, body, href });
  }, [set, toast]);

  const msg = (from: Msg["from"], text: string): Msg => ({ id: uid("m"), from, text, at: Date.now() });

  /* ---------- chat ---------- */

  const openChat = useCallback((clientId: string, driverId: string, cargoId?: string, system?: string) => {
    const st = ref.current;
    const d = driverOf(st, driverId);
    const found = st.chats.find((c) => c.clientId === clientId && c.driverId === driverId);
    if (found) {
      if (system || cargoId) set((s) => ({ ...s, chats: upd(s.chats, found.id, (c) => ({ ...c, cargoId: cargoId ?? c.cargoId, msgs: system ? [...c.msgs, msg("system", system)] : c.msgs })) }));
      return found.id;
    }
    const chat: Chat = { id: uid("ch"), clientId, carrierId: d.carrierId, driverId, cargoId, msgs: system ? [msg("system", system)] : [], unread: { client: 0, carrier: 0 } };
    set((s) => ({ ...s, chats: [chat, ...s.chats] }));
    return chat.id;
  }, [set]);

  /** A simulated counterparty types, then answers. */
  const peerSays = useCallback((chatId: string, side: Role, text: string, delay: number) => {
    later(Math.max(400, delay - 1500), () => set((s) => ({ ...s, chats: upd(s.chats, chatId, (c) => ({ ...c, typing: side })) })));
    later(delay, () => {
      const reader: Role = side === "client" ? "carrier" : "client";
      const here = activeChat.current === chatId && ref.current.user.role === reader;
      set((s) => ({ ...s, chats: upd(s.chats, chatId, (c) => ({ ...c, typing: null, msgs: [...c.msgs, msg(side, text)], unread: { ...c.unread, [reader]: here ? 0 : c.unread[reader] + 1 } })) }));
      if (!here) {
        const c = ref.current.chats.find((x) => x.id === chatId);
        const name = c ? (side === "carrier" ? driverOf(ref.current, c.driverId).name : clientLabel(ref.current, c.clientId)) : "";
        notify(reader, "message", `Сообщение: ${name}`, text, `/chats/${chatId}`);
      }
    });
  }, [later, notify, set]);

  const send = useCallback((chatId: string, text: string) => {
    const st = ref.current;
    const c = st.chats.find((x) => x.id === chatId);
    const me = st.user.role;
    if (!c || !text.trim()) return;
    const other: Role = me === "client" ? "carrier" : "client";
    set((s) => ({ ...s, chats: upd(s.chats, chatId, (x) => ({ ...x, msgs: [...x.msgs, msg(me, text.trim())], unread: { ...x.unread, [other]: x.unread[other] + 1 } })) }));
    const otherIsSimulated = me === "client" ? !isMeCarrier(c.carrierId) : !isMeClient(c.clientId);
    if (otherIsSimulated) {
      const pool = other === "carrier" ? DRIVER_REPLIES : CLIENT_REPLIES;
      const n = c.msgs.filter((m) => m.from === me).length;
      peerSays(chatId, other, pool[n % pool.length], 2600 + Math.random() * 1200);
    }
  }, [peerSays, set]);

  const readChat = useCallback((id: string | null) => {
    activeChat.current = id;
    if (!id) return;
    const role = ref.current.user.role;
    set((s) => ({ ...s, chats: upd(s.chats, id, (c) => (c.unread[role] ? { ...c, unread: { ...c.unread, [role]: 0 } } : c)) }));
  }, [set]);

  /* ---------- deal lifecycle ---------- */

  const choose = useCallback((cargoId: string, offerId: string) => {
    const st = ref.current;
    const c = st.cargo.find((x) => x.id === cargoId);
    const o = c?.offers.find((x) => x.id === offerId);
    const t = o ? truckOf(st, o.truckId) : undefined;
    if (!c || !o || !t || !isOpen(c.status)) return;
    const now = Date.now();
    set((s) => ({
      ...s,
      cargo: upd(s.cargo, cargoId, (x) => ({
        ...x, status: "chosen", log: [...x.log, { s: "chosen", at: now }], deal: { truckId: o.truckId, price: o.price },
        offers: x.offers.map((y) => (y.id === o.id ? { ...y, status: "accepted" } : y.status === "new" ? { ...y, status: "declined" } : y)),
      })),
      trucks: upd(s.trucks, t.id, (x) => ({ ...x, state: "trip" })),
    }));
    const chatId = openChat(c.clientId, t.driverId, c.id, `Перевозчик выбран · ${money(o.price)}`);
    const d = driverOf(st, t.driverId);
    if (isMeCarrier(t.carrierId) && isMeClient(c.clientId)) {
      notify(o.by === "carrier" ? "carrier" : "client", "accepted", o.by === "carrier" ? "Клиент выбрал вас" : "Водитель принял ваш груз", `${route(c)} · ${money(o.price)}`, `/cargo/${c.id}`);
    } else if (!isMeCarrier(t.carrierId)) {
      peerSays(chatId, "carrier", "Здравствуйте! Спасибо, что выбрали. Пришлите точный адрес загрузки и контакт на складе.", 2800);
      later(9000, () => {
        const cur = ref.current.cargo.find((x) => x.id === cargoId);
        if (cur?.status !== "chosen") return;
        set((s) => ({ ...s, cargo: upd(s.cargo, cargoId, (x) => ({ ...x, status: "to_loading", log: [...x.log, { s: "to_loading", at: Date.now() }] })) }));
        notify("client", "status", "Машина едет на загрузку", `${d.name} · ${route(c)}`, `/cargo/${c.id}`);
      });
    } else {
      peerSays(chatId, "client", "Здравствуйте! Подтверждаем. Когда будете на загрузке?", 2800);
    }
    return chatId;
  }, [later, notify, openChat, peerSays, set]);

  const advance = useCallback((cargoId: string) => {
    const st = ref.current;
    const c = st.cargo.find((x) => x.id === cargoId);
    if (!c || !c.deal) return;
    const next = nextStatus(c);
    if (!next) return;
    const t = truckOf(st, c.deal.truckId);
    set((s) => ({
      ...s,
      cargo: upd(s.cargo, cargoId, (x) => ({ ...x, status: next, log: [...x.log, { s: next, at: Date.now() }] })),
      trucks: next === "done" && t ? upd(s.trucks, t.id, (x) => ({ ...x, at: c.to, freeFrom: isoDay(0), state: isMeCarrier(x.carrierId) ? "off" : "free" })) : s.trucks,
    }));
    const actor = st.user.role;
    if (actor === "carrier" && isMeClient(c.clientId)) {
      notify("client", "status", next === "done" ? "Груз доставлен" : `Статус: ${STATUS[next]}`, route(c), `/cargo/${c.id}`);
    }
    if (next === "done") {
      if (isMeClient(c.clientId)) notify("client", "rate", "Оцените перевозчика", `${route(c)} завершена. Как всё прошло?`, `/cargo/${c.id}`);
      if (t && isMeCarrier(t.carrierId)) notify("carrier", "rate", "Оцените клиента", `${route(c)} завершена`, `/cargo/${c.id}`);
      if (t && !isMeClient(c.clientId)) peerSays(openChat(c.clientId, t.driverId), "client", "Груз получили, всё в порядке. Спасибо!", 2500);
    }
  }, [notify, openChat, peerSays, set]);

  const rate = useCallback((cargoId: string, side: Role, scores: number[], text: string) => {
    const st = ref.current;
    const c = st.cargo.find((x) => x.id === cargoId);
    const t = c?.deal ? truckOf(st, c.deal.truckId) : undefined;
    if (!c || !t) return;
    const d = driverOf(st, t.driverId);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const write = (by: "client" | "carrier", review: Review) => set((s) => {
      const cargo = upd(s.cargo, cargoId, (x) => {
        const y = by === "client" ? { ...x, byClient: review } : { ...x, byCarrier: review };
        return y.byClient && y.byCarrier ? { ...y, status: "rated" as Status, log: [...y.log, { s: "rated" as Status, at: Date.now() }] } : y;
      });
      const a = review.scores.reduce((p, q) => p + q, 0) / review.scores.length;
      return by === "client"
        ? { ...s, cargo, drivers: upd(s.drivers, d.id, (x) => ({ ...x, reviews: [review, ...x.reviews], rating: Math.round(((x.rating * x.ratingCount + a) / (x.ratingCount + 1)) * 10) / 10, ratingCount: x.ratingCount + 1 })) }
        : { ...s, cargo, clients: upd(s.clients, c.clientId, (x) => ({ ...x, reviews: [review, ...x.reviews], rating: Math.round(((x.rating * x.ratingCount + a) / (x.ratingCount + 1)) * 10) / 10, ratingCount: x.ratingCount + 1 })) };
    });
    const r = (by: string, sc: number[], tx?: string): Review => ({ id: uid("rv"), by, route: route(c), date: isoDay(0), scores: sc, text: tx || undefined });
    if (side === "client") {
      write("client", r(clientLabel(st, c.clientId), scores, text));
      if (!isMeCarrier(t.carrierId) && !c.byCarrier) later(3000, () => {
        write("carrier", r(d.name, [5, 5, 5, 5], "Спасибо за работу, всё было чётко."));
        notify("client", "rate", "Перевозчик оценил вас: 5,0", `${d.name} · ${route(c)}`, `/cargo/${c.id}`);
      });
    } else {
      write("carrier", r(d.name, scores, text));
      if (!isMeClient(c.clientId) && !c.byClient) later(3000, () => {
        write("client", r(clientLabel(st, c.clientId), [5, 5, 5, 5], "Приехал вовремя, груз в целости."));
        notify("carrier", "rate", "Клиент оценил вас: 5,0", `${clientLabel(ref.current, c.clientId)} · ${route(c)}`, `/cargo/${c.id}`);
      });
    }
    return avg;
  }, [later, notify, set]);

  /* ---------- client actions ---------- */

  const createCargo = useCallback((input: Omit<Cargo, "id" | "clientId" | "createdAt" | "status" | "log" | "offers">) => {
    const now = Date.now();
    const c: Cargo = { ...input, id: uid("r"), clientId: ME_CLIENT, createdAt: now, status: "published", log: [{ s: "published", at: now }], offers: [] };
    set((s) => ({ ...s, cargo: [c, ...s.cargo] }));
    later(1400, () => {
      const m = matchTrucks(ref.current, c);
      notify("client", "match_truck", m.length ? `Нашли ${count(m.length, ["подходящую машину", "подходящие машины", "подходящих машин"])}` : "Заявка опубликована", m.length ? `Для заявки ${route(c)}` : "Сообщим, когда появятся подходящие машины", `/cargo/${c.id}`);
      const mine = m.find((x) => isMeCarrier(x.t.carrierId));
      if (mine) notify("carrier", "match_cargo", `Подходящий груз для ${mine.t.make} ${mine.t.model}`, `${route(c)} · ${tons(c.weight)}`, `/cargo/${c.id}`);
      const bidders = m.filter((x) => !isMeCarrier(x.t.carrierId)).slice(0, 3).map((x) => x.t);
      const base = c.priceMode === "fixed" && c.price ? c.price : priceMid(c);
      const deltas = [0, 0.06, -0.03];
      bidders.forEach((t, i) => later(4500 + i * 6500, () => {
        const cur = ref.current.cargo.find((x) => x.id === c.id);
        if (!cur || !isOpen(cur.status)) return;
        const o: Offer = { id: uid("o"), truckId: t.id, price: round10k(base * (1 + deltas[i])), note: BID_NOTES[i], at: Date.now(), status: "new", by: "carrier" };
        set((s) => ({ ...s, cargo: upd(s.cargo, c.id, (x) => ({ ...x, status: "offers", log: x.status === "published" ? [...x.log, { s: "offers", at: Date.now() }] : x.log, offers: [o, ...x.offers] })) }));
        notify("client", "offer", `Новое предложение: ${money(o.price)}`, `${driverOf(ref.current, t.driverId).name} · ${route(c)}`, `/cargo/${c.id}`);
      }));
    });
    return c.id;
  }, [later, notify, set]);

  /** DAT-style: the client offers a load straight to a posted truck. */
  const proposeToTruck = useCallback((cargoId: string, truckId: string) => {
    const st = ref.current;
    const c = st.cargo.find((x) => x.id === cargoId);
    const t = truckOf(st, truckId);
    if (!c || !t) return;
    const o: Offer = { id: uid("o"), truckId, price: c.price ?? priceMid(c), at: Date.now(), status: "new", by: "client" };
    set((s) => ({ ...s, cargo: upd(s.cargo, cargoId, (x) => ({ ...x, offers: [o, ...x.offers] })) }));
    const d = driverOf(st, t.driverId);
    if (isMeCarrier(t.carrierId)) {
      notify("carrier", "proposal", "Клиент предлагает груз", `${clientLabel(st, c.clientId)} · ${route(c)} · ${money(o.price)}`, `/cargo/${c.id}`);
    } else {
      later(5000, () => {
        const cur = ref.current.cargo.find((x) => x.id === cargoId);
        if (!cur || !isOpen(cur.status) || cur.offers.find((x) => x.id === o.id)?.status !== "new") return;
        choose(cargoId, o.id);
        notify("client", "accepted", `${d.name} принял ваш груз`, `${route(c)} · ${money(o.price)}`, `/cargo/${c.id}`);
      });
    }
    return o.id;
  }, [choose, later, notify, set]);

  /* ---------- carrier actions ---------- */

  const bid = useCallback((cargoId: string, truckId: string, price: number, note?: string) => {
    const st = ref.current;
    const c = st.cargo.find((x) => x.id === cargoId);
    const t = truckOf(st, truckId);
    if (!c || !t) return;
    const o: Offer = { id: uid("o"), truckId, price, note, at: Date.now(), status: "new", by: "carrier" };
    set((s) => ({ ...s, cargo: upd(s.cargo, cargoId, (x) => ({ ...x, status: "offers", log: x.status === "published" ? [...x.log, { s: "offers", at: Date.now() }] : x.log, offers: [o, ...x.offers.filter((y) => !(y.truckId === truckId && y.by === "carrier" && y.status === "new"))] })) }));
    if (isMeClient(c.clientId)) {
      notify("client", "offer", `Новое предложение: ${money(price)}`, `${driverOf(st, t.driverId).name} · ${route(c)}`, `/cargo/${c.id}`);
      return;
    }
    later(6000, () => {
      const cur = ref.current.cargo.find((x) => x.id === cargoId);
      if (!cur || !isOpen(cur.status) || cur.offers.find((x) => x.id === o.id)?.status !== "new") return;
      const target = cur.price ?? priceMid(cur);
      const who = clientLabel(ref.current, cur.clientId);
      if (price <= target * 1.1) {
        choose(cargoId, o.id);
        notify("carrier", "accepted", `${who} принял ваше предложение`, `${route(cur)} · ${money(price)}`, `/cargo/${cur.id}`);
      } else {
        set((s) => ({ ...s, cargo: upd(s.cargo, cargoId, (x) => ({ ...x, offers: x.offers.map((y) => (y.id === o.id ? { ...y, status: "declined" } : y)) })) }));
        notify("carrier", "declined", `${who} выбрал другое предложение`, `${route(cur)}. Цена ближе к ${money(target)} проходит чаще`, `/cargo/${cur.id}`);
      }
    });
  }, [choose, later, notify, set]);

  const answerProposal = useCallback((cargoId: string, offerId: string, accept: boolean) => {
    const st = ref.current;
    const c = st.cargo.find((x) => x.id === cargoId);
    if (!c) return;
    if (accept) {
      const chatId = choose(cargoId, offerId);
      return chatId;
    }
    set((s) => ({ ...s, cargo: upd(s.cargo, cargoId, (x) => ({ ...x, offers: x.offers.map((y) => (y.id === offerId ? { ...y, status: "declined" } : y)) })) }));
    if (isMeClient(c.clientId)) notify("client", "declined", "Водитель отказался", route(c), `/cargo/${c.id}`);
  }, [choose, notify, set]);

  const postTruck = useCallback((truckId: string, p: { at: string; freeFrom: string; goingTo: string[] }) => {
    set((s) => ({ ...s, trucks: upd(s.trucks, truckId, (x) => ({ ...x, ...p, state: "free", postedAt: Date.now() })) }));
    later(1200, () => {
      const t = truckOf(ref.current, truckId);
      if (!t) return;
      const m = matchCargo(ref.current, t);
      notify("carrier", "match_cargo", m.length ? `Нашли ${count(m.length, ["подходящий груз", "подходящих груза", "подходящих грузов"])}` : "Машина размещена", m.length ? `Для ${t.make} ${t.model} · ${cityShort(t.at)}` : "Сообщим, когда появится подходящий груз", `/fleet/${t.id}`);
      ref.current.cargo.filter((c) => isMeClient(c.clientId) && isOpen(c.status)).forEach((c) => {
        if (fit(t, c).level !== "none") notify("client", "match_truck", "Новая подходящая машина", `${t.make} ${t.model} · для заявки ${route(c)}`, `/truck/${t.id}`);
      });
      const cand = m.find((x) => !isMeClient(x.c.clientId));
      if (cand) later(7000, () => {
        const cur = ref.current.cargo.find((x) => x.id === cand.c.id);
        if (!cur || !isOpen(cur.status)) return;
        const o: Offer = { id: uid("o"), truckId, price: cur.price ?? priceMid(cur), at: Date.now(), status: "new", by: "client" };
        set((s) => ({ ...s, cargo: upd(s.cargo, cur.id, (x) => ({ ...x, offers: [o, ...x.offers] })) }));
        notify("carrier", "proposal", "Клиент предлагает груз", `${clientLabel(ref.current, cur.clientId)} · ${route(cur)} · ${money(o.price)}`, `/cargo/${cur.id}`);
      });
    });
  }, [later, notify, set]);

  const unpostTruck = useCallback((truckId: string) => set((s) => ({ ...s, trucks: upd(s.trucks, truckId, (x) => ({ ...x, state: "off" })) })), [set]);
  const updateTruck = useCallback((truckId: string, patch: Partial<Truck>) => set((s) => ({ ...s, trucks: upd(s.trucks, truckId, (x) => ({ ...x, ...patch })) })), [set]);

  const addDriver = useCallback((name: string, phone: string) => {
    const id = uid("md");
    set((s) => ({ ...s, drivers: [...s.drivers, { id, carrierId: ME_CARRIER, name, phone, verified: false, years: 0, trips: 0, rating: 0, ratingCount: 0, directions: [], reviews: [] }] }));
    return id;
  }, [set]);

  const addTruck = useCallback((t: Omit<Truck, "id" | "carrierId" | "verified" | "state" | "postedAt">) => {
    const id = uid("t");
    set((s) => ({ ...s, trucks: [...s.trucks, { ...t, id, carrierId: ME_CARRIER, verified: "pending", state: "off" }] }));
    later(9000, () => {
      set((s) => ({ ...s, trucks: upd(s.trucks, id, (x) => ({ ...x, verified: true })) }));
      notify("carrier", "verified", "Документы проверены", `${t.make} ${t.model} · ${t.plate}`, `/fleet/${id}`);
    });
    return id;
  }, [later, notify, set]);

  /* ---------- search, settings ---------- */

  const setQuery = useCallback((role: Role, patch: { from?: PlaceQ | null; to?: PlaceQ | null; truckId?: string }) => set((s) => {
    const q = { ...s.q[role] } as Record<string, unknown>;
    for (const [k, v] of Object.entries(patch)) q[k] = v === null ? undefined : v;
    return { ...s, q: { ...s.q, [role]: q } };
  }), [set]);
  const setClientF = useCallback((patch: Partial<TruckFilters>) => set((s) => ({ ...s, q: { ...s.q, client: { ...s.q.client, f: { ...s.q.client.f, ...patch } } } })), [set]);
  const setCarrierF = useCallback((patch: Partial<CargoFilters>) => set((s) => ({ ...s, q: { ...s.q, carrier: { ...s.q.carrier, f: { ...s.q.carrier.f, ...patch } } } })), [set]);
  const resetFilters = useCallback((role: Role) => set((s) => ({
    ...s,
    q: role === "client"
      ? { ...s.q, client: { ...s.q.client, f: { kinds: [], bodies: [], scope: "all", verifiedOnly: false, sort: s.q.client.f.sort } } }
      : { ...s.q, carrier: { ...s.q.carrier, f: { categories: [], customs: [], fitTruck: true, sort: s.q.carrier.f.sort } } },
  })), [set]);
  const addRecent = useCallback((id: string) => set((s) => ({ ...s, recent: [id, ...s.recent.filter((x) => x !== id)].slice(0, 5) })), [set]);

  const toggleSaved = useCallback(() => {
    const st = ref.current;
    const role = st.user.role;
    const q = st.q[role];
    const same = st.saved.find((x) => x.role === role && JSON.stringify(x.from) === JSON.stringify(q.from) && JSON.stringify(x.to) === JSON.stringify(q.to));
    set((s) => ({ ...s, saved: same ? s.saved.filter((x) => x.id !== same.id) : [...s.saved, { id: uid("sv"), role, from: q.from, to: q.to, at: Date.now() }] }));
    return !same;
  }, [set]);

  const markRead = useCallback((id: string) => set((s) => ({ ...s, notifs: upd(s.notifs, id, (n) => ({ ...n, read: true })) })), [set]);
  const markAllRead = useCallback(() => set((s) => ({ ...s, notifs: s.notifs.map((n) => (n.role === s.user.role ? { ...n, read: true } : n)) })), [set]);

  const register = useCallback((p: { role: Role; phone: string; name: string; company: string; carrierType: "driver" | "company" }) => set((s) => ({
    ...s,
    user: { ...s.user, registered: true, role: p.role, phone: p.phone, ...(p.role === "client" ? { clientName: p.name, company: p.company } : { carrierName: p.name, carrierType: p.carrierType }) },
    clients: p.role === "client" ? upd(s.clients, ME_CLIENT, (c) => ({ ...c, name: p.name, company: p.company || undefined, phone: p.phone })) : s.clients,
    drivers: p.role === "carrier" ? upd(s.drivers, "me-d1", (d) => ({ ...d, name: p.name, phone: p.phone })) : s.drivers,
    carriers: p.role === "carrier" ? upd(s.carriers, ME_CARRIER, (c) => ({ ...c, type: p.carrierType })) : s.carriers,
  })), [set]);
  const setRole = useCallback((role: Role) => set((s) => ({ ...s, user: { ...s.user, role } })), [set]);
  const setBigText = useCallback((v: boolean) => set((s) => ({ ...s, bigText: v })), [set]);
  const resetDemo = useCallback(() => {
    const fresh = seedState();
    const user = ref.current.user;
    dispatch({ t: "replace", state: { ...fresh, user } });
    ref.current = { ...fresh, user };
  }, []);
  const logout = useCallback(() => { const fresh = seedState(); dispatch({ t: "replace", state: fresh }); ref.current = fresh; }, []);

  /* ---------- live pop-ups (DAT-style alerts): new trucks for clients, new loads for carriers ---------- */
  useEffect(() => {
    const tick = () => {
      const st = ref.current;
      if (!st.user.registered || st.popped >= 4) return;
      if (st.user.role === "client") {
        const next = poolTrucks().find((p) => !st.trucks.some((x) => x.id === p.id));
        if (!next) return;
        const t = { ...next, postedAt: Date.now(), fresh: true };
        set((s) => ({ ...s, popped: s.popped + 1, trucks: [...s.trucks, t] }));
        later(9000, () => set((s) => ({ ...s, trucks: upd(s.trucks, t.id, (x) => ({ ...x, fresh: false })) })));
        const d = driverOf(st, t.driverId);
        const target = st.cargo.find((c) => isMeClient(c.clientId) && isOpen(c.status) && fit(t, c).level !== "none");
        if (target) notify("client", "match_truck", "Новая машина по вашей заявке", `${d.name} · ${t.make} · ${cityShort(t.at)} → ${route(target).split(" → ")[1]}`, `/truck/${t.id}`);
        else toast({ title: `Новая машина · ${cityShort(t.at)}`, body: `${d.name} · ${tons(t.capacity)}`, href: `/truck/${t.id}` });
      } else {
        const next = poolCargo().find((p) => !st.cargo.some((x) => x.id === p.id));
        if (!next) return;
        const c = { ...next, createdAt: Date.now(), log: [{ s: "published" as Status, at: Date.now() }], fresh: true };
        set((s) => ({ ...s, popped: s.popped + 1, cargo: [c, ...s.cargo] }));
        later(9000, () => set((s) => ({ ...s, cargo: upd(s.cargo, c.id, (x) => ({ ...x, fresh: false })) })));
        const mine = st.trucks.find((t) => isMeCarrier(t.carrierId) && t.state === "free" && fit(t, c).level !== "none");
        notify("carrier", "match_cargo", mine ? `Новый груз для ${mine.make} ${mine.model}` : "Новый груз", `${route(c)} · ${tons(c.weight)}${c.price ? ` · ${money(c.price)}` : ""}`, `/cargo/${c.id}`);
      }
    };
    const first = window.setTimeout(tick, 14000);
    const every = window.setInterval(tick, 40000);
    return () => { window.clearTimeout(first); window.clearInterval(every); };
  }, [later, notify, set, toast]);

  return useMemo(() => ({
    s, toasts, dismiss, toast, notify,
    register, setRole, setBigText, resetDemo, logout,
    setQuery, setClientF, setCarrierF, resetFilters, addRecent, toggleSaved,
    createCargo, proposeToTruck, choose, advance, rate,
    bid, answerProposal, postTruck, unpostTruck, updateTruck, addTruck, addDriver,
    openChat, send, readChat, markRead, markAllRead,
  }), [s, toasts, dismiss, toast, notify, register, setRole, setBigText, resetDemo, logout, setQuery, setClientF, setCarrierF, resetFilters, addRecent, toggleSaved,
    createCargo, proposeToTruck, choose, advance, rate, bid, answerProposal, postTruck, unpostTruck, updateTruck, addTruck, addDriver, openChat, send, readChat, markRead, markAllRead]);
}


type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const value = useStoreValue();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore outside StoreProvider");
  return v;
}

const noop = () => () => {};
/** The demo lives in the browser (localStorage), so screens render after hydration. */
export const useMounted = () => useSyncExternalStore(noop, () => true, () => false);
