"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ClipboardList, MessageCircle, PlusCircle, Route, Search, Truck, UserRound, X } from "lucide-react";
import { useMounted, useStore } from "@/lib/store";
import { isOpen } from "@/lib/catalog";
import { ME_CARRIER, ME_CLIENT } from "@/lib/types";

const HIDE_NAV = ["/welcome", "/new", "/fleet/add", "/chats/", "/map"];

export function Shell({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  const { s } = useStore();
  const path = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (mounted && !s.user.registered && path !== "/welcome") router.replace("/welcome");
  }, [mounted, s.user.registered, path, router]);
  useEffect(() => {
    document.documentElement.classList.toggle("big", s.bigText);
  }, [s.bigText]);

  if (!mounted || (!s.user.registered && path !== "/welcome")) {
    return <div className="grid min-h-dvh place-items-center bg-white"><span className="text-3xl font-bold text-brand">Keruen</span></div>;
  }
  const nav = !HIDE_NAV.some((p) => (p.endsWith("/") ? path.startsWith(p) : path === p));
  return (
    <>
      <Toasts />
      <div className={nav ? "pb-[calc(76px+env(safe-area-inset-bottom))]" : ""}>{children}</div>
      {nav && <Nav />}
    </>
  );
}

function Nav() {
  const path = usePathname();
  const { s } = useStore();
  const role = s.user.role;
  const unread = s.chats.filter((c) => (role === "client" ? c.clientId === ME_CLIENT : c.carrierId === ME_CARRIER)).reduce((n, c) => n + c.unread[role], 0);
  const newOffers = s.cargo.filter((c) => c.clientId === ME_CLIENT && isOpen(c.status)).reduce((n, c) => n + c.offers.filter((o) => o.status === "new" && o.by === "carrier").length, 0);
  const proposals = s.cargo.filter((c) => isOpen(c.status)).reduce((n, c) => n + c.offers.filter((o) => o.status === "new" && o.by === "client" && s.trucks.find((t) => t.id === o.truckId)?.carrierId === ME_CARRIER).length, 0);

  const items = role === "client"
    ? [
        { href: "/", label: "Поиск", Icon: Search },
        { href: "/orders", label: "Заявки", Icon: ClipboardList, badge: newOffers },
        { href: "/new", label: "Разместить", Icon: PlusCircle, main: true },
        { href: "/chats", label: "Сообщения", Icon: MessageCircle, badge: unread },
        { href: "/profile", label: "Профиль", Icon: UserRound },
      ]
    : [
        { href: "/", label: "Поиск", Icon: Search },
        { href: "/orders", label: "Рейсы", Icon: Route, badge: proposals },
        { href: "/fleet", label: "Транспорт", Icon: Truck },
        { href: "/chats", label: "Сообщения", Icon: MessageCircle, badge: unread },
        { href: "/profile", label: "Профиль", Icon: UserRound },
      ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)]" aria-label="Главное меню">
      <div className="mx-auto grid max-w-xl grid-cols-5">
        {items.map(({ href, label, Icon, badge, main }) => {
          const on = href === "/" ? path === "/" || path === "/search" : path.startsWith(href);
          return (
            <Link key={href} href={href} aria-current={on ? "page" : undefined}
              className={`relative flex min-h-[68px] flex-col items-center justify-center gap-1 text-[0.8rem] font-semibold ${on ? "text-brand" : "text-ink-3"}`}>
              {main ? (
                <span className="grid size-10 place-items-center rounded-full bg-brand text-white"><Icon size={24} strokeWidth={2.4} aria-hidden /></span>
              ) : (
                <Icon size={26} strokeWidth={on ? 2.5 : 2} aria-hidden />
              )}
              {label}
              {!!badge && <span className="absolute left-1/2 top-1.5 ml-2 grid h-5 min-w-5 place-items-center rounded-full bg-bad px-1.5 text-xs font-bold text-white">{badge}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Toasts() {
  const { toasts, dismiss } = useStore();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] px-3 pt-[max(10px,env(safe-area-inset-top))]" aria-live="polite">
      <div className="mx-auto flex max-w-xl flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="toast-in pointer-events-auto flex items-start gap-2 rounded-2xl border border-line bg-white p-4 shadow-[0_10px_30px_-8px_rgba(14,26,43,0.35)]">
            <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-brand" aria-hidden />
            <Link href={t.href ?? "#"} onClick={() => dismiss(t.id)} className="min-w-0 flex-1">
              <div className="font-bold leading-snug">{t.title}</div>
              <div className="line-clamp-2 text-[0.95rem] text-ink-2">{t.body}</div>
            </Link>
            <button onClick={() => dismiss(t.id)} aria-label="Закрыть уведомление" className="-mr-1 -mt-1 grid size-9 shrink-0 place-items-center rounded-xl text-ink-3 active:bg-page">
              <X size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
