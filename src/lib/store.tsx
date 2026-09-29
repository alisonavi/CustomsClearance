"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "react";
import {
  CLIENT_REPLIES, DRIVER_REPLIES, DRIVERS, CLIENTS, OFFER_NOTES, poolCargo, poolTrucks, seedCargo, seedChats, seedTrucks,
  sealCode, uid, money, city, km,
  type Cargo, type Chat, type CityId, type Invite, type Msg, type Offer, type Role, type Truck,
} from "./data";

type State = { role: Role; cargo: Cargo[]; trucks: Truck[]; chats: Chat[]; popped: number };
export type Toast = { id: string; title: string; body: string; href?: string; tone?: "seal" | "info" };

type Action =
  | { t: "role"; role: Role }
  | { t: "reset"; state: State }
  | { t: "cargo"; id: string; patch: (c: Cargo) => Cargo }
  | { t: "truck"; id: string; patch: (x: Truck) => Truck }
  | { t: "addCargo"; cargo: Cargo }
  | { t: "addTruck"; truck: Truck }
  | { t: "removeTruck"; id: string }
  | { t: "chat"; id: string; patch: (c: Chat) => Chat }
  | { t: "addChat"; chat: Chat }
  | { t: "popped" };

function reducer(s: State, a: Action): State {
  switch (a.t) {
    case "role": return { ...s, role: a.role };
    case "reset": return a.state;
    case "cargo": return { ...s, cargo: s.cargo.map((c) => (c.id === a.id ? a.patch(c) : c)) };
    case "truck": return { ...s, trucks: s.trucks.map((x) => (x.id === a.id ? a.patch(x) : x)) };
    case "addCargo": return { ...s, cargo: [a.cargo, ...s.cargo] };
    case "addTruck": return { ...s, trucks: [a.truck, ...s.trucks] };
    case "removeTruck": return { ...s, trucks: s.trucks.filter((x) => x.id !== a.id) };
    case "chat": return { ...s, chats: s.chats.map((c) => (c.id === a.id ? a.patch(c) : c)) };
    case "addChat": return { ...s, chats: [a.chat, ...s.chats] };
    case "popped": return { ...s, popped: s.popped + 1 };
  }
}

const KEY = "keruen-demo-v1";
const fresh = (): State => ({ role: "client", cargo: seedCargo(), trucks: seedTrucks(), chats: seedChats(), popped: 0 });
function load(): State {
  if (typeof window === "undefined") return fresh();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch {}
  return fresh();
}

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const round10k = (n: number) => Math.round(n / 10000) * 10000;

