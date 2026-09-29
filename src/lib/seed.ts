// Demo data only. Every person, company, truck, price, rating and review here is synthetic.
import { CHINA_PERMIT, FLOW, type Status } from "./catalog";
import { isoDay } from "./format";
import { ME_CARRIER, ME_CLIENT, type Cargo, type Carrier, type Chat, type Client, type Driver, type Notif, type Review, type State, type Truck } from "./types";

const D = (n: number) => isoDay(n);
const M = (n: number) => Date.now() - n * 60000;
const H = (n: number) => M(n * 60);
const DAYS = (n: number) => H(n * 24);
const TIR = "TIR-карнет", CMR = "Страховка CMR", ADR = "Допуск ADR";

let r = 0;
const rv = (by: string, route: string, date: string, scores: number[], text?: string): Review => ({ id: `rv${++r}`, by, route, date, scores, text });

/** Build a status log up to `until`, spreading timestamps between `start` and `end`. */
function log(until: Status, start: number, end: number, skipCustoms = false) {
  const steps = FLOW.slice(0, FLOW.indexOf(until) + 1).filter((s) => !(skipCustoms && s === "customs"));
  return steps.map((s, i) => ({ s, at: Math.round(start + ((end - start) * i) / Math.max(1, steps.length - 1)) }));
}

export function seedClients(): Client[] {
  return [
    {
      id: ME_CLIENT, name: "Айгерим Сапарова", company: "ТОО «Жибек Жолы Импорт»", phone: "+7 700 000 00 00", verified: true, deals: 37, years: 4, rating: 4.9, ratingCount: 30,
      reviews: [
        rv("Ерлан Сапаров", "Хоргос (КНР) → Алматы", D(-25), [5, 5, 4, 5], "Загрузили быстро, оплата через день."),
        rv("Асхат Исмаилов", "Урумчи → Алматы", D(-60), [5, 4, 5, 5], "Всё чётко, документы были готовы заранее."),
      ],
    },
    { id: "c1", name: "Айдос Нуртаев", company: "ТОО «Каспий Агро»", phone: "+7 701 •• •• 11", verified: true, deals: 64, years: 6, rating: 4.8, ratingCount: 51, reviews: [rv("Бауыржан Ахметов", "Хоргос (РК) → Шымкент", D(-17), [4, 5, 5, 4], "Ждал на складе два часа, но оплатили сразу.")] },
    { id: "c2", name: "Гульнара Мухамедиева", company: "ИП Мухамедиева", phone: "+7 702 •• •• 22", verified: true, deals: 22, years: 2, rating: 4.9, ratingCount: 18, reviews: [rv("Дмитрий Ковалёв", "Хоргос (РК) → Астана", D(-30), [5, 5, 5, 5], "Отличный клиент, всё по договорённости.")] },
    { id: "c3", name: "Тимур Ли", company: "ТОО «Orda Electronics»", phone: "+7 705 •• •• 33", verified: true, deals: 118, years: 8, rating: 4.7, ratingCount: 96, reviews: [rv("Бауыржан Ахметов", "Урумчи → Алматы", D(-8), [5, 5, 5, 5], "Надёжный клиент, платит в срок.")] },
    { id: "c4", name: "Ерболат Кенжебаев", company: "ТОО «Атырау СтройСнаб»", phone: "+7 707 •• •• 44", verified: true, deals: 41, years: 3, rating: 4.6, ratingCount: 33, reviews: [rv("Канат Жусупов", "Алматы → Атырау", D(-40), [4, 4, 5, 5], "Груз был тяжелее, чем указали, на 1 т.")] },
    { id: "c5", name: "Анна Ким", company: "ТОО «Silk Cargo Group»", phone: "+7 708 •• •• 55", verified: true, deals: 203, years: 9, rating: 4.9, ratingCount: 170, reviews: [rv("Сергей Петренко", "Урумчи → Ташкент", D(-21), [5, 5, 5, 5], "Работаем давно, всегда всё чётко.")] },
    { id: "c6", name: "Кайрат Досанов", company: "ИП Досанов", phone: "+7 747 •• •• 66", verified: false, deals: 9, years: 1, rating: 4.4, ratingCount: 7, reviews: [] },
    { id: "c7", name: "Сауле Бекова", company: "ТОО «Алматы Текстиль Трейд»", phone: "+7 771 •• •• 77", verified: true, deals: 57, years: 5, rating: 4.8, ratingCount: 44, reviews: [] },
  ];
}

