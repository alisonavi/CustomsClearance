"use client";

import { useRouter } from "next/navigation";
import { Bell, CalendarClock, CheckCircle2, MessageCircle, Package, ShieldCheck, Star, Tag, Truck, XCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { ago } from "@/lib/format";
import type { NotifKind } from "@/lib/types";
import { Empty, Page, TopBar } from "@/components/ui";

const ICON: Record<NotifKind, React.ReactNode> = {
  match_cargo: <Package size={22} />, match_truck: <Truck size={22} />, offer: <Tag size={22} />, accepted: <CheckCircle2 size={22} />, declined: <XCircle size={22} />,
  status: <Truck size={22} />, message: <MessageCircle size={22} />, loading_soon: <CalendarClock size={22} />, proposal: <Package size={22} />, rate: <Star size={22} />, verified: <ShieldCheck size={22} />,
};

/** Spec §15. */
export default function Notifications() {
  const { s, markRead, markAllRead } = useStore();
  const router = useRouter();
  const list = s.notifs.filter((n) => n.role === s.user.role).sort((a, b) => b.at - a.at);
  const unread = list.filter((n) => !n.read).length;
  return (
    <>
      <TopBar title="Уведомления" right={unread ? <button onClick={markAllRead} className="h-11 rounded-xl px-2 font-semibold text-brand active:bg-brand-soft">Прочитать все</button> : undefined} />
      <Page className="px-3 pb-10 pt-3">
        {list.length ? (
          <ul className="overflow-hidden rounded-2xl border border-line bg-white">
            {list.map((n) => (
              <li key={n.id} className="border-b border-line last:border-0">
                <button onClick={() => { markRead(n.id); router.push(n.href); }} className={`flex w-full items-start gap-3 px-4 py-4 text-left active:bg-page ${n.read ? "" : "bg-brand-soft/50"}`}>
                  <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${n.read ? "bg-page text-ink-3" : "bg-brand text-white"}`}>{ICON[n.kind]}</span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-lg leading-snug ${n.read ? "font-semibold" : "font-bold"}`}>{n.title}</span>
                    <span className="block text-ink-2">{n.body}</span>
                    <span className="mt-0.5 block text-sm text-ink-3">{ago(n.at)}</span>
                  </span>
                  {!n.read && <span className="mt-2 size-3 shrink-0 rounded-full bg-brand" aria-label="Новое" />}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <Empty icon={<Bell size={28} />} title="Уведомлений нет" text="Здесь появятся новые предложения, подходящие грузы и машины, сообщения и изменения статуса." />
        )}
      </Page>
    </>
  );
}
