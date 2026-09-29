// Demo data only. Every person, company, truck, price and rating here is synthetic.

export type Role = "client" | "driver";
export type Body = "tent" | "reefer" | "isotherm" | "container" | "flatbed" | "lowboy";
export type Customs = "cleared" | "needs" | "transit";

export const CITIES = {
  khorgos: { name: "Хоргос", lat: 44.21, lon: 80.41 },
  zharkent: { name: "Жаркент", lat: 44.16, lon: 80.0 },
  almaty: { name: "Алматы", lat: 43.24, lon: 76.89 },
  astana: { name: "Астана", lat: 51.17, lon: 71.45 },
  shymkent: { name: "Шымкент", lat: 42.34, lon: 69.59 },
  karaganda: { name: "Караганда", lat: 49.8, lon: 73.1 },
  aktobe: { name: "Актобе", lat: 50.28, lon: 57.21 },
  atyrau: { name: "Атырау", lat: 47.1, lon: 51.92 },
  aktau: { name: "Актау", lat: 43.65, lon: 51.17 },
  uralsk: { name: "Уральск", lat: 51.23, lon: 51.37 },
  kostanay: { name: "Костанай", lat: 53.21, lon: 63.63 },
  pavlodar: { name: "Павлодар", lat: 52.29, lon: 76.97 },
  taraz: { name: "Тараз", lat: 42.9, lon: 71.37 },
  kyzylorda: { name: "Кызылорда", lat: 44.85, lon: 65.51 },
  oskemen: { name: "Усть-Каменогорск", lat: 49.95, lon: 82.61 },
  tashkent: { name: "Ташкент", lat: 41.31, lon: 69.28 },
  bishkek: { name: "Бишкек", lat: 42.87, lon: 74.59 },
  moscow: { name: "Москва", lat: 55.75, lon: 37.62 },
} as const;
export type CityId = keyof typeof CITIES;
export const CITY_IDS = Object.keys(CITIES) as CityId[];
export const city = (id: CityId) => CITIES[id].name;

export const BODIES: Record<Body, { name: string; rate: number }> = {
  tent: { name: "Тент", rate: 360 },
  reefer: { name: "Реф", rate: 450 },
  isotherm: { name: "Изотерм", rate: 400 },
  container: { name: "Контейнер", rate: 380 },
  flatbed: { name: "Борт", rate: 340 },
  lowboy: { name: "Трал", rate: 620 },
};
export const BODY_IDS = Object.keys(BODIES) as Body[];

export const CUSTOMS: Record<Customs, { name: string; hint: string }> = {
  cleared: { name: "Растаможен", hint: "Выпуск разрешён, документы на руках" },
  needs: { name: "Нужна растаможка", hint: "Декларирование на границе или на СВХ" },
  transit: { name: "Транзит под пломбой", hint: "Едет под таможенным контролем (ТД / TIR)" },
};

export type Client = { id: string; name: string; company: string; rating: number; deals: number };
export type Driver = {
  id: string; name: string; rating: number; trips: number; truck: string; plate: string; years: number; docs: string[];
};
export type Offer = { id: string; driverId: string; price: number; note: string; at: number };
export type Cargo = {
  id: string; from: CityId; to: CityId; what: string; body: Body; weight: number; volume: number; price: number;
  date: string; customs: Customs; clientId: string; comment?: string; at: number; mine?: boolean; offers: Offer[];
  status: "open" | "sealed"; dealDriverId?: string; dealPrice?: number; seal?: string; fresh?: boolean;
  bid?: { price: number; status: "pending" | "accepted" | "declined" };
};
export type Invite = {
  id: string; clientId: string; from: CityId; to: CityId; what: string; weight: number; price: number;
  status: "new" | "accepted" | "declined"; at: number;
};
export type Truck = {
  id: string; driverId: string; from: CityId; to: CityId[]; body: Body; capacity: number; volume: number; date: string;
  rate: number; rateType: "trip" | "km"; comment?: string; at: number; mine?: boolean; invites: Invite[]; fresh?: boolean;
  sent?: { cargoId: string; status: "pending" | "accepted" };
};
export type Msg = { id: string; from: "me" | "peer" | "system"; text: string; at: number };
export type Chat = {
  id: string; role: Role; peerId: string; subject?: { from: CityId; to: CityId; price: number };
  msgs: Msg[]; unread: number; typing?: boolean;
};