export function seedCarriers(): Carrier[] {
  const solo = ["d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8", "d9", "d10", "d11", "d12", "d13", "d14"];
  return [{ id: ME_CARRIER, name: "ИП Ахметов", type: "company" }, ...solo.map((id) => ({ id, name: "", type: "driver" as const }))];
}

export function seedDrivers(): Driver[] {
  const d = (id: string, carrierId: string, name: string, years: number, trips: number, rating: number, ratingCount: number, directions: string[], reviews: Review[] = [], phone = "+7 7•• ••• •• ••"): Driver =>
    ({ id, carrierId, name, phone, verified: true, years, trips, rating, ratingCount, directions, reviews });
  return [
    d("me-d1", ME_CARRIER, "Бауыржан Ахметов", 9, 214, 4.8, 120, ["Китай → Казахстан", "Хоргос — Алматы", "Алматы — Астана"], [
      rv("ТОО «Orda Electronics»", "Урумчи → Алматы", D(-8), [5, 5, 5, 5], "Бауыржан — лучший, всё время был на связи, на границе присылал фото."),
      rv("ТОО «Каспий Агро»", "Хоргос (РК) → Шымкент", D(-17), [4, 5, 4, 5], "Немного опоздал на загрузку, в остальном всё хорошо."),
    ], "+7 777 000 00 01"),
    d("me-d2", ME_CARRIER, "Серик Нурланов", 6, 150, 4.7, 80, ["Рефрижераторные перевозки", "Алматы — Астана"], [], "+7 777 000 00 02"),
    d("me-d3", ME_CARRIER, "Данияр Омаров", 3, 64, 4.6, 31, ["По Казахстану"], [], "+7 777 000 00 03"),
    d("d1", "d1", "Ерлан Сапаров", 12, 312, 4.9, 190, ["Китай → Казахстан", "Урумчи — Алматы"], [
      rv("ТОО «Жибек Жолы Импорт»", "Хоргос (КНР) → Алматы", D(-25), [5, 5, 5, 4], "Всё отлично, на границе держал в курсе."),
      rv("ТОО «Silk Cargo Group»", "Урумчи → Алматы", D(-44), [5, 5, 5, 5], "Приехал вовремя, груз в целости."),
    ]),
    d("d2", "d2", "Асхат Исмаилов", 6, 128, 4.7, 70, ["Китай → Казахстан", "Казахстан → Узбекистан"], [
      rv("ТОО «Orda Electronics»", "Урумчи → Шымкент", D(-15), [4, 5, 5, 5], "Стояли сутки на границе, но водитель предупредил заранее."),
    ]),
    d("d3", "d3", "Нурлан Жумабаев", 15, 540, 4.9, 300, ["Хоргос — Алматы, контейнеры"], [
      rv("ТОО «Атырау СтройСнаб»", "Хоргос (РК) → Алматы", D(-9), [5, 5, 5, 5], "Контейнер забрал и привёз день в день."),
    ]),
    d("d4", "d4", "Дмитрий Ковалёв", 8, 201, 4.6, 110, ["Хоргос — Астана", "Рефрижераторные перевозки"], [
      rv("ИП Мухамедиева", "Хоргос (РК) → Астана", D(-30), [4, 5, 5, 4], "Температуру держал как договаривались."),
    ]),
    d("d5", "d5", "Марат Тулегенов", 5, 95, 4.8, 50, ["Негабарит по Казахстану"]),
    d("d6", "d6", "Сергей Петренко", 14, 389, 4.7, 210, ["Китай → Казахстан → Узбекистан"], [
      rv("ТОО «Silk Cargo Group»", "Урумчи → Ташкент", D(-21), [5, 4, 5, 5], "Опытный водитель, знает все переходы."),
    ]),
    d("d7", "d7", "Руслан Абдрахманов", 2, 58, 4.5, 30, ["Казахстан → Китай"]),
    d("d8", "d8", "Виктор Ли", 10, 233, 4.9, 140, ["Хоргос — Алматы", "Продукты"]),
    d("d9", "d9", "Азамат Бекенов", 7, 167, 4.8, 95, ["Китай → Казахстан"]),
    d("d10", "d10", "Канат Жусупов", 11, 142, 4.6, 80, ["По Казахстану"]),
    d("d11", "d11", "Ли Вэй", 9, 176, 4.8, 100, ["Урумчи — Алматы", "Урумчи — Хоргос"], [], "+86 1•• •••• ••••"),
    d("d12", "d12", "Жандос Ермеков", 4, 610, 4.7, 300, ["Алматы и область"]),
    d("d13", "d13", "Бекзат Нуров", 8, 188, 4.8, 97, ["Китай → Казахстан"]),
    d("d14", "d14", "Олжас Касымов", 6, 121, 4.7, 66, ["Китай → Казахстан"]),
  ];
}

