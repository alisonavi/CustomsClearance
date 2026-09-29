# Product

<!-- impeccable:product-schema 1 -->

> Written from the owner's one-paragraph brief. There was no interview because the owner asked for speed. Lines marked **(assumption)** were inferred and still need confirming.

## Platform

web

## Stack

Next.js (App Router) + Tailwind CSS. Frontend only for now: all data is hardcoded or kept in browser state. There is no backend yet.

## Users

- **Shipper (client).** Has goods to move, often cargo that has just cleared customs at the Khorgos border with China, going to a city in Kazakhstan. Example from the brief: "I have 15 tonnes from Khorgos to Atyrau for a certain amount."
- **Truck driver (carrier).** Owns or drives a truck and looks for loads. Also announces "I'm here, I have a truck, I can go" so shippers can find them.

## Product Purpose

A two-sided freight board for the border corridor, modelled on inDrive's "name your price" mechanic:

- A shipper posts cargo with a route, weight and proposed price. A driver accepts it at that price or counters.
- A driver posts a free truck with location, direction and capacity. The post pops up for shippers, who can offer it a load.
- Client and driver chat inside the app about the deal.

Success means a load and a truck agree on a price and start talking in minutes, not after hours in WhatsApp groups.

## Positioning

Price negotiation happens in the open on each order (offer, counter, accept), and the listings are built around the customs border. Each order shows its customs status: already cleared, needs clearance, or moving under customs control.

## Operating Context

- **(assumption)** The market is Kazakhstan. The main corridor runs from the Khorgos / Nur Zholy crossing to cities across the country (Almaty, Astana, Shymkent, Aktobe, Atyrau, Aktau…).
- **(assumption)** Drivers mostly use the app on a mid-range phone in the cab or in the border queue, one-handed, often in bright daylight. The product is mobile-first.
- **(assumption)** Money is in tenge (₸). The UI is in Russian by default with an English toggle.

## Capabilities and Constraints

- Two roles, switchable in the app: client and driver.
- Cargo orders: route, cargo type, weight, volume, truck body type, date, customs status, proposed price, comment.
- Driver offers on cargo: accept at the price, or counter-offer.
- Truck posts: current city, where the driver can go, body type, capacity, available-from date, rate.
- Chats between client and driver.
- Hardcoded demo data. Nothing persists beyond the browser. There is no auth, payments or map yet.

## Brand Commitments

None given. **(assumption)** The working name "Keruen" (Kazakh "керуен", caravan) is a placeholder.

## Evidence on Hand

No real users, prices, reviews or partners yet. Every person, truck, price and rating in the app is synthetic demo data and must not be presented as real.

## Product Principles

1. The route and the price are always the first thing you read.
2. Every negotiation is one tap from accepting and one tap from countering.
3. Customs status is shown upfront, never hidden in the details.
4. Built for one hand and bright daylight.
