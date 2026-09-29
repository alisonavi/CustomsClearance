"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, House, MessagesSquare, Plus, UserRound, X } from "lucide-react";
import { useMounted, useStore } from "@/lib/store";

export function Shell({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  if (!mounted) {
    return (
      <div className="corrugated grid min-h-dvh place-items-center">
        <span className="font-display text-[44px] font-extrabold uppercase tracking-[0.04em] text-white">Keruen</span>
      </div>
    );
  }
  return (
    <>
      <Toasts />
      <div className="pb-[calc(84px+env(safe-area-inset-bottom))]">{children}</div>
      <Nav />
    </>
  );
}

function Nav() {
  const path = usePathname();
  const { state } = useStore();
  if (path.startsWith("/chats/") || path.startsWith("/new")) return null;
  const unread = state.chats.filter((c) => c.role === state.role).reduce((n, c) => n + c.unread, 0);
  const newHref = state.role === "client" ? "/new/cargo" : "/new/truck";
  const item = (href: string, label: string, Icon: typeof House, badge?: number) => {
    const on = href === "/" ? path === "/" : path.startsWith(href);
    return (
      <Link href={href} className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11.5px] font-bold ${on ? "text-ink" : "text-ink-3"}`} aria-current={on ? "page" : undefined}>
        <Icon size={23} strokeWidth={on ? 2.6 : 2} aria-hidden />
        {label}
        {on && <span className="absolute top-0 h-[3px] w-8 bg-oxide" />}
        {!!badge && (
          <span className="absolute left-1/2 top-1 ml-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-oxide px-1 text-[11px] font-extrabold text-white">{badge}</span>
        )}
      </Link>
    );
  };
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <div className="mx-auto flex max-w-xl items-end px-1">
        {item("/", "Лента", House)}
        {item("/my", state.role === "client" ? "Мои грузы" : "Мои рейсы", Boxes)}
        <div className="flex flex-1 justify-center">
          <Link
            href={newHref}
            aria-label={state.role === "client" ? "Разместить груз" : "Разместить машину"}
            className="-mt-5 grid size-14 place-items-center rounded-[6px] border-2 border-ink bg-signal text-ink shadow-[0_6px_14px_-4px_rgba(0,0,0,0.35)] active:translate-y-px active:bg-signal-deep"
          >
            <Plus size={30} strokeWidth={3} />
          </Link>
        </div>
        {item("/chats", "Чаты", MessagesSquare, unread)}
        {item("/profile", "Профиль", UserRound)}
      </div>
    </nav>
  );
}

function Toasts() {
  const { toasts, dismiss } = useStore();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 pt-[max(10px,env(safe-area-inset-top))]" aria-live="polite">
      <div className="mx-auto flex max-w-xl flex-col gap-2 px-3">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-in pointer-events-auto flex items-start gap-3 rounded-[5px] border-2 border-ink px-3.5 py-3 shadow-[0_10px_28px_-8px_rgba(0,0,0,0.45)] ${t.tone === "seal" ? "bg-signal" : "bg-white"}`}>
            <Link href={t.href ?? "#"} onClick={() => dismiss(t.id)} className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-extrabold">{t.title}</div>
              <div className="line-clamp-2 text-[13.5px] text-ink-2">{t.body}</div>
            </Link>
            <button onClick={() => dismiss(t.id)} aria-label="Закрыть" className="-mr-1 grid size-7 shrink-0 place-items-center rounded-[3px] text-ink-3 active:bg-black/10">
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
