"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AlertCircle, Check, CheckCircle2, ChevronLeft, Minus, Plus, ShieldCheck, Star, X, XCircle } from "lucide-react";
import { FLOW, STATUS, type BodyId, type KindId, type Status } from "@/lib/catalog";
import { initials } from "@/lib/format";
import type { Check as MatchCheck, Fit } from "@/lib/match";

/* ---------- buttons ---------- */

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
const V: Record<Variant, string> = {
  primary: "bg-brand text-white active:bg-brand-press disabled:bg-[#aebfe0]",
  secondary: "bg-brand-soft text-brand-ink active:bg-[#d9e6ff] disabled:opacity-50",
  outline: "border-2 border-line-2 bg-white text-ink active:bg-page disabled:opacity-50",
  ghost: "text-brand active:bg-brand-soft disabled:opacity-50",
  danger: "border-2 border-[#f3c2bd] bg-white text-bad active:bg-bad-soft",
};
const S = { lg: "min-h-14 rounded-2xl px-5 text-lg", md: "min-h-12 rounded-xl px-4 text-base", sm: "min-h-10 rounded-xl px-3 text-[0.95rem]" };
export const btn = (variant: Variant = "primary", size: keyof typeof S = "lg", full = false) =>
  `inline-flex items-center justify-center gap-2 font-semibold transition-colors select-none disabled:cursor-not-allowed ${V[variant]} ${S[size]} ${full ? "w-full" : ""}`;

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: keyof typeof S; full?: boolean };
export function Button({ variant = "primary", size = "lg", full, className = "", type = "button", ...p }: BtnProps) {
  return <button type={type} className={`${btn(variant, size, full)} ${className}`} {...p} />;
}
export function LinkButton({ href, variant = "primary", size = "lg", full, className = "", children }: { href: string; variant?: Variant; size?: keyof typeof S; full?: boolean; className?: string; children: React.ReactNode }) {
  return <Link href={href} className={`${btn(variant, size, full)} ${className}`}>{children}</Link>;
}

/* ---------- structure ---------- */

export function TopBar({ title, back = true, right, onBack }: { title?: React.ReactNode; back?: boolean; right?: React.ReactNode; onBack?: () => void }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur-md">
      <div className="mx-auto grid h-15 max-w-xl grid-cols-[1fr_auto_1fr] items-center gap-1 px-2 pt-[env(safe-area-inset-top)]">
        <div>
          {back && (
            <button onClick={() => (onBack ? onBack() : history.length > 1 ? router.back() : router.push("/"))} className="flex h-11 items-center gap-0.5 rounded-xl pl-1 pr-3 text-base font-semibold text-brand active:bg-brand-soft">
              <ChevronLeft size={26} strokeWidth={2.4} aria-hidden /> Назад
            </button>
          )}
        </div>
        <div className="max-w-[56vw] truncate text-center text-lg font-semibold">{title}</div>
        <div className="flex justify-end">{right}</div>
      </div>
    </header>
  );
}

export function Page({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <main className={`mx-auto w-full max-w-xl ${className}`}>{children}</main>;
}

export function Card({ children, className = "", as: As = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "section" | "article" | "li" }) {
  return <As className={`rounded-2xl border border-line bg-white ${className}`}>{children}</As>;
}

export function H2({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-3 mt-7 flex items-end justify-between gap-3 px-1">
      <h2 className="text-xl font-bold leading-tight">{children}</h2>
      {right}
    </div>
  );
}

export function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-3 last:border-0">
      <span className="text-ink-3">{label}</span>
      <span className="text-right font-semibold">{children}</span>
    </div>
  );
}