function useStoreValue() {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const ref = useRef(state);
  const activeChat = useRef<string | null>(null);
  useEffect(() => {
    ref.current = state;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  const later = useCallback((ms: number, fn: () => void) => { window.setTimeout(fn, ms); }, []);

  const toast = useCallback((x: Omit<Toast, "id">) => {
    const id = uid("t");
    setToasts((all) => [{ ...x, id }, ...all].slice(0, 3));
    window.setTimeout(() => setToasts((all) => all.filter((y) => y.id !== id)), 5200);
  }, []);
  const dismiss = useCallback((id: string) => setToasts((all) => all.filter((y) => y.id !== id)), []);

  const msg = (from: Msg["from"], text: string): Msg => ({ id: uid("m"), from, text, at: Date.now() });

  /** Find or create the chat between my current persona and a peer. */
  const openChat = useCallback((role: Role, peerId: string, subject?: Chat["subject"], system?: string) => {
    const found = ref.current.chats.find((c) => c.role === role && c.peerId === peerId);
    if (found) {
      if (system) dispatch({ t: "chat", id: found.id, patch: (c) => ({ ...c, subject: subject ?? c.subject, msgs: [...c.msgs, msg("system", system)] }) });
      return found.id;
    }
    const chat: Chat = { id: uid("ch"), role, peerId, subject, unread: 0, msgs: system ? [msg("system", system)] : [] };
    dispatch({ t: "addChat", chat });
    return chat.id;
  }, []);

  const peerSays = useCallback((chatId: string, text: string, delay: number) => {
    later(Math.max(300, delay - 1400), () => dispatch({ t: "chat", id: chatId, patch: (c) => ({ ...c, typing: true }) }));
    later(delay, () => {
      const here = activeChat.current === chatId;
      dispatch({ t: "chat", id: chatId, patch: (c) => ({ ...c, typing: false, unread: here ? 0 : c.unread + 1, msgs: [...c.msgs, msg("peer", text)] }) });
      if (!here) {
        const c = ref.current.chats.find((x) => x.id === chatId);
        const name = c ? (c.role === "client" ? DRIVERS.find((d) => d.id === c.peerId)?.name : CLIENTS.find((k) => k.id === c.peerId)?.company) : "";
        toast({ title: name ?? "Новое сообщение", body: text, href: `/chats/${chatId}` });
      }
    });
  }, [later, toast]);

  /* ---------- client actions ---------- */

  const postCargo = useCallback((c: Omit<Cargo, "id" | "at" | "offers" | "status" | "mine" | "clientId">) => {
    const cargo: Cargo = { ...c, id: uid("c"), at: Date.now(), offers: [], status: "open", mine: true, clientId: "me-client" };
    dispatch({ t: "addCargo", cargo });
    const drivers = DRIVERS.filter((d) => d.id !== "me-driver").sort(() => Math.random() - 0.5).slice(0, 3);
    const deltas = [0, 0.07, -0.04];
    drivers.forEach((d, i) => {
      later(3500 + i * 5000, () => {
        const offer: Offer = { id: uid("o"), driverId: d.id, price: round10k(cargo.price * (1 + deltas[i])), note: pick(OFFER_NOTES), at: Date.now() };
        dispatch({ t: "cargo", id: cargo.id, patch: (x) => (x.status === "open" ? { ...x, offers: [offer, ...x.offers] } : x) });
        toast({ title: `${d.name} · ${money(offer.price)}`, body: `Предложение на ${city(cargo.from)} → ${city(cargo.to)}`, href: `/cargo/${cargo.id}` });
      });
    });
    return cargo.id;
  }, [later, toast]);

  const acceptOffer = useCallback((cargoId: string, offerId: string) => {
    const c = ref.current.cargo.find((x) => x.id === cargoId);
    const o = c?.offers.find((x) => x.id === offerId);
    if (!c || !o) return;
    const seal = sealCode();
    dispatch({ t: "cargo", id: cargoId, patch: (x) => ({ ...x, status: "sealed", dealDriverId: o.driverId, dealPrice: o.price, seal }) });
    const chatId = openChat("client", o.driverId, { from: c.from, to: c.to, price: o.price }, `Сделка опломбирована · ${seal} · ${money(o.price)}`);
    peerSays(chatId, "Спасибо, что выбрали меня! Выезжаю на погрузку, пришлите точный адрес склада.", 3200);
    return chatId;
  }, [openChat, peerSays]);

  const inviteTruck = useCallback((truckId: string, cargoId: string) => {
    const tr = ref.current.trucks.find((x) => x.id === truckId);
    const c = ref.current.cargo.find((x) => x.id === cargoId);
    if (!tr || !c) return;
    dispatch({ t: "truck", id: truckId, patch: (x) => ({ ...x, sent: { cargoId, status: "pending" } }) });
    later(4200, () => {
      const seal = sealCode();
      dispatch({ t: "truck", id: truckId, patch: (x) => ({ ...x, sent: { cargoId, status: "accepted" } }) });
      dispatch({ t: "cargo", id: cargoId, patch: (x) => ({ ...x, status: "sealed", dealDriverId: tr.driverId, dealPrice: x.price, seal }) });
      const chatId = openChat("client", tr.driverId, { from: c.from, to: c.to, price: c.price }, `Сделка опломбирована · ${seal} · ${money(c.price)}`);
      const d = DRIVERS.find((x) => x.id === tr.driverId);
      toast({ title: `${d?.name ?? "Водитель"} принял груз`, body: `${city(c.from)} → ${city(c.to)} · ${money(c.price)}`, href: `/truck/${truckId}`, tone: "seal" });
      peerSays(chatId, "Добрый день! Груз беру. Во сколько можно подъехать на погрузку?", 2600);
    });
  }, [later, openChat, peerSays, toast]);

  /* ---------- driver actions ---------- */

  const postTruck = useCallback((x: Omit<Truck, "id" | "at" | "invites" | "mine" | "driverId">) => {
    const truck: Truck = { ...x, id: uid("tr"), at: Date.now(), invites: [], mine: true, driverId: "me-driver" };
    dispatch({ t: "addTruck", truck });
    later(6000, () => {
      const cl = pick(CLIENTS.filter((k) => k.id !== "me-client"));
      const to: CityId = truck.to[0] ?? "almaty";
      const weight = Math.max(5, Math.min(truck.capacity, 18));
      const inv: Invite = {
        id: uid("i"), clientId: cl.id, from: truck.from, to, what: pick(["Бытовая техника", "Плитка на паллетах", "Автошины", "Текстиль в тюках"]),
        weight, price: round10k(Math.max(150000, truck.rateType === "km" ? km(truck.from, to) * truck.rate * 1.03 : truck.rate)),
        status: "new", at: Date.now(),
      };
      dispatch({ t: "truck", id: truck.id, patch: (y) => ({ ...y, invites: [inv, ...y.invites] }) });
      toast({ title: `${cl.company} предлагает груз`, body: `${city(inv.from)} → ${city(inv.to)} · ${weight} т · ${money(inv.price)}`, href: `/truck/${truck.id}` });
    });
    return truck.id;
  }, [later, toast]);

  const answerInvite = useCallback((truckId: string, inviteId: string, accept: boolean) => {
    const tr = ref.current.trucks.find((x) => x.id === truckId);
    const inv = tr?.invites.find((i) => i.id === inviteId);
    if (!tr || !inv) return;
    dispatch({ t: "truck", id: truckId, patch: (x) => ({ ...x, invites: x.invites.map((i) => (i.id === inviteId ? { ...i, status: accept ? "accepted" : "declined" } : i)) }) });
    if (!accept) return;
    const chatId = openChat("driver", inv.clientId, { from: inv.from, to: inv.to, price: inv.price }, `Сделка опломбирована · ${sealCode()} · ${money(inv.price)}`);
    peerSays(chatId, "Отлично! Погрузка завтра с 9:00, адрес склада пришлю сюда.", 2800);
    return chatId;
  }, [openChat, peerSays]);

  const placeBid = useCallback((cargoId: string, price: number) => {
    const c = ref.current.cargo.find((x) => x.id === cargoId);
    if (!c) return;
    dispatch({ t: "cargo", id: cargoId, patch: (x) => ({ ...x, bid: { price, status: "pending" } }) });
    later(4000, () => {
      const ok = price <= c.price * 1.1;
      const cl = CLIENTS.find((k) => k.id === c.clientId);
      if (!ok) {
        dispatch({ t: "cargo", id: cargoId, patch: (x) => ({ ...x, bid: { price, status: "declined" } }) });
        toast({ title: `${cl?.company ?? "Клиент"} выбрал другое предложение`, body: `${city(c.from)} → ${city(c.to)}. Попробуйте цену ближе к ${money(c.price)}`, href: `/cargo/${cargoId}` });
        return;
      }
      const seal = sealCode();
      dispatch({ t: "cargo", id: cargoId, patch: (x) => ({ ...x, status: "sealed", dealDriverId: "me-driver", dealPrice: price, seal, bid: { price, status: "accepted" } }) });
      const chatId = openChat("driver", c.clientId, { from: c.from, to: c.to, price }, `Сделка опломбирована · ${seal} · ${money(price)}`);
      toast({ title: `${cl?.company ?? "Клиент"} принял вашу цену`, body: `${city(c.from)} → ${city(c.to)} · ${money(price)}`, href: `/cargo/${cargoId}`, tone: "seal" });
      peerSays(chatId, "Здравствуйте! Подтверждаю. Когда будете на погрузке?", 3000);
    });
  }, [later, openChat, peerSays, toast]);

  /* ---------- chat ---------- */

  const send = useCallback((chatId: string, text: string) => {
    const c = ref.current.chats.find((x) => x.id === chatId);
    if (!c || !text.trim()) return;
    dispatch({ t: "chat", id: chatId, patch: (x) => ({ ...x, msgs: [...x.msgs, msg("me", text.trim())] }) });
    const mine = c.msgs.filter((m) => m.from === "me").length;
    const pool = c.role === "client" ? DRIVER_REPLIES : CLIENT_REPLIES;
    peerSays(chatId, pool[mine % pool.length], 2400 + Math.random() * 1200);
  }, [peerSays]);

  const readChat = useCallback((id: string | null) => {
    activeChat.current = id;
    if (id) dispatch({ t: "chat", id, patch: (c) => (c.unread ? { ...c, unread: 0 } : c) });
  }, []);

  /* ---------- ambient "pop-ups": new trucks for clients, new cargo for drivers ---------- */
  useEffect(() => {
    const tick = () => {
      const s = ref.current;
      if (s.popped >= 3) return;
      if (s.role === "client") {
        const next = poolTrucks().find((p) => !s.trucks.some((x) => x.id === p.id));
        if (!next) return;
        dispatch({ t: "addTruck", truck: { ...next, at: Date.now(), fresh: true } });
        const d = DRIVERS.find((x) => x.id === next.driverId);
        toast({ title: `Новая машина · ${city(next.from)}`, body: `${d?.name ?? ""} · ${next.capacity} т · едет в ${next.to.map(city).join(", ")}`, href: `/truck/${next.id}` });
      } else {
        const next = poolCargo().find((p) => !s.cargo.some((x) => x.id === p.id));
        if (!next) return;
        dispatch({ t: "addCargo", cargo: { ...next, at: Date.now(), fresh: true } });
        toast({ title: `Новый груз · ${city(next.from)} → ${city(next.to)}`, body: `${next.what} · ${next.weight} т · ${money(next.price)}`, href: `/cargo/${next.id}` });
      }
      dispatch({ t: "popped" });
    };
    const first = window.setTimeout(tick, 9000);
    const every = window.setInterval(tick, 28000);
    return () => { window.clearTimeout(first); window.clearInterval(every); };
  }, [toast]);

  const setRole = useCallback((role: Role) => dispatch({ t: "role", role }), []);
  const reset = useCallback(() => dispatch({ t: "reset", state: fresh() }), []);
  const removeTruck = useCallback((id: string) => dispatch({ t: "removeTruck", id }), []);

  return useMemo(() => ({
    state, toasts, dismiss, toast, setRole, reset, postCargo, acceptOffer, inviteTruck, postTruck, answerInvite, placeBid, removeTruck, openChat, send, readChat,
  }), [state, toasts, dismiss, toast, setRole, reset, postCargo, acceptOffer, inviteTruck, postTruck, answerInvite, placeBid, removeTruck, openChat, send, readChat]);
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
/** true only after hydration — the demo lives in the browser, so we render it client-side. */
export const useMounted = () => useSyncExternalStore(noop, () => true, () => false);
