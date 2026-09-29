"use client";

import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { RATE_CLIENT, isOpen } from "@/lib/catalog";
import { count } from "@/lib/format";
import { criteria } from "@/lib/match";
import { CargoCard } from "@/components/cards";
import { Avatar, Card, Empty, H2, Page, Pill, Stars, TopBar, Verified } from "@/components/ui";
import { Breakdown, Reviews } from "@/components/reviews";

/** Client profile — what a carrier checks before taking a load (DAT-style company card). */
export default function ClientPage() {
  const { id } = useParams<{ id: string }>();
  const { s } = useStore();
  const k = s.clients.find((x) => x.id === id);
  if (!k) return (<><TopBar title="Клиент" /><Page className="p-4"><Empty title="Клиент не найден" /></Page></>);
  const open = s.cargo.filter((c) => c.clientId === k.id && isOpen(c.status));
  return (
    <>
      <TopBar title="Клиент" />
      <Page className="px-3 pb-10 pt-3">
        <Card className="p-5 text-center">
          <div className="flex justify-center"><Avatar name={k.company ?? k.name} size="lg" /></div>
          <h1 className="mt-3 text-2xl font-bold">{k.company ?? k.name}</h1>
          {k.company && <p className="text-lg text-ink-2">{k.name}</p>}
          <div className="mt-2 flex flex-wrap justify-center gap-2"><Verified ok={k.verified} text="Компания проверена" /><Pill>На платформе {count(k.years, ["год", "года", "лет"])}</Pill></div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-left">
            <div className="rounded-xl bg-page px-4 py-3"><div className="text-ink-3">Рейтинг</div><div className="text-2xl font-bold">{k.rating.toFixed(1).replace(".", ",")} <span className="text-lg font-semibold text-ink-3">/ 5</span></div></div>
            <div className="rounded-xl bg-page px-4 py-3"><div className="text-ink-3">Перевозок</div><div className="text-2xl font-bold">{k.deals}</div></div>
          </div>
        </Card>
        <H2 right={<Stars value={k.rating} count={k.ratingCount} />}>Оценки перевозчиков</H2>
        <Card className="p-4"><Breakdown labels={RATE_CLIENT} values={criteria(k.reviews, RATE_CLIENT.length)} empty={!k.reviews.length} /></Card>
        {open.length > 0 && (<><H2>Открытые заявки</H2><div className="grid gap-3">{open.map((c) => <CargoCard key={c.id} c={c} />)}</div></>)}
        <H2>Отзывы</H2>
        <Reviews reviews={k.reviews} labels={RATE_CLIENT} />
      </Page>
    </>
  );
}