export function Empty({ icon, title, text, action }: { icon?: React.ReactNode; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line-2 bg-white px-6 py-9 text-center">
      {icon && <div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand">{icon}</div>}
      <p className="text-lg font-semibold">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-sm text-ink-3">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------- small pieces ---------- */

type Tone = "brand" | "ok" | "warn" | "bad" | "gray";
const T: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand-ink", ok: "bg-ok-soft text-ok", warn: "bg-warn-soft text-warn", bad: "bg-bad-soft text-bad", gray: "bg-page text-ink-2",
};
export function Pill({ children, tone = "gray", className = "" }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold leading-none ${T[tone]} ${className}`}>{children}</span>;
}

export function StatusPill({ status, offers = 0 }: { status: Status; offers?: number }) {
  if (status === "published") return <Pill tone="warn">Ждём предложений</Pill>;
  if (status === "offers") return <Pill tone="brand">{offers ? `Предложений: ${offers}` : STATUS.offers}</Pill>;
  if (status === "done") return <Pill tone="warn">Оцените перевозку</Pill>;
  if (status === "rated") return <Pill tone="ok">Завершено</Pill>;
  return <Pill tone="brand">{STATUS[status]}</Pill>;
}

export function Verified({ ok, text }: { ok: boolean | "pending"; text?: string }) {
  if (ok === "pending") return <Pill tone="warn">Документы на проверке</Pill>;
  return ok ? <Pill tone="ok"><ShieldCheck size={15} aria-hidden /> {text ?? "Проверен"}</Pill> : <Pill tone="gray">Не проверен</Pill>;
}

export function Stars({ value, count, size = 16 }: { value: number; count?: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1 font-semibold">
      <Star size={size} className="fill-[#f5b301] text-[#f5b301]" aria-hidden />
      {value ? value.toFixed(1).replace(".", ",") : "—"}
      {count !== undefined && <span className="font-normal text-ink-3">· {count}</span>}
    </span>
  );
}

export function StarInput({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div>
      <div className="mb-1 font-semibold">{label}</div>
      <div className="flex gap-1" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} из 5`} onClick={() => onChange(n)} className="grid size-12 place-items-center rounded-xl active:bg-page">
            <Star size={34} strokeWidth={1.6} className={n <= value ? "fill-[#f5b301] text-[#f5b301]" : "text-line-2"} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const s = { sm: "size-10 text-sm", md: "size-12 text-base", lg: "size-20 text-2xl" }[size];
  return <span className={`grid shrink-0 place-items-center rounded-full bg-brand-soft font-bold text-brand-ink ${s}`}>{initials(name)}</span>;
}

export function Plate({ plate, cn }: { plate: string; cn?: boolean }) {
  if (cn) return <span className="tnum inline-flex items-center rounded-md border-2 border-[#0b3483] bg-[#1747b8] px-2 py-0.5 font-semibold tracking-wide text-white">{plate}</span>;
  const [n, l, r] = plate.split(" ");
  return (
    <span className="tnum inline-flex items-stretch overflow-hidden rounded-md border-2 border-ink bg-white font-semibold leading-none text-ink">
      <span className="grid place-items-center bg-[#00afca] px-1 text-[0.6rem] font-bold text-white">KZ</span>
      <span className="flex items-center gap-1.5 px-1.5 py-1">
        <span>{n}</span><span>{l}</span><span className="border-l-2 border-ink pl-1.5">{r}</span>
      </span>
    </span>
  );
}

/** Two dots and a line: the same shape as the search box. */
export function RouteLine({ from, fromSub, to, toSub, big }: { from: string; fromSub?: string; to: string; toSub?: string; big?: boolean }) {
  return (
    <div className="grid grid-cols-[20px_1fr] gap-x-3">
      <div className="flex flex-col items-center pt-1.5">
        <span className="size-3.5 rounded-full border-[3px] border-brand bg-white" />
        <span className="my-1 w-0.5 flex-1 bg-brand-line" />
        <span className="size-3.5 rounded-full bg-brand" />
      </div>
      <div className="min-w-0">
        <div className={`${big ? "text-2xl" : "text-lg"} font-bold leading-tight`}>{from}</div>
        {fromSub && <div className="text-ink-3">{fromSub}</div>}
        <div className={`${big ? "mt-4" : "mt-2.5"} ${big ? "text-2xl" : "text-lg"} font-bold leading-tight`}>{to}</div>
        {toSub && <div className="text-ink-3">{toSub}</div>}
      </div>
    </div>
  );
}

/** Why it fits — criterion by criterion (spec §8). */
export function FitChecks({ fit, compact }: { fit: Fit; compact?: boolean }) {
  const list: MatchCheck[] = compact ? fit.checks.filter((c) => !c.ok) : fit.checks;
  return (
    <ul className="grid gap-1.5">
      {list.map((c) => (
        <li key={c.key} className="flex items-start gap-2">
          {c.ok ? <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-ok" aria-label="Да" /> : c.key === "date" ? <AlertCircle size={20} className="mt-0.5 shrink-0 text-warn" aria-label="Почти" /> : <XCircle size={20} className="mt-0.5 shrink-0 text-bad" aria-label="Нет" />}
          <span className={c.ok ? "" : "font-semibold"}>{c.text}</span>
        </li>
      ))}
    </ul>
  );
}
export function FitBadge({ fit }: { fit: Fit }) {
  if (fit.level === "full") return <Pill tone="ok"><Check size={15} strokeWidth={3} aria-hidden /> Подходит</Pill>;
  if (fit.level === "partial") return <Pill tone="warn">Почти подходит</Pill>;
  return <Pill tone="gray">Не подходит</Pill>;
}

/* ---------- form controls ---------- */

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="mb-2 text-base font-semibold">{label}</div>
      {children}
      {hint && <p className="mt-1.5 text-[0.95rem] text-ink-3">{hint}</p>}
    </div>
  );
}

