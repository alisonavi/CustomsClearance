"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpDown, ChevronLeft, Clock, Globe2, MapPin, Search, X } from "lucide-react";
import { CITIES, COUNTRIES, city, fixLayout, highlight, placeLabel, suggest, type Country, type PlaceQ } from "@/lib/geo";
import { useStore } from "@/lib/store";

/** Full-screen place search, Yandex-style: one field, instant suggestions, wrong-layout fix. */
export function PlacePicker({ open, title, allowCountries, onPick, onClose }: {
  open: boolean; title: string; allowCountries?: boolean; onPick: (q: PlaceQ) => void; onClose: () => void;
}) {
  const { s, addRecent } = useStore();
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) return;
    setQ("");
    const t = window.setTimeout(() => input.current?.focus(), 50);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.clearTimeout(t); document.body.style.overflow = prev; };
  }, [open]);
  if (!open) return null;

  const pick = (p: PlaceQ) => {
    if (p.type === "city") addRecent(p.id);
    onPick(p);
    onClose();
  };
  const results = suggest(q, !!allowCountries);
  const fixed = fixLayout(q.trim());
  const layoutFixed = q.trim() && fixed !== q.trim().toLowerCase() && results.length > 0 && !/[а-яё]/i.test(q);

  const Group = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <section className="pt-4">
      <h3 className="px-5 pb-1 text-sm font-semibold uppercase tracking-wide text-ink-3">{label}</h3>
      <ul>{children}</ul>
    </section>
  );
  const Item = ({ p, icon, title: t, sub }: { p: PlaceQ; icon: React.ReactNode; title: React.ReactNode; sub: string }) => (
    <li>
      <button onClick={() => pick(p)} className="flex w-full items-center gap-4 px-5 py-3 text-left active:bg-page">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-page text-ink-3">{icon}</span>
        <span className="min-w-0">
          <span className="block truncate text-lg">{t}</span>
          <span className="block text-ink-3">{sub}</span>
        </span>
      </button>
    </li>
  );

  return (
    <div className="fade-in fixed inset-0 z-[65] flex flex-col bg-white" role="dialog" aria-modal="true" aria-label={title}>
      <div className="mx-auto flex w-full max-w-xl items-center gap-1 border-b border-line px-2 pb-2 pt-[max(8px,env(safe-area-inset-top))]">
        <button onClick={onClose} aria-label="Назад" className="grid size-12 shrink-0 place-items-center rounded-xl text-brand active:bg-brand-soft"><ChevronLeft size={30} /></button>
        <div className="relative flex-1">
          <Search size={22} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && results[0]) pick(results[0].q); }}
            placeholder={title}
            enterKeyHint="search"
            className="h-13 w-full rounded-2xl border-2 border-transparent bg-page pl-11 pr-11 text-lg outline-none focus:border-brand focus:bg-white"
          />
          {q && <button onClick={() => setQ("")} aria-label="Очистить" className="absolute right-1.5 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-xl text-ink-3"><X size={20} /></button>}
        </div>
      </div>
      <div className="mx-auto w-full max-w-xl flex-1 overflow-y-auto pb-10">
        {q.trim() ? (
          <>
            {layoutFixed && <p className="px-5 pt-3 text-ink-3">Исправили раскладку: <b className="text-ink">{fixed}</b></p>}
            {results.length ? (
              <ul className="pt-2">
                {results.map((r) => {
                  const [typed, rest] = highlight(r.title, q);
                  return <Item key={JSON.stringify(r.q)} p={r.q} icon={r.q.type === "country" ? <Globe2 size={20} /> : <MapPin size={20} />} title={<>{typed}<b className="font-bold">{rest}</b></>} sub={r.sub} />;
                })}
              </ul>
            ) : (
              <div className="px-5 pt-8 text-center">
                <p className="text-lg font-semibold">Такого города нет в списке</p>
                <p className="mt-1 text-ink-3">Проверьте название или выберите ближайший крупный город.</p>
              </div>
            )}
          </>
        ) : (
          <>
            {allowCountries && (
              <Group label="Страна целиком">
                {(["CN", "KZ"] as Country[]).map((c) => <Item key={c} p={{ type: "country", code: c }} icon={<Globe2 size={20} />} title={COUNTRIES[c].whole} sub="Любой город" />)}
              </Group>
            )}
            {s.recent.length > 0 && (
              <Group label="Недавние">
                {s.recent.map((id) => <Item key={id} p={{ type: "city", id }} icon={<Clock size={20} />} title={city(id).name} sub={COUNTRIES[city(id).country].name} />)}
              </Group>
            )}
            {(["CN", "KZ"] as Country[]).map((cc) => (
              <Group key={cc} label={COUNTRIES[cc].name}>
                {CITIES.filter((c) => c.country === cc && c.popular).map((c) => <Item key={c.id} p={{ type: "city", id: c.id }} icon={<MapPin size={20} />} title={c.name} sub={COUNTRIES[cc].name} />)}
              </Group>
            ))}
            <p className="px-5 pt-5 text-ink-3">Не нашли? Начните писать название — подскажем.</p>
          </>
        )}
      </div>
    </div>
  );
}

