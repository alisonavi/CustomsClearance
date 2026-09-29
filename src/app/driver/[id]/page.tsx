"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { BODIES, RATE_CARRIER } from "@/lib/catalog";
import { count } from "@/lib/format";
import { criteria, tons } from "@/lib/match";
import { ME_CLIENT } from "@/lib/types";
import { Avatar, Button, Card, Empty, H2, Page, Pill, Stars, TopBar, TruckArt } from "@/components/ui";
import { Reviews, Breakdown } from "@/components/reviews";

/** Spec §10: driver card. */
export default function DriverPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { s, openChat, toast } = useStore();
  const d = s.drivers.find((x) => x.id === id);
  if (!d) return (<><TopBar title="Водитель" /><Page className="p-4"><Empty title="Водитель не найден" /></Page></>);
  const trucks = s.trucks.filter((t) => t.driverId === d.id);
  return (
    <>
      <TopBar title="Водитель" />
      <Page className="px-3 pb-10 pt-3">
        <Card className="p-5 text-center">
          <div className="flex justify-center"><Avatar name={d.name} size="lg" /></div>
          <h1 className="mt-3 text-2xl font-bold">{d.name}</h1>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {d.verified && <Pill tone="ok"><ShieldCheck size={15} aria-hidden /> Телефон подтверждён</Pill>}
            <Pill>Стаж {count(d.years, ["год", "года", "лет"])}</Pill>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-left">
            <div className="rounded-xl bg-page px-4 py-3"><div className="text-ink-3">Рейтинг</div><div className="text-2xl font-bold">{d.rating.toFixed(1).replace(".", ",")} <span className="text-lg font-semibold text-ink-3">/ 5</span></div></div>
            <div className="rounded-xl bg-page px-4 py-3"><div className="text-ink-3">Перевозок</div><div className="text-2xl font-bold">{d.trips}</div></div>
          </div>
          {s.user.role === "client" && <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => toast({ title: "Звонок в демо-версии не совершается", body: d.name })}><Phone size={22} /> Позвонить</Button>
            <Button variant="secondary" onClick={() => router.push(`/chats/${openChat(ME_CLIENT, d.id)}`)}><MessageCircle size={22} /> Написать</Button>
          </div>}
        </Card>

        <H2>Основные направления</H2>
        <div className="flex flex-wrap gap-2">{d.directions.map((x) => <Pill key={x} tone="brand" className="py-2 text-base">{x}</Pill>)}</div>

        <H2>Транспорт</H2>
        <div className="grid gap-3">
          {trucks.map((t) => (
            <Link key={t.id} href={`/truck/${t.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 active:bg-page">
              <span className="w-24 shrink-0"><TruckArt body={t.body} kind={t.kind} /></span>
              <span className="min-w-0">
                <span className="block text-lg font-semibold">{BODIES[t.body].name}, {tons(t.capacity)}</span>
                <span className="block text-ink-3">{t.make} {t.model}, {t.year}</span>
              </span>
            </Link>
          ))}
        </div>

        <H2 right={<Stars value={d.rating} count={d.ratingCount} />}>Оценки клиентов</H2>
        <Card className="p-4"><Breakdown labels={RATE_CARRIER} values={criteria(d.reviews, RATE_CARRIER.length)} empty={!d.reviews.length} /></Card>
        <H2>Отзывы</H2>
        <Reviews reviews={d.reviews} labels={RATE_CARRIER} />
      </Page>
    </>
  );
}
