"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { city, client, clock, driver, money } from "@/lib/data";
import { Avatar, Bar, Empty } from "@/components/ui";

export default function Chats() {
  const { state } = useStore();
  const chats = state.chats
    .filter((c) => c.role === state.role)
    .sort((a, b) => (b.msgs.at(-1)?.at ?? 0) - (a.msgs.at(-1)?.at ?? 0));
  return (
    <main>
      <Bar title="Чаты" sub={state.role === "client" ? "С водителями" : "С клиентами"} back={false} />
      <div className="mx-auto max-w-xl px-3 pt-3">
        {chats.length ? (
          <ul className="overflow-hidden rounded-[3px] border border-line bg-white">
            {chats.map((c) => {
              const name = c.role === "client" ? driver(c.peerId).name : client(c.peerId).company;
              const last = c.msgs.at(-1);
              return (
                <li key={c.id} className="border-b border-line last:border-0">
                  <Link href={`/chats/${c.id}`} className="flex items-center gap-3 px-3.5 py-3 active:bg-yard">
                    <Avatar name={name} kind={c.role === "client" ? "driver" : "client"} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[16px] font-bold">{name}</span>
                        <span className="shrink-0 text-[12px] text-ink-3">{last ? clock(last.at) : ""}</span>
                      </div>
                      {c.subject && (
                        <div className="truncate font-display text-[15px] font-bold uppercase text-oxide">
                          {city(c.subject.from)} → {city(c.subject.to)} · {money(c.subject.price)}
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`truncate text-[14px] ${c.unread ? "font-semibold text-ink" : "text-ink-3"}`}>
                          {c.typing ? "печатает…" : last ? `${last.from === "me" ? "Вы: " : ""}${last.text}` : "Нет сообщений"}
                        </span>
                        {c.unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-oxide px-1.5 text-[11.5px] font-extrabold text-white">{c.unread}</span>}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty title="Чатов пока нет" body="Чат открывается, когда вы пишете водителю или клиенту либо заключаете сделку." />
        )}
      </div>
    </main>
  );
}
