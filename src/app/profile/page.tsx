"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, History, LogOut, Package, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { useStore } from "@/lib/store";
import { RATE_CARRIER, RATE_CLIENT } from "@/lib/catalog";
import { count } from "@/lib/format";
import { criteria } from "@/lib/match";
import { ME_CLIENT } from "@/lib/types";
import { Avatar, Button, Card, H2, Option, Page, Pill, Stars, Toggle, TopBar } from "@/components/ui";
import { Breakdown } from "@/components/reviews";

export default function Profile() {
  const { s, setRole, setBigText, resetDemo, logout, toast } = useStore();
  const router = useRouter();
  const role = s.user.role;
  const me = role === "client" ? s.clients.find((c) => c.id === ME_CLIENT)! : s.drivers.find((d) => d.id === "me-d1")!;
  const name = role === "client" ? s.user.clientName : s.user.carrierName;
  const labels = role === "client" ? RATE_CLIENT : RATE_CARRIER;
  const deals = role === "client" ? (me as typeof s.clients[number]).deals : (me as typeof s.drivers[number]).trips;
  return (
    <>
      <TopBar title="Профиль" back={false} />
      <Page className="px-3 pb-10 pt-3">
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <Avatar name={name} size="lg" />
            <div className="min-w-0">
              <div className="text-2xl font-bold leading-tight">{name}</div>
              <div className="text-lg text-ink-2">{role === "client" ? s.user.company || "Частное лицо" : s.user.carrierType === "company" ? "Транспортная компания" : "Водитель"}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-ink-3">{s.user.phone || "+7 700 000 00 00"} <Pill tone="ok"><ShieldCheck size={15} aria-hidden /> Подтверждён</Pill></div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-page px-4 py-3"><div className="text-ink-3">Рейтинг</div><div className="text-2xl font-bold"><Stars value={me.rating} size={20} /></div></div>
            <div className="rounded-xl bg-page px-4 py-3"><div className="text-ink-3">Перевозок</div><div className="text-2xl font-bold">{deals}</div></div>
          </div>
        </Card>

        <H2>Я сейчас</H2>
        <div className="grid gap-2" role="radiogroup">
          <Option selected={role === "client"} onClick={() => { setRole("client"); toast({ title: "Режим клиента", body: "Ищите машины и размещайте заявки." }); }} icon={<Package size={26} />} title="Клиент" hint="Мне нужно перевезти груз" />
          <Option selected={role === "carrier"} onClick={() => { setRole("carrier"); toast({ title: "Режим перевозчика", body: "Ищите грузы для своих машин." }); }} icon={<Truck size={26} />} title="Перевозчик" hint="У меня есть грузовик" />
        </div>

        <H2 right={<span className="text-ink-3">{count(me.ratingCount, ["оценка", "оценки", "оценок"])}</span>}>{role === "client" ? "Как меня оценивают перевозчики" : "Как меня оценивают клиенты"}</H2>
        <Card className="p-4"><Breakdown labels={labels} values={criteria(me.reviews, labels.length)} empty={!me.reviews.length} /></Card>

        <H2>Удобство</H2>
        <Card className="px-4 py-2">
          <Toggle checked={s.bigText} onChange={setBigText} label="Крупный текст" hint="Всё станет крупнее — удобно, если плохо видно" />
          <div className="border-t border-line py-3"><div className="text-lg font-semibold">Язык</div><div className="text-ink-3">Русский. Казахский и китайский — в следующих версиях.</div></div>
        </Card>

        <H2>Ещё</H2>
        <Card className="divide-y divide-line">
          <Link href="/orders" className="flex items-center gap-3 p-4 text-lg font-semibold active:bg-page"><History size={24} className="text-brand" /> История перевозок <ChevronRight className="ml-auto text-ink-3" /></Link>
          <Link href="/notifications" className="flex items-center gap-3 p-4 text-lg font-semibold active:bg-page"><ShieldCheck size={24} className="text-brand" /> Уведомления <ChevronRight className="ml-auto text-ink-3" /></Link>
        </Card>

        <H2>Демо-версия</H2>
        <Card className="p-4">
          <p className="text-ink-2">Все люди, компании, машины, цены и отзывы выдуманы. Данные хранятся только в этом браузере. Переключайте «Клиент / Перевозчик», чтобы увидеть обе стороны сделки.</p>
          <div className="mt-4 grid gap-2">
            <Button variant="outline" full onClick={() => { resetDemo(); toast({ title: "Демо сброшено", body: "Вернули исходные грузы, машины и сообщения." }); }}><RotateCcw size={20} /> Сбросить демо-данные</Button>
            <Button variant="danger" full onClick={() => { logout(); router.replace("/welcome"); }}><LogOut size={20} /> Выйти</Button>
          </div>
        </Card>
      </Page>
    </>
  );
}
