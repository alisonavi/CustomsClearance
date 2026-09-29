"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useStore, route } from "@/lib/store";
import { clock } from "@/lib/format";
import { clientOf, driverOf } from "@/lib/match";
import { ME_CARRIER, ME_CLIENT } from "@/lib/types";
import { Avatar, Empty, Page, TopBar } from "@/components/ui";

export default function Chats() {
  const { s } = useStore();
  const role = s.user.role;
  const chats = s.chats
    .filter((c) => (role === "client" ? c.clientId === ME_CLIENT : c.carrierId === ME_CARRIER))
    .sort((a, b) => (b.msgs.at(-1)?.at ?? 0) - (a.msgs.at(-1)?.at ?? 0));
  return (
    <>
      <TopBar title="Сообщения" back={false} />
      <Page className="px-3 pb-10 pt-3">
        {chats.length ? (
          <ul className="overflow-hidden rounded-2xl border border-line bg-white">
            {chats.map((c) => {
              const name = role === "client" ? driverOf(s, c.driverId).name : clientOf(s, c.clientId).company ?? clientOf(s, c.clientId).name;
              const cargo = c.cargoId ? s.cargo.find((x) => x.id === c.cargoId) : undefined;
              const last = c.msgs.at(-1);
              const unread = c.unread[role];
              const typing = c.typing && c.typing !== role;
              return (
                <li key={c.id} className="border-b border-line last:border-0">
                  <Link href={`/chats/${c.id}`} className="flex items-center gap-3 px-4 py-3.5 active:bg-page">
                    <Avatar name={name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-lg font-semibold">{name}</span>
                        <span className="shrink-0 text-sm text-ink-3">{last ? clock(last.at) : ""}</span>
                      </div>
                      {cargo && <div className="truncate font-semibold text-brand-ink">{route(cargo)}</div>}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`truncate ${unread ? "font-semibold text-ink" : "text-ink-3"}`}>
                          {typing ? "печатает…" : last ? `${last.from === role ? "Вы: " : ""}${last.text}` : "Нет сообщений"}
                        </span>
                        {unread > 0 && <span className="grid h-6 min-w-6 shrink-0 place-items-center rounded-full bg-brand px-1.5 text-sm font-bold text-white">{unread}</span>}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty icon={<MessageCircle size={28} />} title="Сообщений пока нет" text={role === "client" ? "Напишите водителю из его карточки или из предложения." : "Напишите клиенту со страницы груза."} />
        )}
      </Page>
    </>
  );
}