export const ME_CLIENT: Client = { id: "me-client", name: "Айгерим Сапарова", company: "ТОО «Жибек Жолы Импорт»", rating: 4.9, deals: 37 };
export const ME_DRIVER: Driver = {
  id: "me-driver", name: "Бауыржан Ахметов", rating: 4.8, trips: 214, truck: "MAN TGX 18.440 · тент", plate: "482 AKB 05", years: 9, docs: ["TIR", "CMR"],
};

export const DRIVERS: Driver[] = [
  ME_DRIVER,
  { id: "d1", name: "Ерлан Сапаров", rating: 4.9, trips: 312, truck: "MAN TGX · тент", plate: "215 BKA 06", years: 12, docs: ["TIR", "CMR"] },
  { id: "d2", name: "Асхат Исмаилов", rating: 4.7, trips: 128, truck: "Volvo FH 460 · тент", plate: "907 ACX 13", years: 6, docs: ["TIR", "CMR", "ADR"] },
  { id: "d3", name: "Данияр Омаров", rating: 4.8, trips: 76, truck: "Shacman X3000 · тент", plate: "331 DAO 05", years: 3, docs: ["CMR"] },
  { id: "d4", name: "Нурлан Жумабаев", rating: 4.9, trips: 540, truck: "DAF XF · контейнеровоз 40'", plate: "118 NRZ 02", years: 15, docs: ["CMR"] },
  { id: "d5", name: "Дмитрий Ковалёв", rating: 4.6, trips: 201, truck: "Scania R450 · реф", plate: "640 KDM 09", years: 8, docs: ["TIR", "CMR"] },
  { id: "d6", name: "Марат Тулегенов", rating: 4.8, trips: 95, truck: "Howo T7H · трал", plate: "072 MTT 04", years: 5, docs: ["CMR"] },
  { id: "d7", name: "Сергей Петренко", rating: 4.7, trips: 389, truck: "Mercedes Actros · тент", plate: "719 SPK 07", years: 14, docs: ["TIR", "CMR"] },
  { id: "d8", name: "Руслан Абдрахманов", rating: 4.5, trips: 58, truck: "Sitrak C7H · изотерм", plate: "264 RAB 19", years: 2, docs: ["CMR"] },
  { id: "d9", name: "Азамат Бекенов", rating: 4.8, trips: 167, truck: "Howo Max · тент", plate: "610 ABK 16", years: 7, docs: ["TIR", "CMR"] },
  { id: "d10", name: "Виктор Ли", rating: 4.9, trips: 233, truck: "Foton Auman · реф", plate: "384 VLE 05", years: 10, docs: ["CMR"] },
];

export const CLIENTS: Client[] = [
  ME_CLIENT,
  { id: "c1", name: "Айдос Нуртаев", company: "ТОО «Каспий Агро»", rating: 4.8, deals: 64 },
  { id: "c2", name: "Гульнара Мухамедиева", company: "ИП Мухамедиева", rating: 4.9, deals: 22 },
  { id: "c3", name: "Тимур Ли", company: "ТОО «Orda Electronics»", rating: 4.7, deals: 118 },
  { id: "c4", name: "Ерболат Кенжебаев", company: "ТОО «Атырау СтройСнаб»", rating: 4.6, deals: 41 },
  { id: "c5", name: "Анна Ким", company: "ТОО «Silk Cargo Group»", rating: 4.9, deals: 203 },
  { id: "c6", name: "Кайрат Досанов", company: "ИП Досанов", rating: 4.4, deals: 9 },
];

export const driver = (id: string) => DRIVERS.find((d) => d.id === id) ?? DRIVERS[1];
export const client = (id: string) => CLIENTS.find((c) => c.id === id) ?? CLIENTS[1];

/* ---------- helpers ---------- */

export function km(a: CityId, b: CityId) {
  const A = CITIES[a], B = CITIES[b];
  const r = Math.PI / 180;
  const h = Math.sin(((B.lat - A.lat) * r) / 2) ** 2 + Math.cos(A.lat * r) * Math.cos(B.lat * r) * Math.sin(((B.lon - A.lon) * r) / 2) ** 2;
  const d = 2 * 6371 * Math.asin(Math.sqrt(h)) * 1.35; // rough road factor
  return Math.max(10, Math.round(d / 10) * 10);
}

