"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Phone, SendHorizontal } from "lucide-react";
import { useStore, route } from "@/lib/store";
import { STATUS } from "@/lib/catalog";
import { clock, money } from "@/lib/format";
import { clientOf, driverOf } from "@/lib/match";
import { Empty, Page, TopBar } from "@/components/ui";

const QUICK = {
  client: ["Где вы сейчас?", "Документы готовы", "Во сколько будете на загрузке?"],
  carrier: ["Выезжаю на загрузку", "Прошёл границу", "Буду через час"],
};

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const { s, send, readChat, toast } = useStore();
  const chat = s.chats.find((c) => c.id === id);
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const role = s.user.role;

  useEffect(() => { readChat(id); return () => readChat(null); }, [id, readChat, role]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [chat?.msgs.length, chat?.typing]);

  if (!chat) return (<><TopBar title="Сообщения" /><Page className="p-4"><Empty title="Чат не найден" /></Page></>);
  const d = driverOf(s, chat.driverId);
  const k = clientOf(s, chat.clientId);
  const peer = role === "client" ? d.name : k.company ?? k.name;
  const cargo = chat.cargoId ? s.cargo.find((x) => x.id === chat.cargoId) : undefined;
  const submit = (t: string) => { if (!t.trim()) return; send(chat.id, t); setText(""); };
  const typing = chat.typing && chat.typing !== role;

  return (
    <main className="flex min-h-dvh flex-col bg-page">
      <TopBar title={peer} right={
        <button onClick={() => toast({ title: "Звонок в демо-версии не совершается", body: peer })} aria-label={`Позвонить: ${peer}`} className="grid size-11 place-items-center rounded-xl text-brand active:bg-brand-soft"><Phone size={24} /></button>
      } />
      {cargo && (
        <Link href={`/cargo/${cargo.id}`} className="sticky top-15 z-20 block border-b border-line bg-white">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-2.5">
            <div className="min-w-0"><div className="truncate font-bold">{route(cargo)}</div><div className="text-ink-3">{cargo.deal ? STATUS[cargo.status] : "Идёт обсуждение"}</div></div>
            {(cargo.deal?.price ?? cargo.price) ? <div className="shrink-0 font-bold tnum">{money((cargo.deal?.price ?? cargo.price)!)}</div> : null}
          </div>
        </Link>
      )}
      <div className="mx-auto w-full max-w-xl flex-1 px-3 pb-44 pt-4">
        <ul className="flex flex-col gap-2">
          {chat.msgs.map((m) =>
            m.from === "system" ? (
              <li key={m.id} className="my-2 self-center rounded-full bg-brand-soft px-4 py-1.5 text-center font-semibold text-brand-ink">{m.text}</li>
            ) : (
              <li key={m.id} className={`toast-in max-w-[85%] rounded-2xl px-4 py-2.5 text-lg leading-snug ${m.from === role ? "self-end rounded-br-md bg-brand text-white" : "self-start rounded-bl-md border border-line bg-white"}`}>
                {m.text}
                <span className={`ml-2 inline-block translate-y-0.5 text-xs ${m.from === role ? "text-white/75" : "text-ink-3"}`}>{clock(m.at)}</span>
              </li>
            ),
          )}
          {typing && (
            <li className="typing self-start rounded-2xl rounded-bl-md border border-line bg-white px-4 py-3.5" aria-label="печатает">
              <span className="inline-block size-2.5 rounded-full bg-ink-3" /> <span className="inline-block size-2.5 rounded-full bg-ink-3" /> <span className="inline-block size-2.5 rounded-full bg-ink-3" />
            </li>
          )}
        </ul>
        <div ref={end} />
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[max(10px,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-xl">
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 pt-3">
            {QUICK[role].map((q) => <button key={q} onClick={() => submit(q)} className="h-11 shrink-0 rounded-full border-2 border-line px-4 font-semibold text-ink-2 active:border-brand">{q}</button>)}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); submit(text); }} className="flex items-center gap-2 px-3 pt-3">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Сообщение" aria-label="Текст сообщения" className="h-14 min-w-0 flex-1 rounded-2xl border-2 border-line-2 bg-white px-4 text-lg outline-none focus:border-brand" />
            <button aria-label="Отправить" disabled={!text.trim()} className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand text-white active:bg-brand-press disabled:bg-[#aebfe0]"><SendHorizontal size={24} /></button>
          </form>
        </div>
      </div>
    </main>
  );
}