type TruckInit = Omit<Truck, "kind" | "loading" | "extras" | "photos" | "verified" | "state" | "carrierId"> & Partial<Truck>;
const truck = (x: TruckInit): Truck => ({
  kind: "fura", loading: ["back"], extras: [], photos: 3, verified: true, state: "free", carrierId: x.driverId, postedAt: H(2), ...x,
});

export function seedTrucks(): Truck[] {
  return [
    truck({ id: "t-me1", carrierId: ME_CARRIER, driverId: "me-d1", body: "tent", make: "MAN", model: "TGX 18.440", year: 2019, plate: "482 AKB 05", capacity: 20, volume: 86, dims: [13.6, 2.45, 2.7], loading: ["back", "side"], extras: ["Ремни", "Коники"],
      intl: { chinaEntry: true, lastTrip: D(-8), nextEntry: D(6), permits: [CHINA_PERMIT, TIR, CMR] }, at: "khorgos-kz", freeFrom: D(6), goingTo: ["almaty", "astana"], postedAt: M(90) }),
    truck({ id: "t-me2", carrierId: ME_CARRIER, driverId: "me-d2", body: "reefer", make: "Volvo", model: "FH 460", year: 2018, plate: "907 SNB 02", capacity: 18, volume: 76, dims: [13.4, 2.46, 2.6], temp: [-20, 20],
      intl: { chinaEntry: true, lastTrip: D(-27), permits: [CHINA_PERMIT, CMR] }, state: "trip", at: "almaty", freeFrom: D(2), goingTo: ["KZ"] }),
    truck({ id: "t-me3", carrierId: ME_CARRIER, driverId: "me-d3", body: "tent", make: "Shacman", model: "X3000", year: 2022, plate: "331 DAO 05", capacity: 22, volume: 90, dims: [13.6, 2.48, 2.75], loading: ["back", "side", "top"], extras: ["Растентовка"], photos: 2,
      intl: { chinaEntry: false, permits: [CMR] }, state: "off", at: "almaty", freeFrom: D(0), goingTo: [] }),
    truck({ id: "t1", driverId: "d1", body: "tent", make: "MAN", model: "TGX 18.480", year: 2020, plate: "215 BKA 06", capacity: 20, volume: 86, dims: [13.6, 2.45, 2.7], loading: ["back", "side"], extras: ["Ремни"],
      intl: { chinaEntry: true, lastTrip: D(-10), permits: [CHINA_PERMIT, TIR, CMR] }, at: "khorgos-cn", freeFrom: D(6), goingTo: ["KZ"], postedAt: M(35) }),
    truck({ id: "t2", driverId: "d2", body: "tent", make: "Volvo", model: "FH 500", year: 2017, plate: "907 ACX 13", capacity: 20, volume: 90, dims: [13.6, 2.48, 2.7], loading: ["back", "side", "top"], extras: ["Растентовка"],
      intl: { chinaEntry: true, lastTrip: D(-20), permits: [CHINA_PERMIT, TIR, CMR, ADR] }, at: "urumqi", freeFrom: D(7), goingTo: ["KZ", "UZ"], postedAt: M(50) }),
    truck({ id: "t3", driverId: "d3", body: "container", make: "DAF", model: "XF 480", year: 2016, plate: "118 NRZ 02", capacity: 28, volume: 67, dims: [12.2, 2.35, 2.7], loading: ["top"],
      intl: { chinaEntry: false, permits: [CMR] }, at: "almaty", freeFrom: D(1), goingTo: ["khorgos-kz"], postedAt: H(3) }),
    truck({ id: "t4", driverId: "d4", body: "reefer", make: "Scania", model: "R450", year: 2019, plate: "640 KDM 09", capacity: 18, volume: 76, dims: [13.4, 2.46, 2.6], temp: [-25, 25],
      intl: { chinaEntry: true, lastTrip: D(-15), permits: [CHINA_PERMIT, CMR] }, at: "khorgos-kz", freeFrom: D(6), goingTo: ["astana", "karaganda"], postedAt: H(1) }),
    truck({ id: "t5", driverId: "d5", body: "lowboy", make: "Howo", model: "T7H", year: 2021, plate: "072 MTT 04", capacity: 30, volume: 0, dims: [12, 3, 1], loading: ["top", "side"], extras: ["Коники", "Ремни"],
      intl: { chinaEntry: false, permits: [CMR] }, at: "zharkent", freeFrom: D(8), goingTo: ["aktobe", "atyrau"], postedAt: H(5) }),
    truck({ id: "t6", driverId: "d6", body: "tent", make: "Mercedes", model: "Actros 1845", year: 2018, plate: "719 SPK 07", capacity: 20, volume: 92, dims: [13.6, 2.48, 2.75], loading: ["back", "side"],
      intl: { chinaEntry: true, lastTrip: D(-12), permits: [CHINA_PERMIT, TIR, CMR] }, at: "urumqi", freeFrom: D(9), goingTo: ["shymkent", "tashkent"], postedAt: H(4) }),
    truck({ id: "t7", driverId: "d7", body: "isotherm", make: "Sitrak", model: "C7H", year: 2023, plate: "264 RAB 19", capacity: 20, volume: 82, dims: [13.6, 2.46, 2.6], verified: false,
      intl: { chinaEntry: true, lastTrip: D(-40), permits: [CHINA_PERMIT, CMR] }, at: "almaty", freeFrom: D(0), goingTo: ["CN"], postedAt: H(6) }),
    truck({ id: "t8", driverId: "d8", kind: "truck", body: "reefer", make: "Foton", model: "Auman", year: 2020, plate: "384 VLE 05", capacity: 15, volume: 50, dims: [9.6, 2.45, 2.4], temp: [-18, 12],
      intl: { chinaEntry: true, lastTrip: D(-6), permits: [CHINA_PERMIT, CMR] }, at: "khorgos-cn", freeFrom: D(7), goingTo: ["almaty"], postedAt: H(2) }),
    truck({ id: "t9", driverId: "d9", body: "tent", make: "Howo", model: "Max", year: 2021, plate: "610 ABK 16", capacity: 20, volume: 86, dims: [13.6, 2.45, 2.7], loading: ["back", "side"],
      intl: { chinaEntry: true, lastTrip: D(-3), nextEntry: D(13), permits: [CHINA_PERMIT, TIR, CMR] }, at: "khorgos-kz", freeFrom: D(6), goingTo: ["almaty", "shymkent"], postedAt: M(70) }),
    truck({ id: "t10", driverId: "d10", kind: "truck", body: "flatbed", make: "КамАЗ", model: "65207", year: 2019, plate: "553 KZH 02", capacity: 15, volume: 50, dims: [9.6, 2.5, 0.8], loading: ["back", "side", "top"], extras: ["Ремни"],
      intl: { chinaEntry: false, permits: [] }, at: "almaty", freeFrom: D(1), goingTo: ["KZ"], postedAt: H(8) }),
    truck({ id: "t11", driverId: "d11", body: "tent", make: "Sitrak", model: "C9H", year: 2022, plate: "新A 7K512", cnPlate: true, capacity: 25, volume: 100, dims: [13.75, 2.5, 2.9], loading: ["back", "side"],
      intl: { chinaEntry: true, lastTrip: D(-5), permits: [CHINA_PERMIT, TIR, CMR] }, at: "urumqi", freeFrom: D(6), goingTo: ["almaty", "khorgos-kz"], postedAt: M(20) }),
    truck({ id: "t12", driverId: "d12", kind: "small", body: "isotherm", make: "ГАЗ", model: "ГАЗель Next", year: 2021, plate: "716 ZHE 02", capacity: 1.5, volume: 12, dims: [3.1, 2.0, 1.9], loading: ["back", "side"],
      intl: { chinaEntry: false, permits: [] }, at: "almaty", freeFrom: D(0), goingTo: ["almaty", "taldykorgan"], postedAt: H(1) }),
  ];
}

