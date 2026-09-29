"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, FileWarning, Lock, Minus, Plus, ShieldCheck, Star } from "lucide-react";
import { CUSTOMS, city, initials, type CityId, type Customs, type Role } from "@/lib/data";
import { useStore } from "@/lib/store";

/** KZ licence plate: flag strip, number, letters, region. */
export function Plate({ plate, big }: { plate: string; big?: boolean }) {
  const [n, l, r] = plate.split(" ");
  return (
    <span className={`inline-flex shrink-0 items-stretch overflow-hidden rounded-[4px] border-2 border-ink bg-white font-display font-bold leading-none text-ink ${big ? "text-[26px]" : "text-[17px]"}`}>
      <span className={`flex flex-col items-center justify-center gap-[3px] bg-kz text-white ${big ? "px-1.5" : "px-1"}`}>
        <span className={`rounded-full bg-[#fec50c] ${big ? "size-2" : "size-1.5"}`} />
        <span className={`font-sans font-extrabold ${big ? "text-[11px]" : "text-[8px]"}`}>KZ</span>
      </span>
      <span className={`flex items-center tabular-nums ${big ? "gap-2 px-2.5 py-1.5" : "gap-1.5 px-1.5 py-[3px]"}`}>
        <span>{n}</span>
        <span>{l}</span>
        <span className={`border-l-2 border-ink ${big ? "pl-2" : "pl-1.5"}`}>{r}</span>
      </span>
    </span>
  );
}

/** ISO corner castings — the four steel blocks on every container corner. */
export function Castings({ light }: { light?: boolean }) {
  const c = `pointer-events-none absolute h-[9px] w-[11px] ${light ? "bg-white/85" : "bg-ink/80"} after:absolute after:left-1/2 after:top-1/2 after:h-[3px] after:w-[5px] after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full ${light ? "after:bg-oxide" : "after:bg-white"}`;
  return (
    <>
      <span aria-hidden className={`${c} left-0 top-0`} />
      <span aria-hidden className={`${c} right-0 top-0`} />
      <span aria-hidden className={`${c} bottom-0 left-0`} />
      <span aria-hidden className={`${c} bottom-0 right-0`} />
    </>
  );
}