export const inputCls = "h-14 w-full rounded-2xl border-2 border-line-2 bg-white px-4 text-lg outline-none transition-colors focus:border-brand";

export function Choice<T extends string>({ options, value, onChange, multi, columns }: {
  options: [T, string][]; value: T | T[] | undefined; onChange: (v: T) => void; multi?: boolean; columns?: 2 | 3;
}) {
  const on = (k: T) => (multi ? (value as T[] | undefined)?.includes(k) : value === k);
  return (
    <div className={columns ? `grid gap-2 ${columns === 2 ? "grid-cols-2" : "grid-cols-3"}` : "flex flex-wrap gap-2"} role={multi ? "group" : "radiogroup"}>
      {options.map(([k, label]) => (
        <button
          key={k}
          type="button"
          role={multi ? "checkbox" : "radio"}
          aria-checked={!!on(k)}
          onClick={() => onChange(k)}
          className={`flex min-h-12 items-center justify-center gap-1.5 rounded-xl border-2 px-4 text-base font-semibold transition-colors ${on(k) ? "border-brand bg-brand-soft text-brand-ink" : "border-line-2 bg-white text-ink active:bg-page"}`}
        >
          {on(k) && multi && <Check size={18} strokeWidth={3} aria-hidden />}
          {label}
        </button>
      ))}
    </div>
  );
}

/** A big tappable option row (radio-like), for one-question-per-screen steps. */
export function Option({ selected, title, hint, onClick, icon }: { selected: boolean; title: string; hint?: string; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <button type="button" role="radio" aria-checked={selected} onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-colors ${selected ? "border-brand bg-brand-soft" : "border-line bg-white active:bg-page"}`}>
      {icon && <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${selected ? "bg-white text-brand" : "bg-brand-soft text-brand"}`}>{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-semibold leading-snug">{title}</span>
        {hint && <span className="block text-ink-3">{hint}</span>}
      </span>
      <span className={`grid size-7 shrink-0 place-items-center rounded-full border-2 ${selected ? "border-brand bg-brand text-white" : "border-line-2"}`}>{selected && <Check size={16} strokeWidth={3.5} />}</span>
    </button>
  );
}