/** Trucks that "pop up" for the client while the app is open (they match the Урумчи → Алматы request). */
export function poolTrucks(): Truck[] {
  return [
    truck({ id: "p1", driverId: "d13", body: "tent", make: "Volvo", model: "FH 460", year: 2020, plate: "144 BNR 05", capacity: 20, volume: 86, dims: [13.6, 2.45, 2.7], loading: ["back", "side"],
      intl: { chinaEntry: true, lastTrip: D(-14), permits: [CHINA_PERMIT, TIR, CMR] }, at: "urumqi", freeFrom: D(6), goingTo: ["almaty"] }),
    truck({ id: "p2", driverId: "d14", body: "tent", make: "DAF", model: "XF 480", year: 2019, plate: "802 OKS 01", capacity: 20, volume: 92, dims: [13.6, 2.48, 2.75],
      intl: { chinaEntry: true, lastTrip: D(-18), permits: [CHINA_PERMIT, CMR] }, at: "khorgos-cn", freeFrom: D(7), goingTo: ["KZ"] }),
  ];
}

type CargoInit = Omit<Cargo, "offers" | "log" | "status" | "bodies" | "flex" | "priceMode"> & Partial<Cargo>;
const cargo = (x: CargoInit): Cargo => ({ offers: [], status: "published", log: [{ s: "published", at: x.createdAt }], bodies: [], flex: 1, priceMode: "offers", ...x });