/** Door-marking block: MAX GROSS / CU.CAP. style data plate. */
export function DataPlate({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-flow-col auto-cols-fr divide-x divide-line rounded-[3px] border border-line bg-[#f3f4f3]">
      {items.map(([k, v]) => (
        <div key={k} className="min-w-0 px-2.5 py-1.5">
          <dt className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-3">{k}</dt>
          <dd className="truncate font-display text-[20px] font-bold leading-tight text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function CustomsTag({ c }: { c: Customs }) {
  const Icon = c === "cleared" ? ShieldCheck : c === "needs" ? FileWarning : Lock;
  return (
    <span className="inline-flex items-center gap-1 rounded-[3px] bg-customs-soft px-1.5 py-[3px] text-[12.5px] font-bold leading-none text-customs">
      <Icon size={14} strokeWidth={2.4} aria-hidden />
      {CUSTOMS[c].name}
    </span>
  );
}

export function Tag({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "seal" | "signal" | "dark" }) {
  const t = {
    plain: "bg-[#eceeed] text-ink-2",
    seal: "bg-seal-soft text-seal",
    signal: "bg-signal text-ink",
    dark: "bg-ink text-white",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-[3px] px-1.5 py-[3px] text-[12.5px] font-bold leading-none ${t}`}>{children}</span>;
}

export function Rating({ value, sub }: { value: number; sub?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-2">
      <Star size={13} className="fill-signal text-signal-deep" aria-hidden />
      {value.toFixed(1)}
      {sub && <span className="font-normal text-ink-3">· {sub}</span>}
    </span>
  );
}

export function Avatar({ name, kind }: { name: string; kind: "driver" | "client" }) {
  return (
    <span className={`grid size-11 shrink-0 place-items-center rounded-[4px] font-display text-[18px] font-bold ${kind === "driver" ? "bg-ink text-signal" : "bg-customs text-white"}`}>
      {initials(name)}
    </span>
  );
}

/** Route in door-marking caps: ХОРГОС → АТЫРАУ */
export function Route({ from, to, size = "md", light }: { from: CityId; to: CityId | string; size?: "sm" | "md" | "lg"; light?: boolean }) {
  const s = { sm: "text-[20px]", md: "text-[26px]", lg: "text-[40px] sm:text-[46px]" }[size];
  return (
    <span className={`flex min-w-0 flex-wrap items-center gap-x-2 font-display font-extrabold uppercase leading-[0.95] tracking-[0.01em] ${s} ${light ? "text-white" : "text-ink"}`}>
      <span className="min-w-0 truncate">{city(from)}</span>
      <ArrowRight className={`shrink-0 ${light ? "text-signal" : "text-oxide"}`} size={size === "lg" ? 34 : size === "md" ? 22 : 18} strokeWidth={3} aria-hidden />
      <span className="min-w-0 truncate">{isCity(to) ? city(to) : to}</span>
    </span>
  );
}
const isCity = (x: string): x is CityId => ["khorgos", "zharkent", "almaty", "astana", "shymkent", "karaganda", "aktobe", "atyrau", "aktau", "uralsk", "kostanay", "pavlodar", "taraz", "kyzylorda", "oskemen", "tashkent", "bishkek", "moscow"].includes(x);

/** Detented stepper: price moves in fixed 10 000 ₸ clicks. */
export function Stepper({ value, onChange, step = 10000, min = 10000, label }: { value: number; onChange: (n: number) => void; step?: number; min?: number; label: string }) {
  return (
    <div className="flex items-stretch overflow-hidden rounded-[4px] border-2 border-ink bg-white">
      <button type="button" aria-label={`Меньше на ${step}`} onClick={() => onChange(Math.max(min, value - step))} className="grid w-14 place-items-center border-r-2 border-ink active:bg-yard">
        <Minus size={22} strokeWidth={2.6} />
      </button>
      <label className="flex min-w-0 flex-1 flex-col items-center justify-center py-1">
        <span className="sr-only">{label}</span>
        <input
          inputMode="numeric"
          value={new Intl.NumberFormat("ru-RU").format(value).replace(/ | /g, " ")}
          onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "")) || 0)}
          className="w-full bg-transparent text-center font-display text-[30px] font-extrabold leading-none tabular-nums outline-none"
        />
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-3">тенге · шаг {step / 1000} 000</span>
      </label>
      <button type="button" aria-label={`Больше на ${step}`} onClick={() => onChange(value + step)} className="grid w-14 place-items-center border-l-2 border-ink active:bg-yard">
        <Plus size={22} strokeWidth={2.6} />
      </button>
    </div>
  );
}

/** Compact oxide header for inner screens. */
export function Bar({ title, sub, right, back = true }: { title: React.ReactNode; sub?: React.ReactNode; right?: React.ReactNode; back?: boolean }) {
  const router = useRouter();
  return (
    <header className="corrugated sticky top-0 z-30 text-white">
      <div className="mx-auto flex max-w-xl items-center gap-2 px-3 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
        {back && (
          <button onClick={() => (history.length > 1 ? router.back() : router.push("/"))} aria-label="Назад" className="grid size-10 shrink-0 place-items-center rounded-[4px] bg-black/20 active:bg-black/35">
            <ArrowLeft size={22} strokeWidth={2.4} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[17px] font-bold leading-tight">{title}</div>
          {sub && <div className="truncate text-[13px] text-oxide-soft">{sub}</div>}
        </div>
        {right}
      </div>
    </header>
  );
}

export function RoleSwitch() {
  const { state, setRole } = useStore();
  const opt = (r: Role, label: string) => (
    <button
      onClick={() => setRole(r)}
      aria-pressed={state.role === r}
      className={`rounded-[3px] px-3 py-1.5 text-[13px] font-bold transition-colors ${state.role === r ? "bg-white text-oxide-deep" : "text-white/85 active:bg-black/20"}`}
    >
      {label}
    </button>
  );
  return (
    <div className="flex rounded-[4px] bg-black/25 p-[3px]" role="group" aria-label="Режим">
      {opt("client", "Клиент")}
      {opt("driver", "Водитель")}
    </div>
  );
}

export function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-7 px-3">
      <div className="mb-3 flex items-end justify-between gap-3 px-1">
        <h2 className="text-[20px] font-extrabold leading-tight tracking-[-0.01em]">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Chips<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="no-scrollbar -mx-3 mb-3 flex gap-2 overflow-x-auto px-4">
      {options.map(([k, label]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          aria-pressed={value === k}
          className={`shrink-0 rounded-[4px] border-2 px-3 py-1.5 text-[14px] font-bold transition-colors ${value === k ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-2 active:border-ink"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function Empty({ title, body, href, cta }: { title: string; body: string; href?: string; cta?: string }) {
  return (
    <div className="rounded-[4px] border-2 border-dashed border-[#b9bdbb] px-5 py-8 text-center">
      <p className="text-[17px] font-bold">{title}</p>
      <p className="mx-auto mt-1 max-w-xs text-[14px] text-ink-3">{body}</p>
      {href && cta && (
        <Link href={href} className="mt-4 inline-flex rounded-[4px] bg-signal px-4 py-2.5 text-[15px] font-extrabold text-ink active:bg-signal-deep">
          {cta}
        </Link>
      )}
    </div>
  );
}

/** Bolt seal: yellow tag + steel bolt. The deal is "sealed" like a container door. */
export function Seal({ code, animate, small }: { code: string; animate?: boolean; small?: boolean }) {
  return (
    <div className={`${animate ? "seal-drop" : "-rotate-6"} ${small ? "w-[112px]" : "w-[150px]"} shrink-0 drop-shadow-[0_6px_10px_rgba(0,0,0,0.28)]`} role="img" aria-label={`Пломба ${code}`}>
      <svg viewBox="0 0 150 76" className="w-full">
        <rect x="2" y="30" width="44" height="14" rx="3" fill="#aab2b6" stroke="#151718" strokeWidth="2" />
        <rect x="6" y="33" width="36" height="3" rx="1.5" fill="#fff" opacity=".5" />
        <rect x="36" y="4" width="110" height="66" rx="8" fill="#FFC21A" stroke="#151718" strokeWidth="2.5" />
        <circle cx="52" cy="37" r="8" fill="#151718" />
        <circle cx="52" cy="37" r="3" fill="#aab2b6" />
        <text x="66" y="24" fontSize="11" fontWeight="800" fill="#151718" fontFamily="var(--font-body)" letterSpacing=".08em">СДЕЛКА</text>
        <text x="66" y="44" fontSize="16" fontWeight="800" fill="#151718" fontFamily="var(--font-cond)">{code}</text>
        {Array.from({ length: 22 }).map((_, i) => (
          <rect key={i} x={66 + i * 3.4} y="50" width={i % 3 === 0 ? 2 : 1} height="12" fill="#151718" />
        ))}
      </svg>
    </div>
  );
}

export function roleLabel(r: Role) {
  return r === "client" ? "Клиент" : "Водитель";
}
