"use client";

import { Star } from "lucide-react";
import { dayLabel } from "@/lib/format";
import { reviewAvg } from "@/lib/match";
import type { Review } from "@/lib/types";
import { Card, Stars } from "./ui";

/** Criteria averages as bars (spec §12). */
export function Breakdown({ labels, values, empty }: { labels: string[]; values: number[]; empty?: boolean }) {
  if (empty) return <p className="text-ink-3">Пока нет отзывов по завершённым перевозкам.</p>;
  return (
    <ul className="grid gap-3">
      {labels.map((l, i) => (
        <li key={l}>
          <div className="flex justify-between"><span>{l}</span><span className="font-semibold">{values[i] ? values[i].toFixed(1).replace(".", ",") : "—"}</span></div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-page"><div className="h-full rounded-full bg-brand" style={{ width: `${(values[i] / 5) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

/** Reviews are always tied to a finished shipment: route + date. */
export function Reviews({ reviews, labels }: { reviews: Review[]; labels: string[] }) {
  if (!reviews.length) return <p className="px-1 text-ink-3">Отзывов пока нет.</p>;
  return (
    <div className="grid gap-3">
      {reviews.map((r) => (
        <Card key={r.id} as="article" className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-semibold">{r.by}</div>
              <div className="text-ink-3">Перевозка {r.route} · {dayLabel(r.date)}</div>
            </div>
            <Stars value={reviewAvg(r)} />
          </div>
          {r.text && <p className="mt-2 text-lg">«{r.text}»</p>}
          <details className="mt-2">
            <summary className="cursor-pointer font-semibold text-brand">Оценки по пунктам</summary>
            <ul className="mt-2 grid gap-1">{labels.map((l, i) => <li key={l} className="flex justify-between"><span className="text-ink-2">{l}</span><span className="inline-flex items-center gap-1 font-semibold"><Star size={14} className="fill-[#f5b301] text-[#f5b301]" aria-hidden />{r.scores[i]}</span></li>)}</ul>
          </details>
        </Card>
      ))}
    </div>
  );
}