export function Stepper({ value, onChange, step = 1, min = 0, max = 100000000, unit, label, big }: {
  value: number; onChange: (n: number) => void; step?: number; min?: number; max?: number; unit?: string; label: string; big?: boolean;
}) {
  const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(n).replace(/[  ]/g, " ");
  return (
    <div className="flex h-16 items-stretch overflow-hidden rounded-2xl border-2 border-line-2 bg-white focus-within:border-brand">
      <button type="button" aria-label={`${label}: меньше`} onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))} className="grid w-16 shrink-0 place-items-center text-brand active:bg-brand-soft">
        <Minus size={26} strokeWidth={2.6} />
      </button>
      <label className="flex min-w-0 flex-1 items-center justify-center gap-1.5 border-x-2 border-line">
        <span className="sr-only">{label}</span>
        <input
          inputMode="decimal"
          value={value ? fmt(value) : ""}
          placeholder="0"
          onChange={(e) => { const n = Number(e.target.value.replace(",", ".").replace(/[^\d.]/g, "")); onChange(Math.min(max, isNaN(n) ? 0 : n)); }}
          className={`tnum w-full min-w-0 bg-transparent text-center font-bold outline-none ${big ? "text-3xl" : "text-2xl"}`}
        />
        {unit && <span className="shrink-0 pr-2 text-lg font-semibold text-ink-3">{unit}</span>}
      </label>
      <button type="button" aria-label={`${label}: больше`} onClick={() => onChange(Math.min(max, +(value + step).toFixed(2)))} className="grid w-16 shrink-0 place-items-center text-brand active:bg-brand-soft">
        <Plus size={26} strokeWidth={2.6} />
      </button>
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-center gap-4 py-2 text-left">
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-semibold">{label}</span>
        {hint && <span className="block text-ink-3">{hint}</span>}
      </span>
      <span className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${checked ? "bg-brand" : "bg-line-2"}`}>
        <span className={`absolute top-1 size-6 rounded-full bg-white shadow transition-all ${checked ? "left-7" : "left-1"}`} />
      </span>
    </button>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: [T, string][]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="grid rounded-2xl bg-[#e4e9f1] p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }} role="tablist">
      {options.map(([k, label]) => (
        <button key={k} role="tab" aria-selected={value === k} onClick={() => onChange(k)}
          className={`min-h-11 rounded-xl px-2 text-base font-semibold transition-colors ${value === k ? "bg-white text-ink shadow-[0_1px_3px_rgba(14,26,43,0.15)]" : "text-ink-2"}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

/* ---------- bottom sheet (inDrive-style filters and choices) ---------- */

