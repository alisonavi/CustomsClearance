# Product

<!-- impeccable:product-schema 1 -->

> Source of truth: `check/reqs.md` (the owner's technical spec, "техническое задание", plus four directives at the top). Lines marked **(assumption)** were inferred.

## Platform

web (mobile-first)

## Stack

Next.js (App Router) + Tailwind CSS. Frontend only for now: data is hardcoded and kept in browser state. There is no backend yet.

## Users

- **Client (shipper).** Needs to move cargo, mainly from China into Kazakhstan (e.g. "Китай → Алматы").
- **Driver / truck owner.** Registers trucks, says where and when a truck is free, searches for loads and bids.
- **Transport company.** One account for several trucks and drivers.
- Most of them are grown men who are not comfortable with apps. Today they work through WhatsApp groups, phone calls and brokers at the border.

## Product Purpose

Replace "post in several WhatsApp groups → call people you know → look for a truck at the border → negotiate by hand" with "describe the cargo → get matching trucks → compare → choose a carrier". For carriers: "say where and when the truck is free → get matching loads". Success means fewer empty runs and less time to find a truck or a load.

## Positioning

- Automatic matching of cargo and trucks. It takes into account route, dates, weight, volume, body type, temperature and whether the truck can make an international run.
- China ↔ Kazakhstan specifics are built in: where customs clearance happens, and border-crossing readiness for each truck (China entry, last international run, next possible crossing, permits).

## Operating Context

- Business processes follow DAT One: post a load or a truck, the system shows matches, then bid or book, then track the status, then both sides rate each other. Saved searches notify you about new matches.
- The price can be fixed by the client or requested from carriers, inDrive-style.
- Order lifecycle: Опубликован → Получены предложения → Перевозчик выбран → Машина едет на загрузку → Загрузка → В пути → Таможенное оформление → Доставка → Завершено → Оценка сторон.
- **(assumption)** Money is in tenge (₸). The UI is in Russian. Kazakh and Chinese come later (spec §18).

## Capabilities and Constraints

- The MVP scope follows spec §16: registration, driver profile, adding a truck, creating a request, load search, truck search, filters, bids, price offers, choosing a carrier, chat, statuses, ratings and reviews, history.
- The map is optional for the MVP. It shows only an approximate truck location (city level).
- The border-crossing rules are placeholders. The real legal limits still need to be checked (spec §14).

## Brand Commitments

- Directives from the owner: a white and blue look; a minimal search like Yandex's; filters like inDrive's; business processes like DAT One's.
- As simple as possible: big text, big buttons, every icon labelled, one main action per screen, step-by-step forms.
- "Keruen" is a placeholder name.

## Evidence on Hand

No real users, prices, reviews or partners yet. Every person, company, truck, price and rating in the app is synthetic demo data.

## Product Principles

1. One question per screen, one main button per screen.
2. Route, date, weight and price are always readable at a glance.
3. The app always says why a truck or a load fits, criterion by criterion.
4. Customs and border readiness are shown upfront, never buried.
5. Calling or messaging the other side is always one tap away.

## Accessibility & Inclusion

Older, less tech-comfortable users: base text of 17px or more, tap targets of 48–56px, high contrast, plain Russian without jargon, and a "Крупный текст" (large text) option.