export function seedCargo(): Cargo[] {
  return [
    // ---- the client persona's requests ----
    cargo({
      id: "r1", clientId: ME_CLIENT, from: "urumqi", fromPoint: "Склад поставщика", to: "almaty", toPoint: "СВХ Алматы", customs: { where: "kazakhstan" },
      title: "Кондиционеры и бытовая техника", note: "Хрупкое, не кантовать", category: "electronics", weight: 18, volume: 70, places: 26, packaging: "pallets", stackable: false,
      bodies: ["tent"], loading: ["back", "side"], date: D(7), flex: 1, createdAt: M(45), status: "offers", log: [{ s: "published", at: M(45) }, { s: "offers", at: M(30) }],
      offers: [
        { id: "o1", truckId: "t1", price: 1180000, note: "Стою в Хоргосе (КНР), 5-го могу загрузиться", at: M(30), status: "new", by: "carrier" },
        { id: "o2", truckId: "t2", price: 1250000, note: "Свободен 6-го, можно боковую загрузку", at: M(18), status: "new", by: "carrier" },
        { id: "o3", truckId: "t11", price: 1120000, note: "Я в Урумчи, машина 25 т, есть TIR", at: M(8), status: "new", by: "carrier" },
      ],
    }),
    cargo({
      id: "r2", clientId: ME_CLIENT, from: "khorgos-kz", fromPoint: "Сухой порт Хоргос", to: "almaty", toPoint: "СВХ Алматы", customs: { where: "post", post: "svh-almaty" },
      title: "Одежда, контейнер 40 футов", category: "textile", weight: 20, volume: 67, packaging: "container", bodies: ["container"], loading: ["top"],
      date: D(0), flex: 0, priceMode: "fixed", price: 290000, createdAt: H(8), status: "in_transit", log: log("in_transit", H(8), H(1), true),
      offers: [{ id: "o4", truckId: "t3", price: 290000, at: H(7.5), status: "accepted", by: "carrier" }], deal: { truckId: "t3", price: 290000 },
    }),
    cargo({
      id: "r3", clientId: ME_CLIENT, from: "urumqi", to: "astana", customs: { where: "border", post: "nurzholy" }, title: "Ткани в рулонах", category: "textile", weight: 20, volume: 86, packaging: "none",
      bodies: ["tent"], date: D(-11), flex: 0, priceMode: "fixed", price: 1450000, createdAt: DAYS(12), status: "done", log: log("done", DAYS(12), DAYS(3)),
      offers: [{ id: "o5", truckId: "t2", price: 1450000, at: DAYS(12), status: "accepted", by: "carrier" }], deal: { truckId: "t2", price: 1450000 },
    }),
    cargo({
      id: "r4", clientId: ME_CLIENT, from: "khorgos-cn", to: "almaty", customs: { where: "border", post: "nurzholy" }, title: "Керамическая плитка", category: "building", weight: 22, volume: 40, packaging: "pallets",
      bodies: ["tent", "flatbed"], date: D(-27), flex: 0, priceMode: "fixed", price: 430000, createdAt: DAYS(28), status: "rated", log: log("rated", DAYS(28), DAYS(25)),
      offers: [{ id: "o6", truckId: "t1", price: 430000, at: DAYS(28), status: "accepted", by: "carrier" }], deal: { truckId: "t1", price: 430000 },
      byClient: rv("ТОО «Жибек Жолы Импорт»", "Хоргос (КНР) → Алматы", D(-25), [5, 5, 5, 4], "Всё отлично, на границе держал в курсе."),
      byCarrier: rv("Ерлан Сапаров", "Хоргос (КНР) → Алматы", D(-25), [5, 5, 4, 5], "Загрузили быстро, оплата через день."),
    }),
    // ---- other clients' open requests ----
    cargo({ id: "k1", clientId: "c3", from: "urumqi", fromPoint: "Склад поставщика", to: "almaty", toPoint: "СВХ Алматы", customs: { where: "kazakhstan" }, title: "Кондиционеры, 240 коробок", category: "electronics",
      weight: 16, volume: 68, places: 240, packaging: "boxes", stackable: true, bodies: ["tent", "container"], date: D(7), flex: 1, priceMode: "fixed", price: 1150000, createdAt: M(12) }),
    cargo({ id: "k2", clientId: "c5", from: "khorgos-cn", to: "astana", customs: { where: "border", post: "nurzholy" }, title: "Автозапчасти, 32 паллеты", category: "parts",
      weight: 17, volume: 82, places: 32, packaging: "pallets", stackable: false, bodies: ["tent"], date: D(6), flex: 2, createdAt: M(40), status: "offers", log: [{ s: "published", at: M(40) }, { s: "offers", at: M(25) }],
      offers: [
        { id: "o7", truckId: "t-me1", price: 1250000, note: "Могу 5-го, есть TIR", at: M(25), status: "new", by: "carrier" },
        { id: "o8", truckId: "t6", price: 1300000, at: M(22), status: "new", by: "carrier" },
      ] }),
    cargo({ id: "k3", clientId: "c7", from: "yiwu", to: "almaty", customs: { where: "china" }, title: "Одежда и обувь", category: "textile", weight: 12, volume: 86, places: 520, packaging: "boxes", stackable: true,
      bodies: ["tent"], date: D(9), flex: 2, priceMode: "fixed", price: 2900000, createdAt: H(1) }),
    cargo({ id: "k4", clientId: "c2", from: "khorgos-kz", to: "shymkent", customs: { where: "border", post: "nurzholy" }, title: "Мандарины", note: "Температура +4…+6 °C, срочно", category: "food", weight: 19, volume: 70, places: 1900, packaging: "boxes",
      bodies: ["reefer"], temp: [4, 6], date: D(0), flex: 0, urgent: true, priceMode: "fixed", price: 690000, createdAt: M(50) }),
    cargo({ id: "k5", clientId: "c1", from: "urumqi", to: "shymkent", customs: { where: "post", post: "svh-shymkent" }, title: "Оборудование для цеха", note: "6 ящиков, самый тяжёлый — 5 т", category: "equipment", weight: 21, volume: 60, places: 6, packaging: "none", stackable: false,
      bodies: ["tent", "flatbed"], extras: ["Ремни"], date: D(8), flex: 3, createdAt: H(1.5) }),
    cargo({ id: "k6", clientId: "c1", from: "almaty", to: "urumqi", customs: { where: "kazakhstan" }, title: "Мука в мешках", category: "food", weight: 20, volume: 40, places: 400, packaging: "bags", stackable: true,
      bodies: ["tent"], date: D(3), flex: 1, createdAt: H(3) }),
    cargo({ id: "k7", clientId: "c6", from: "khorgos-kz", to: "karaganda", title: "Текстиль, догруз 40 мест", category: "textile", weight: 6, volume: 30, places: 40, packaging: "boxes", stackable: true,
      date: D(7), flex: 1, priceMode: "fixed", price: 330000, createdAt: H(2) }),
    cargo({ id: "k8", clientId: "c4", from: "almaty", to: "atyrau", title: "Стройматериалы", category: "building", weight: 20, volume: 86, places: 33, packaging: "pallets",
      bodies: ["tent"], date: D(8), flex: 1, priceMode: "fixed", price: 980000, createdAt: H(4) }),
    cargo({ id: "k9", clientId: "c5", from: "urumqi", to: "tashkent", customs: { where: "post", post: "nurzholy" }, title: "Бытовая техника, транзит", note: "Транзит через Казахстан, нужен TIR-карнет", category: "electronics", weight: 16, volume: 82, places: 300, packaging: "boxes",
      bodies: ["tent"], date: D(9), flex: 2, createdAt: H(5) }),
    cargo({ id: "k10", clientId: "c4", from: "khorgos-cn", to: "almaty", customs: { where: "border", post: "nurzholy" }, title: "Керамическая плитка на паллетах", category: "building", weight: 19, volume: 40, places: 22, packaging: "pallets", stackable: false,
      bodies: ["tent", "flatbed"], date: D(6), flex: 1, priceMode: "fixed", price: 430000, createdAt: H(6),
      offers: [{ id: "o9", truckId: "t-me1", price: 430000, at: M(15), status: "new", by: "client" }] }),
    // ---- the carrier persona's trips ----
    cargo({ id: "kt1", clientId: "c2", from: "almaty", to: "astana", title: "Молочная продукция", category: "food", weight: 16, volume: 60, places: 20, packaging: "pallets", bodies: ["reefer"], temp: [2, 6],
      date: D(-1), flex: 0, priceMode: "fixed", price: 820000, createdAt: DAYS(2), status: "in_transit", log: log("in_transit", DAYS(2), H(5), true),
      offers: [{ id: "o10", truckId: "t-me2", price: 820000, at: DAYS(2), status: "accepted", by: "carrier" }], deal: { truckId: "t-me2", price: 820000 } }),
    cargo({ id: "kh1", clientId: "c3", from: "urumqi", to: "almaty", customs: { where: "kazakhstan" }, title: "Смартфоны и планшеты", category: "electronics", weight: 8, volume: 40, packaging: "boxes", bodies: ["tent"],
      date: D(-8), flex: 0, priceMode: "fixed", price: 980000, createdAt: DAYS(9), status: "rated", log: log("rated", DAYS(9), DAYS(6)),
      offers: [{ id: "o11", truckId: "t-me1", price: 980000, at: DAYS(9), status: "accepted", by: "carrier" }], deal: { truckId: "t-me1", price: 980000 },
      byClient: rv("ТОО «Orda Electronics»", "Урумчи → Алматы", D(-6), [5, 5, 5, 5], "Бауыржан — лучший, всё время был на связи, на границе присылал фото."),
      byCarrier: rv("Бауыржан Ахметов", "Урумчи → Алматы", D(-6), [5, 5, 5, 5], "Надёжный клиент, платит в срок.") }),
    cargo({ id: "kh2", clientId: "c1", from: "khorgos-kz", to: "shymkent", title: "Сахар в мешках", category: "food", weight: 20, volume: 40, packaging: "bags", bodies: ["tent"],
      date: D(-17), flex: 0, priceMode: "fixed", price: 610000, createdAt: DAYS(18), status: "rated", log: log("rated", DAYS(18), DAYS(15), true),
      offers: [{ id: "o12", truckId: "t-me3", price: 610000, at: DAYS(18), status: "accepted", by: "carrier" }], deal: { truckId: "t-me3", price: 610000 },
      byClient: rv("ТОО «Каспий Агро»", "Хоргос (РК) → Шымкент", D(-15), [4, 5, 4, 5], "Немного опоздал на загрузку, в остальном всё хорошо."),
      byCarrier: rv("Бауыржан Ахметов", "Хоргос (РК) → Шымкент", D(-15), [4, 5, 5, 4], "Ждал на складе два часа, но оплатили сразу.") }),
  ];
}