export function suggestPrice(from: CityId, to: CityId, body: Body, weight: number) {
  const load = weight >= 18 ? 1 : 0.5 + (Math.max(weight, 1) / 18) * 0.5;
  return Math.round((km(from, to) * BODIES[body].rate * load) / 10000) * 10000;
}

export const money = (n: number) => new Intl.NumberFormat("ru-RU").format(Math.round(n)).replace(/ | /g, " ") + " ₸";
export const num = (n: number) => new Intl.NumberFormat("ru-RU").format(n).replace(/ | /g, " ");
export const perKm = (price: number, from: CityId, to: CityId) => Math.round(price / km(from, to));

export function plural(n: number, forms: [string, string, string]) {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

export function ago(t: number) {
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return "только что";
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  return `${Math.floor(h / 24)} дн назад`;
}
export const clock = (t: number) => new Date(t).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

export function isoDay(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}
export function dayLabel(iso: string) {
  if (iso === isoDay(0)) return "Сегодня";
  if (iso === isoDay(1)) return "Завтра";
  return new Date(iso + "T12:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
export const sealCode = () => `KRN ${String(Math.floor(100000 + Math.random() * 899999))}`;
export const initials = (name: string) => name.replace(/[«»"]/g, "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

/* ---------- seed ---------- */

const min = (m: number) => Date.now() - m * 60000;

export function seedCargo(): Cargo[] {
  return [
    {
      id: "m1", mine: true, clientId: "me-client", from: "khorgos", to: "atyrau", what: "Сантехника и плитка на паллетах", body: "tent",
      weight: 15, volume: 82, price: 1100000, date: isoDay(0), customs: "cleared", at: min(22), status: "open",
      comment: "Погрузка в СЭЗ «Хоргос — Восточные ворота», ворота 4. Документы готовы.",
      offers: [
        { id: "o1", driverId: "d1", price: 1100000, note: "Стою в Хоргосе, загружусь сегодня", at: min(4) },
        { id: "o2", driverId: "d2", price: 1180000, note: "Могу завтра в 8:00, есть TIR", at: min(9) },
        { id: "o3", driverId: "d3", price: 1050000, note: "Свободен через 2 часа", at: min(15) },
      ],
    },
    {
      id: "m2", mine: true, clientId: "me-client", from: "khorgos", to: "almaty", what: "Одежда, контейнер 40'", body: "container",
      weight: 20, volume: 67, price: 290000, date: isoDay(0), customs: "transit", at: min(300), status: "sealed",
      dealDriverId: "d4", dealPrice: 290000, seal: "KRN 004817", offers: [],
    },
    {
      id: "k1", clientId: "c4", from: "khorgos", to: "atyrau", what: "Керамогранит и сантехника", body: "tent", weight: 18, volume: 80,
      price: 1180000, date: isoDay(0), customs: "cleared", at: min(7), status: "open", offers: [],
      comment: "Две точки выгрузки в Атырау. Оплата безнал с НДС.",
    },
    {
      id: "k2", clientId: "c3", from: "khorgos", to: "almaty", what: "Электроника, контейнер 40' HC", body: "container", weight: 21, volume: 76,
      price: 290000, date: isoDay(0), customs: "transit", at: min(18), status: "open", offers: [],
      comment: "Растаможка на СВХ в Алматы. Нужен контейнеровоз.",
    },
    {
      id: "k3", clientId: "c5", from: "khorgos", to: "astana", what: "Автозапчасти, 36 паллет", body: "tent", weight: 17, volume: 82,
      price: 820000, date: isoDay(1), customs: "cleared", at: min(34), status: "open", offers: [], bid: { price: 850000, status: "pending" },
    },
    {
      id: "k4", clientId: "c2", from: "khorgos", to: "shymkent", what: "Мандарины, +4…+6 °C", body: "reefer", weight: 19, volume: 70,
      price: 690000, date: isoDay(0), customs: "needs", at: min(52), status: "open", offers: [],
      comment: "Декларацию подаём сами. Нужен водитель с опытом прохождения Нур Жолы.",
    },
    {
      id: "k5", clientId: "c1", from: "khorgos", to: "aktobe", what: "Экскаватор, 21 т, высота 3,2 м", body: "lowboy", weight: 21, volume: 0,
      price: 1450000, date: isoDay(2), customs: "cleared", at: min(95), status: "open", offers: [],
    },
    {
      id: "k6", clientId: "c6", from: "khorgos", to: "karaganda", what: "Текстиль, догруз 40 мест", body: "tent", weight: 6, volume: 30,
      price: 330000, date: isoDay(1), customs: "cleared", at: min(130), status: "open", offers: [],
    },
    {
      id: "k7", clientId: "c4", from: "almaty", to: "atyrau", what: "Стройматериалы", body: "tent", weight: 20, volume: 86,
      price: 980000, date: isoDay(1), customs: "cleared", at: min(190), status: "open", offers: [],
    },
    {
      id: "k8", clientId: "c5", from: "khorgos", to: "tashkent", what: "Бытовая техника, транзит", body: "tent", weight: 16, volume: 82,
      price: 720000, date: isoDay(2), customs: "transit", at: min(250), status: "open", offers: [], comment: "Нужен TIR-карнет.",
    },
  ];
}

export function seedTrucks(): Truck[] {
  return [
    {
      id: "mt1", mine: true, driverId: "me-driver", from: "khorgos", to: ["atyrau", "aktobe"], body: "tent", capacity: 20, volume: 86,
      date: isoDay(0), rate: 360, rateType: "km", at: min(40), comment: "Возьму попутный груз на запад.",
      invites: [
        { id: "i1", clientId: "c1", from: "khorgos", to: "atyrau", what: "Сухое молоко в мешках", weight: 18, price: 1150000, status: "new", at: min(12) },
      ],
    },
    {
      id: "t1", driverId: "d1", from: "khorgos", to: ["atyrau", "aktobe", "uralsk"], body: "tent", capacity: 20, volume: 86, date: isoDay(0),
      rate: 360, rateType: "km", at: min(6), invites: [], comment: "Еду домой в Атырау, возьму попутный груз.",
    },
    {
      id: "t2", driverId: "d5", from: "khorgos", to: ["astana", "karaganda", "pavlodar"], body: "reefer", capacity: 18, volume: 76, date: isoDay(1),
      rate: 440, rateType: "km", at: min(26), invites: [],
    },
    {
      id: "t3", driverId: "d4", from: "almaty", to: ["khorgos"], body: "container", capacity: 26, volume: 67, date: isoDay(0),
      rate: 300000, rateType: "trip", at: min(48), invites: [], comment: "Работаю по линии Алматы — Хоргос, контейнеры 20' и 40'.",
    },
    {
      id: "t4", driverId: "d2", from: "khorgos", to: ["shymkent", "tashkent"], body: "tent", capacity: 20, volume: 86, date: isoDay(0),
      rate: 380, rateType: "km", at: min(70), invites: [], comment: "TIR, CMR, ADR. Могу через границу.",
    },
    {
      id: "t5", driverId: "d6", from: "zharkent", to: ["aktobe", "atyrau", "uralsk"], body: "lowboy", capacity: 30, volume: 0, date: isoDay(1),
      rate: 620, rateType: "km", at: min(110), invites: [], comment: "Негабарит до 3,5 м по высоте.",
    },
    {
      id: "t6", driverId: "d7", from: "khorgos", to: ["moscow"], body: "tent", capacity: 20, volume: 92, date: isoDay(2),
      rate: 2600000, rateType: "trip", at: min(160), invites: [], comment: "Через Актобе — Самару. TIR, CMR.",
    },
    {
      id: "t7", driverId: "d8", from: "khorgos", to: ["almaty", "taraz", "shymkent"], body: "isotherm", capacity: 20, volume: 82, date: isoDay(0),
      rate: 350, rateType: "km", at: min(220), invites: [],
    },
  ];
}

export function seedChats(): Chat[] {
  return [
    {
      id: "ch1", role: "client", peerId: "d4", subject: { from: "khorgos", to: "almaty", price: 290000 }, unread: 1,
      msgs: [
        { id: "a1", from: "system", text: "Сделка опломбирована · KRN 004817", at: min(300) },
        { id: "a2", from: "peer", text: "Айгерим, добрый день. Контейнер забираю в 14:00 с терминала.", at: min(290) },
        { id: "a3", from: "me", text: "Хорошо. Пропуск на вас заказан, номер 118 NRZ 02.", at: min(280) },
        { id: "a4", from: "peer", text: "Прошёл весовую, выезжаю в Алматы. Буду около 22:00.", at: min(40) },
      ],
    },
    {
      id: "ch2", role: "client", peerId: "d1", subject: { from: "khorgos", to: "atyrau", price: 1100000 }, unread: 1,
      msgs: [{ id: "b1", from: "peer", text: "Здравствуйте! Груз растаможен? CMR и инвойс готовы?", at: min(4) }],
    },
    {
      id: "ch3", role: "driver", peerId: "c1", subject: { from: "khorgos", to: "atyrau", price: 1150000 }, unread: 2,
      msgs: [
        { id: "e1", from: "peer", text: "Добрый день! Видел, что вы идёте на Атырау. Есть 18 т сухого молока, загрузка завтра в 9:00.", at: min(12) },
        { id: "e2", from: "peer", text: "Склад в СЭЗ, выгрузка на базе в Атырау. Оплата безнал.", at: min(11) },
      ],
    },
    {
      id: "ch4", role: "driver", peerId: "c5", subject: { from: "khorgos", to: "astana", price: 850000 }, unread: 0,
      msgs: [
        { id: "f1", from: "me", text: "Добрый день, возьму автозапчасти за 850 000, загрузка завтра утром.", at: min(40) },
        { id: "f2", from: "peer", text: "Спасибо, рассматриваем. Ответим до 18:00.", at: min(32) },
      ],
    },
  ];
}

// Posts that "pop up" while the app is open.
export function poolTrucks(): Omit<Truck, "at">[] {
  return [
    { id: "p1", driverId: "d9", from: "khorgos", to: ["atyrau", "aktau"], body: "tent", capacity: 20, volume: 86, date: isoDay(0), rate: 350, rateType: "km", invites: [], comment: "Только что прошёл Нур Жолы, свободен." },
    { id: "p2", driverId: "d10", from: "khorgos", to: ["almaty", "astana"], body: "reefer", capacity: 15, volume: 68, date: isoDay(0), rate: 430, rateType: "km", invites: [] },
    { id: "p3", driverId: "d3", from: "almaty", to: ["shymkent", "kyzylorda", "aktobe"], body: "tent", capacity: 22, volume: 90, date: isoDay(1), rate: 340, rateType: "km", invites: [] },
  ];
}
export function poolCargo(): Omit<Cargo, "at">[] {
  return [
    { id: "q1", clientId: "c2", from: "khorgos", to: "atyrau", what: "Сухофрукты, 1 200 коробок", body: "tent", weight: 12, volume: 60, price: 780000, date: isoDay(0), customs: "cleared", status: "open", offers: [] },
    { id: "q2", clientId: "c3", from: "khorgos", to: "astana", what: "Серверное оборудование", body: "tent", weight: 8, volume: 40, price: 520000, date: isoDay(1), customs: "transit", status: "open", offers: [] },
    { id: "q3", clientId: "c1", from: "khorgos", to: "aktau", what: "Трубы ПНД", body: "flatbed", weight: 20, volume: 0, price: 1300000, date: isoDay(1), customs: "cleared", status: "open", offers: [] },
  ];
}

export const DRIVER_REPLIES = [
  "Понял, принял.",
  "На Нур Жолы очередь около трёх часов. Как пройду — напишу.",
  "Скиньте, пожалуйста, точку погрузки.",
  "Хорошо, договорились. До связи!",
];
export const CLIENT_REPLIES = [
  "Отлично, ждём вас на складе.",
  "Пришлите фото техпаспорта и номер прицепа для пропуска.",
  "Оплата по факту выгрузки, безнал с НДС. Подходит?",
  "Хорошо, договорились!",
];
export const OFFER_NOTES = ["Стою в Хоргосе, могу сегодня", "Загружусь завтра утром", "Свободен через 3 часа", "Прошёл границу, еду пустой"];