export function Sheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="fade-in absolute inset-0 bg-ink/45" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label={title} className="sheet-in absolute inset-x-0 bottom-0 mx-auto flex max-h-[92dvh] max-w-xl flex-col rounded-t-3xl bg-white shadow-[0_-8px_30px_rgba(14,26,43,0.18)]">
        <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-line-2" aria-hidden />
        <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-2">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button onClick={onClose} className="flex h-11 items-center gap-1 rounded-xl px-3 font-semibold text-brand active:bg-brand-soft"><X size={22} aria-hidden /> Закрыть</button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
        {footer && <div className="border-t border-line bg-white px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- status timeline (spec §13) ---------- */

export function Timeline({ status, log, intl }: { status: Status; log: { s: Status; at: number }[]; intl: boolean }) {
  const steps = FLOW.filter((s) => s !== "customs" || intl);
  const cur = steps.indexOf(status);
  const at = (s: Status) => log.find((l) => l.s === s)?.at;
  return (
    <ol className="grid">
      {steps.map((s, i) => {
        const done = i < cur, now = i === cur;
        const t = at(s);
        return (
          <li key={s} className="grid grid-cols-[28px_1fr] gap-x-3">
            <div className="flex flex-col items-center">
              <span className={`grid size-7 shrink-0 place-items-center rounded-full ${done ? "bg-brand text-white" : now ? "border-[3px] border-brand bg-white" : "border-2 border-line-2 bg-white"}`}>
                {done && <Check size={16} strokeWidth={3.5} />}
                {now && <span className="size-2.5 rounded-full bg-brand" />}
              </span>
              {i < steps.length - 1 && <span className={`w-0.5 flex-1 ${done ? "bg-brand" : "bg-line"}`} />}
            </div>
            <div className={`pb-4 ${now ? "font-bold" : done ? "text-ink" : "text-ink-3"}`}>
              <div className={now ? "text-lg" : ""}>{STATUS[s]}</div>
              {t && (done || now) && <div className="text-sm font-normal text-ink-3">{new Date(t).toLocaleString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- truck illustration (stands in for photos in the demo) ---------- */

export function TruckArt({ body, kind = "fura", className = "" }: { body: BodyId; kind?: KindId; className?: string }) {
  const stroke = "currentColor";
  const w = { strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  const wheels = kind === "fura" ? [30, 52, 74, 170, 212] : kind === "truck" ? [62, 86, 210] : [92, 190];
  const box = kind === "fura" ? { x: 10, w: 150 } : kind === "truck" ? { x: 40, w: 128 } : { x: 70, w: 0 };
  return (
    <svg viewBox="0 0 240 100" className={`text-brand ${className}`} role="img" aria-label="Иллюстрация машины">
      <line x1="4" y1="94" x2="236" y2="94" stroke="#d5deea" strokeWidth="2" />
      {kind === "small" ? (
        <g {...w} stroke={stroke}>
          <path d="M60 80 V40 Q60 32 68 32 H176 Q186 32 192 42 L204 60 Q208 64 208 70 V80 Z" fill="#eaf1ff" />
          <path d="M178 40 H186 L198 60 H178 Z" fill="#fff" />
        </g>
      ) : (
        <g {...w} stroke={stroke}>
          {/* cab */}
          <path d="M172 82 V40 Q172 30 182 30 H206 Q218 30 222 42 L228 62 V82 Z" fill="#fff" />
          <path d="M200 38 H210 Q214 38 216 44 L220 56 H200 Z" fill="#eaf1ff" />
          <line x1="164" y1="82" x2={box.x} y2="82" />
          {/* body by type */}
          {body === "tent" && <><path d={`M${box.x} 76 V30 Q${box.x} 22 ${box.x + 8} 22 H${box.x + box.w - 8} Q${box.x + box.w} 22 ${box.x + box.w} 30 V76 Z`} fill="#eaf1ff" />{[1, 2, 3, 4].map((i) => <line key={i} x1={box.x + (box.w / 5) * i} y1="26" x2={box.x + (box.w / 5) * i} y2="72" strokeWidth="1.6" opacity=".45" />)}</>}
          {(body === "reefer" || body === "isotherm") && <><rect x={box.x} y="22" width={box.w} height="54" rx="4" fill="#fff" /><line x1={box.x + 6} y1="34" x2={box.x + box.w - 6} y2="34" strokeWidth="1.6" opacity=".45" />{body === "reefer" && <rect x={box.x + box.w - 2} y="30" width="10" height="22" rx="2" fill="#eaf1ff" />}</>}
          {body === "container" && <><rect x={box.x} y="24" width={box.w} height="52" rx="2" fill="#eaf1ff" />{Array.from({ length: 13 }).map((_, i) => <line key={i} x1={box.x + 8 + i * ((box.w - 16) / 12)} y1="30" x2={box.x + 8 + i * ((box.w - 16) / 12)} y2="70" strokeWidth="1.4" opacity=".5" />)}</>}
          {body === "flatbed" && <><rect x={box.x} y="60" width={box.w} height="16" rx="2" fill="#eaf1ff" />{[1, 2, 3].map((i) => <line key={i} x1={box.x + (box.w / 4) * i} y1="60" x2={box.x + (box.w / 4) * i} y2="76" strokeWidth="1.6" opacity=".5" />)}</>}
          {body === "lowboy" && <path d={`M${box.x} 66 H${box.x + box.w - 36} L${box.x + box.w - 24} 56 H${box.x + box.w} V66 L${box.x + box.w - 24} 66 L${box.x + box.w - 36} 76 H${box.x} Z`} fill="#eaf1ff" />}
        </g>
      )}
      {wheels.map((x) => <circle key={x} cx={x} cy="84" r="9" fill="#0e1a2b" stroke="#fff" strokeWidth="2.5" />)}
    </svg>
  );
}