/** Loads that "pop up" for the carrier while the app is open (they match MAN TGX in Хоргос). */
export function poolCargo(): Cargo[] {
  return [
    cargo({ id: "q1", clientId: "c7", from: "khorgos-cn", to: "almaty", customs: { where: "border", post: "nurzholy" }, title: "Ткани в рулонах", category: "textile", weight: 17, volume: 80, places: 60, packaging: "none",
      bodies: ["tent"], date: D(7), flex: 1, priceMode: "fixed", price: 450000, createdAt: Date.now() }),
    cargo({ id: "q2", clientId: "c1", from: "khorgos-kz", to: "astana", title: "Подсолнечное масло", category: "food", weight: 20, volume: 40, places: 20, packaging: "pallets",
      bodies: ["tent", "isotherm"], date: D(6), flex: 0, priceMode: "fixed", price: 820000, createdAt: Date.now() }),
  ];
}

export function seedChats(): Chat[] {
  return [
    { id: "ch1", clientId: ME_CLIENT, carrierId: "d3", driverId: "d3", cargoId: "r2", unread: { client: 1, carrier: 0 }, msgs: [
      { id: "a1", from: "system", text: "Перевозчик выбран · 290 000 ₸", at: H(7) },
      { id: "a2", from: "carrier", text: "Айгерим, здравствуйте. Контейнер забираю в 14:00 с терминала.", at: H(6.5) },
      { id: "a3", from: "client", text: "Хорошо. Пропуск на вас заказан.", at: H(6.4) },
      { id: "a4", from: "carrier", text: "Загрузился, выезжаю. Буду в Алматы около 21:00.", at: M(60) },
    ] },
    { id: "ch2", clientId: ME_CLIENT, carrierId: "d1", driverId: "d1", cargoId: "r1", unread: { client: 1, carrier: 0 }, msgs: [
      { id: "b1", from: "carrier", text: "Здравствуйте! Груз на паллетах? Можно загрузить сбоку?", at: M(28) },
    ] },
    { id: "ch3", clientId: "c2", carrierId: ME_CARRIER, driverId: "me-d2", cargoId: "kt1", unread: { client: 0, carrier: 1 }, msgs: [
      { id: "e1", from: "system", text: "Вас выбрали перевозчиком · 820 000 ₸", at: DAYS(2) },
      { id: "e2", from: "client", text: "Температуру держите +4, пожалуйста.", at: H(20) },
      { id: "e3", from: "carrier", text: "Да, реф настроен на +4.", at: H(19) },
      { id: "e4", from: "client", text: "Во сколько будете в Астане?", at: M(20) },
    ] },
    { id: "ch4", clientId: "c5", carrierId: ME_CARRIER, driverId: "me-d1", cargoId: "k2", unread: { client: 0, carrier: 0 }, msgs: [
      { id: "f1", from: "carrier", text: "Добрый день! Могу загрузиться 5-го, машина 20 т / 86 м³, есть TIR.", at: M(25) },
      { id: "f2", from: "client", text: "Спасибо, рассмотрим до вечера.", at: M(21) },
    ] },
  ];
}

