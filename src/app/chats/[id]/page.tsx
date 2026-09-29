"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Phone, SendHorizontal } from "lucide-react";
import { useStore } from "@/lib/store";
import { city, client, clock, driver, money } from "@/lib/data";
import { Bar, Empty, Plate } from "@/components/ui";

const QUICK = {
  client: ["Где вы сейчас?", "Документы готовы", "Во сколько будете на погрузке?"],
  driver: ["Выезжаю на погрузку", "Прошёл границу", "Буду через час"],
};

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const { state, send, readChat, toast } = useStore();
  const chat = state.chats.find((c) => c.id === id);
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    readChat(id);
    return () => readChat(null);
  }, [id, readChat]);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat?.msgs.length, chat?.typing]);

  if (!chat) return (<><Bar title="Чат" /><div className="mx-auto max-w-xl p-4"><Empty title="Чат не найден" body="Вернитесь к списку чатов." href="/chats" cta="К чатам" /></div></>);

  const isDriverPeer = chat.role === "client";
  const d = isDriverPeer ? driver(chat.peerId) : null;
  const k = !isDriverPeer ? client(chat.peerId) : null;
  const submit = (t: string) => { if (!t.trim()) return; send(chat.id, t); setText(""); };

  return (
    <main className="flex min-h-dvh flex-col">
      <Bar
        title={d ? d.name : k!.company}
        sub={d ? d.truck : k!.name}
        right={
          <button onClick={() => toast({ title: "Демо-режим", body: "Звонки появятся вместе с бэкендом." })} aria-label="Позвонить" className="grid size-10 place-items-center rounded-[4px] bg-black/20 active:bg-black/35">
            <Phone size={20} />
          </button>
        }
      />
      {chat.subject && (
        <div className="sticky top-[64px] z-20 border-b border-line bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-2.5">
            <div className="min-w-0">
              <div className="truncate font-display text-[19px] font-extrabold uppercase leading-none">{city(chat.subject.from)} → {city(chat.subject.to)}</div>
              <div className="mt-0.5 text-[13px] font-semibold text-ink-3">{money(chat.subject.price)}</div>
            </div>
            {d && <Plate plate={d.plate} />}
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-xl flex-1 px-3 pb-44 pt-4">
        <ul className="flex flex-col gap-2">
          {chat.msgs.map((m) =>
            m.from === "system" ? (
              <li key={m.id} className="my-2 self-center rounded-[3px] border-2 border-ink bg-signal px-3 py-1.5 text-center text-[13px] font-extrabold">
                {m.text}
              </li>
            ) : (
              <li key={m.id} className={`toast-in max-w-[82%] rounded-[6px] px-3.5 py-2 text-[15.5px] leading-snug ${m.from === "me" ? "self-end rounded-br-[2px] bg-ink text-white" : "self-start rounded-bl-[2px] border border-line bg-white"}`}>
                {m.text}
                <span className={`ml-2 inline-block translate-y-0.5 text-[11px] ${m.from === "me" ? "text-white/60" : "text-ink-3"}`}>{clock(m.at)}</span>
              </li>
            ),
          )}
          {chat.typing && (
            <li className="typing self-start rounded-[6px] rounded-bl-[2px] border border-line bg-white px-3.5 py-3" aria-label="печатает">
              <span className="inline-block size-2 rounded-full bg-ink-3" /> <span className="inline-block size-2 rounded-full bg-ink-3" /> <span className="inline-block size-2 rounded-full bg-ink-3" />
            </li>
          )}
        </ul>
        <div ref={end} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[max(10px,env(safe-area-inset-bottom))] backdrop-blur-md">
        <div className="mx-auto max-w-xl">
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 pt-2.5">
            {QUICK[chat.role].map((q) => (
              <button key={q} onClick={() => submit(q)} className="shrink-0 rounded-[4px] border-2 border-line px-2.5 py-1.5 text-[13.5px] font-bold text-ink-2 active:border-ink">{q}</button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); submit(text); }} className="flex items-center gap-2 px-3 pt-2.5">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Сообщение"
              className="h-12 min-w-0 flex-1 rounded-[4px] border-2 border-line bg-white px-3 text-[16px] outline-none placeholder:text-ink-3 focus:border-ink"
            />
            <button aria-label="Отправить" disabled={!text.trim()} className="grid size-12 shrink-0 place-items-center rounded-[4px] border-2 border-ink bg-signal active:bg-signal-deep disabled:opacity-40">
              <SendHorizontal size={22} />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
