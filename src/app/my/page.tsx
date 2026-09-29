"use client";

import { useStore } from "@/lib/store";
import { CargoCard, TruckCard } from "@/components/cards";
import { Bar, Empty, Section } from "@/components/ui";

export default function My() {
  const { state } = useStore();
  if (state.role === "client") {
    const open = state.cargo.filter((c) => c.mine && c.status === "open");
    const sealed = state.cargo.filter((c) => c.mine && c.status === "sealed");
    return (
      <main>
        <Bar title="Мои грузы" sub="Клиент · Айгерим Сапарова" back={false} />
        <div className="mx-auto max-w-xl">
          <Section title="Ищут водителя">
            <div className="grid gap-3">{open.length ? open.map((c) => <CargoCard key={c.id} c={c} />) : <Empty title="Открытых грузов нет" body="Разместите груз и назовите цену — водители ответят." href="/new/cargo" cta="Разместить груз" />}</div>
          </Section>
          {sealed.length > 0 && (
            <Section title="Опломбированные сделки">
              <div className="grid gap-3">{sealed.map((c) => <CargoCard key={c.id} c={c} />)}</div>
            </Section>
          )}
        </div>
      </main>
    );
  }
  const trucks = state.trucks.filter((t) => t.mine);
  const bids = state.cargo.filter((c) => c.bid && c.status === "open");
  const deals = state.cargo.filter((c) => c.dealDriverId === "me-driver");
  return (
    <main>
      <Bar title="Мои рейсы" sub="Водитель · 482 AKB 05" back={false} />
      <div className="mx-auto max-w-xl">
        <Section title="Машина на линии">
          <div className="grid gap-3">{trucks.length ? trucks.map((t) => <TruckCard key={t.id} t={t} />) : <Empty title="Вы не на линии" body="Сообщите, где вы и куда можете ехать, — клиенты предложат груз." href="/new/truck" cta="Выйти на линию" />}</div>
        </Section>
        {deals.length > 0 && (
          <Section title="Сделки">
            <div className="grid gap-3">{deals.map((c) => <CargoCard key={c.id} c={c} />)}</div>
          </Section>
        )}
        <Section title="Мои предложения">
          <div className="grid gap-3">{bids.length ? bids.map((c) => <CargoCard key={c.id} c={c} />) : <Empty title="Предложений пока нет" body="Откройте груз в ленте и примите цену клиента или предложите свою." />}</div>
        </Section>
      </div>
    </main>
  );
}
