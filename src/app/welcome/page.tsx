"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Building2, ChevronLeft, Package, Truck, UserRound } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { Button, Option, inputCls } from "@/components/ui";

const fmtPhone = (d: string) => [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)].filter(Boolean).join(" ");

export default function Welcome() {
  const router = useRouter();
  const { s, register, toast } = useStore();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role>("client");
  const [phone, setPhone] = useState("7000000000");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState(s.user.company);
  const [ctype, setCtype] = useState<"driver" | "company">("company");

  const start = (r: Role) => { setRole(r); setName(r === "client" ? s.user.clientName : s.user.carrierName); setStep(1); };
  const finish = () => {
    register({ role, phone: `+7 ${fmtPhone(phone)}`, name: name.trim() || (role === "client" ? s.user.clientName : s.user.carrierName), company: company.trim(), carrierType: ctype });
    toast({ title: `Добро пожаловать, ${(name.trim() || "друг").split(" ")[0]}!`, body: role === "client" ? "Укажите, откуда и куда везти — покажем подходящие машины." : "Укажите, где ваша машина — покажем подходящие грузы.", href: "/" });
    router.replace("/");
  };

  if (step === 0) {
    return (
      <main className="min-h-dvh bg-white">
        <div className="mx-auto max-w-xl px-5 pb-10 pt-[max(40px,env(safe-area-inset-top))]">
          <div className="text-2xl font-bold text-brand">Keruen</div>
          <h1 className="mt-10 text-[2.1rem] font-bold leading-[1.1]">Грузы и машины<br />Китай — Казахстан</h1>
          <p className="mt-4 text-lg text-ink-2">Найдите машину для груза или груз для своей машины. Без WhatsApp-групп и обзвона знакомых.</p>
          <div className="mt-9 grid gap-3">
            <button onClick={() => start("client")} className="flex items-center gap-4 rounded-3xl border-2 border-line bg-white p-5 text-left active:border-brand active:bg-brand-soft">
              <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand"><Package size={32} /></span>
              <span><span className="block text-xl font-bold leading-snug">Мне нужно перевезти груз</span><span className="block text-ink-3">Я клиент</span></span>
            </button>
            <button onClick={() => start("carrier")} className="flex items-center gap-4 rounded-3xl border-2 border-line bg-white p-5 text-left active:border-brand active:bg-brand-soft">
              <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand"><Truck size={32} /></span>
              <span><span className="block text-xl font-bold leading-snug">У меня есть грузовик</span><span className="block text-ink-3">Я водитель или транспортная компания</span></span>
            </button>
          </div>
          <p className="mt-8 text-[0.95rem] text-ink-3">Это демо-версия: все люди, машины и цены выдуманные, СМС не отправляются.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col bg-white">
      <div className="mx-auto w-full max-w-xl px-2 pt-[max(8px,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <button onClick={() => setStep(step - 1)} className="flex h-12 items-center gap-0.5 rounded-xl pl-1 pr-3 text-base font-semibold text-brand active:bg-brand-soft"><ChevronLeft size={26} /> Назад</button>
          <span className="pr-3 font-semibold text-ink-3">Шаг {step} из 3</span>
        </div>
        <div className="mx-3 mt-1 h-1.5 overflow-hidden rounded-full bg-page"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(step / 3) * 100}%` }} /></div>
      </div>
      <div className="mx-auto w-full max-w-xl flex-1 px-5 pt-8">
        {step === 1 && (
          <>
            <h1 className="text-[1.9rem] font-bold leading-tight">Ваш номер телефона</h1>
            <p className="mt-2 text-lg text-ink-2">Пришлём СМС с кодом. Номер увидят только те, с кем вы договоритесь.</p>
            <label className="mt-7 flex h-16 items-center gap-3 rounded-2xl border-2 border-line-2 px-4 focus-within:border-brand">
              <span className="text-2xl font-semibold text-ink-3">+7</span>
              <input autoFocus inputMode="tel" aria-label="Номер телефона" value={fmtPhone(phone)} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="700 000 00 00" className="tnum w-full bg-transparent text-2xl font-semibold outline-none" />
            </label>
          </>
        )}
        {step === 2 && (
          <>
            <h1 className="text-[1.9rem] font-bold leading-tight">Введите код из СМС</h1>
            <p className="mt-2 text-lg text-ink-2">Отправили на +7 {fmtPhone(phone)}</p>
            <input
              autoFocus inputMode="numeric" autoComplete="one-time-code" aria-label="Код из СМС" value={code} maxLength={4}
              onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 4); setCode(v); if (v.length === 4) window.setTimeout(() => setStep(3), 250); }}
              placeholder="• • • •"
              className="tnum mt-7 h-20 w-full rounded-2xl border-2 border-line-2 text-center text-[2.4rem] font-bold tracking-[0.5em] outline-none focus:border-brand"
            />
            <p className="mt-3 rounded-xl bg-brand-soft px-4 py-3 text-brand-ink">Демо-версия: подойдёт любой код, например <b>1234</b>.</p>
          </>
        )}
        {step === 3 && (
          <>
            <h1 className="text-[1.9rem] font-bold leading-tight">{role === "client" ? "Как к вам обращаться?" : "Как вас зовут?"}</h1>
            <input autoFocus aria-label="Имя и фамилия" value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя и фамилия" className={`${inputCls} mt-6`} />
            {role === "client" ? (
              <>
                <div className="mt-6 mb-2 text-lg font-semibold">Компания <span className="font-normal text-ink-3">(если есть)</span></div>
                <input aria-label="Компания" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="ТОО или ИП" className={inputCls} />
              </>
            ) : (
              <>
                <div className="mt-6 mb-2 text-lg font-semibold">Вы работаете как</div>
                <div className="grid gap-2" role="radiogroup">
                  <Option selected={ctype === "driver"} onClick={() => setCtype("driver")} icon={<UserRound size={26} />} title="Водитель" hint="У меня одна машина, езжу сам" />
                  <Option selected={ctype === "company"} onClick={() => setCtype("company")} icon={<Building2 size={26} />} title="Транспортная компания" hint="Несколько машин и водителей" />
                </div>
              </>
            )}
          </>
        )}
      </div>
      <div className="mx-auto w-full max-w-xl px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-4">
        {step === 1 && <Button full disabled={phone.length < 10} onClick={() => setStep(2)}>Получить код</Button>}
        {step === 2 && <Button full disabled={code.length < 4} onClick={() => setStep(3)}>Продолжить</Button>}
        {step === 3 && <Button full disabled={!name.trim()} onClick={finish}>Готово</Button>}
      </div>
    </main>
  );
}
