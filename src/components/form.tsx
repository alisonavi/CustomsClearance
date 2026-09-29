"use client";

import { ChevronDown } from "lucide-react";
import { CITY_IDS, city, type CityId } from "@/lib/data";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 text-[13px] font-extrabold uppercase tracking-[0.06em] text-ink-2">{label}</div>
      {children}
    </div>
  );
}

export function Seg<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(([k, label]) => (
        <button
          type="button"
          key={k}
          onClick={() => onChange(k)}
          aria-pressed={value === k}
          className={`rounded-[4px] border-2 px-3 py-2 text-[15px] font-bold transition-colors ${value === k ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-2 active:border-ink"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function CitySelect({ value, onChange }: { value: CityId; onChange: (c: CityId) => void }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as CityId)}
        className="h-12 w-full appearance-none rounded-[4px] border-2 border-line bg-white pl-3 pr-8 font-display text-[21px] font-bold uppercase outline-none focus:border-ink"
      >
        {CITY_IDS.map((c) => <option key={c} value={c}>{city(c)}</option>)}
      </select>
      <ChevronDown size={18} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
    </div>
  );
}

export function CityMulti({ value, onChange, exclude }: { value: CityId[]; onChange: (v: CityId[]) => void; exclude?: CityId }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CITY_IDS.filter((c) => c !== exclude).map((c) => {
        const on = value.includes(c);
        return (
          <button
            type="button"
            key={c}
            onClick={() => onChange(on ? value.filter((x) => x !== c) : [...value, c])}
            aria-pressed={on}
            className={`rounded-[4px] border-2 px-2.5 py-1.5 text-[14px] font-bold ${on ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-2 active:border-ink"}`}
          >
            {city(c)}
          </button>
        );
      })}
    </div>
  );
}