/** The one search box: Откуда / Куда with two dots, like a taxi app. */
export function RouteBox({ from, to, onFrom, onTo, fromEmpty = "Город или страна", toEmpty = "Город или страна", allowCountries = true }: {
  from?: PlaceQ; to?: PlaceQ; onFrom: (q: PlaceQ | null) => void; onTo: (q: PlaceQ | null) => void; fromEmpty?: string; toEmpty?: string; allowCountries?: boolean;
}) {
  const [pick, setPick] = useState<"from" | "to" | null>(null);
  const row = (which: "from" | "to") => {
    const v = which === "from" ? from : to;
    return (
      <div className="flex items-center pr-14">
        <button onClick={() => setPick(which)} className="flex min-h-[4.25rem] min-w-0 flex-1 items-center gap-3.5 rounded-2xl pl-4 text-left active:bg-page">
          <span className={`size-3.5 shrink-0 rounded-full ${which === "from" ? "border-[3px] border-brand bg-white" : "bg-brand"}`} aria-hidden />
          <span className="min-w-0">
            <span className="block text-[0.95rem] text-ink-3">{which === "from" ? "Откуда" : "Куда"}</span>
            <span className={`block truncate text-lg ${v ? "font-semibold" : "text-ink-3"}`}>{v ? placeLabel(v) : which === "from" ? fromEmpty : toEmpty}</span>
          </span>
        </button>
        {v && (
          <button onClick={() => (which === "from" ? onFrom(null) : onTo(null))} aria-label={`Очистить: ${which === "from" ? "откуда" : "куда"}`} className="grid size-11 shrink-0 place-items-center rounded-xl text-ink-3 active:bg-page">
            <X size={20} />
          </button>
        )}
      </div>
    );
  };
  return (
    <>
      <div className="relative rounded-3xl border-2 border-line-2 bg-white">
        {row("from")}
        <div className="ml-12 mr-16 border-t border-line" />
        {row("to")}
        <button
          onClick={() => { const f = from, t = to; onFrom(t ?? null); onTo(f ?? null); }}
          aria-label="Поменять местами откуда и куда"
          className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border-2 border-line bg-white text-brand active:bg-brand-soft"
          style={{ display: from || to ? undefined : "none" }}
        >
          <ArrowUpDown size={20} />
        </button>
      </div>
      <PlacePicker open={pick === "from"} title="Откуда: город или страна" allowCountries={allowCountries} onPick={(q) => onFrom(q)} onClose={() => setPick(null)} />
      <PlacePicker open={pick === "to"} title="Куда: город или страна" allowCountries={allowCountries} onPick={(q) => onTo(q)} onClose={() => setPick(null)} />
    </>
  );
}