export function seedNotifs(): Notif[] {
  const n = (id: string, role: Notif["role"], kind: Notif["kind"], title: string, body: string, href: string, at: number, read = false): Notif => ({ id, role, kind, title, body, href, at, read });
  return [
    n("n1", "client", "offer", "Новое предложение: 1 120 000 ₸", "Ли Вэй · Урумчи → Алматы", "/cargo/r1", M(8)),
    n("n2", "client", "message", "Сообщение от Нурлана Жумабаева", "Загрузился, выезжаю. Буду в Алматы около 21:00.", "/chats/ch1", M(60)),
    n("n3", "client", "status", "Груз в пути", "Хоргос (РК) → Алматы · Нурлан Жумабаев", "/cargo/r2", H(1), true),
    n("n4", "client", "match_truck", "Нашли подходящие машины", "Для заявки Урумчи → Алматы", "/cargo/r1", M(45), true),
    n("n5", "client", "rate", "Оцените перевозку", "Урумчи → Астана завершена. Как всё прошло?", "/cargo/r3", DAYS(3), true),
    n("n6", "carrier", "proposal", "Клиент предлагает груз", "ТОО «Атырау СтройСнаб» · Хоргос (КНР) → Алматы · 430 000 ₸", "/cargo/k10", M(15)),
    n("n7", "carrier", "match_cargo", "Подходящий груз для MAN TGX", "Урумчи → Алматы · 16 т · 1 150 000 ₸", "/cargo/k1", M(12)),
    n("n8", "carrier", "message", "Сообщение от ИП Мухамедиева", "Во сколько будете в Астане?", "/chats/ch3", M(20)),
    n("n9", "carrier", "loading_soon", "Машина скоро освободится", "MAN TGX · 482 AKB 05 свободна через 6 дней. Подберите груз заранее.", "/fleet/t-me1", H(3), true),
  ];
}

export function seedState(): State {
  return {
    v: 2,
    user: { registered: false, role: "client", phone: "", clientName: "Айгерим Сапарова", company: "ТОО «Жибек Жолы Импорт»", carrierName: "Бауыржан Ахметов", carrierType: "company" },
    clients: seedClients(), carriers: seedCarriers(), drivers: seedDrivers(), trucks: seedTrucks(), cargo: seedCargo(),
    chats: seedChats(), notifs: seedNotifs(), saved: [],
    q: {
      client: { f: { kinds: [], bodies: [], scope: "all", verifiedOnly: false, sort: "match" } },
      carrier: { from: { type: "city", id: "khorgos-kz" }, truckId: "t-me1", f: { radius: 150, categories: [], customs: [], fitTruck: true, sort: "new" } },
    },
    recent: [],
    bigText: false,
    popped: 0,
  };
}
