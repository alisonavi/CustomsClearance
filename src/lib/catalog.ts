export type BodyId = "tent" | "reefer" | "isotherm" | "container" | "flatbed" | "lowboy";
export const BODIES: Record<BodyId, { name: string; hint: string }> = {
  tent: { name: "Тент", hint: "Крытый брезентом — самый частый" },
  reefer: { name: "Рефрижератор", hint: "С холодильником" },
  isotherm: { name: "Изотерм", hint: "Утеплённый фургон" },
  container: { name: "Контейнеровоз", hint: "Контейнеры 20 и 40 футов" },
  flatbed: { name: "Бортовой", hint: "Открытая платформа" },
  lowboy: { name: "Трал", hint: "Для спецтехники" },
};
export const BODY_IDS = Object.keys(BODIES) as BodyId[];

export type KindId = "fura" | "truck" | "small";
export const KINDS: Record<KindId, { name: string; hint: string }> = {
  fura: { name: "Фура", hint: "Тягач с полуприцепом, до 25 т" },
  truck: { name: "Грузовик", hint: "Одиночная машина, 5–15 т" },
  small: { name: "Малотоннажный", hint: "До 3,5 т, «Газель»" },
};
export const KIND_IDS = Object.keys(KINDS) as KindId[];

export const CATEGORIES: Record<string, string> = {
  electronics: "Техника и электроника",
  building: "Стройматериалы",
  food: "Продукты",
  textile: "Одежда и текстиль",
  equipment: "Оборудование",
  parts: "Автозапчасти",
  furniture: "Мебель",
  other: "Другое",
};

export type PackId = "pallets" | "boxes" | "bags" | "bulk" | "none" | "container";
export const PACKAGING: Record<PackId, string> = {
  pallets: "Паллеты", boxes: "Коробки", bags: "Мешки", bulk: "Навалом", none: "Без упаковки", container: "Контейнер",
};

export type LoadId = "back" | "side" | "top";
export const LOADING: Record<LoadId, string> = { back: "Сзади", side: "Сбоку", top: "Сверху" };

export const EXTRAS = ["Гидроборт", "Ремни", "Коники", "Опасный груз (ADR)", "Растентовка"];
export const PERMITS = ["Разрешение на въезд в КНР", "TIR-карнет", "Страховка CMR", "Допуск ADR"];
export const CHINA_PERMIT = PERMITS[0];

export type CustomsWhere = "china" | "border" | "kazakhstan" | "post";
export const CUSTOMS: Record<CustomsWhere, { name: string; hint: string }> = {
  china: { name: "В Китае", hint: "Оформляет отправитель до границы" },
  border: { name: "На границе", hint: "Хоргос, Достык и другие переходы" },
  kazakhstan: { name: "В Казахстане", hint: "На СВХ в городе доставки" },
  post: { name: "Конкретный пост или СВХ", hint: "Выберите из списка" },
};

export type Status = "published" | "offers" | "chosen" | "to_loading" | "loading" | "in_transit" | "customs" | "delivery" | "done" | "rated";
export const STATUS: Record<Status, string> = {
  published: "Опубликована",
  offers: "Получены предложения",
  chosen: "Перевозчик выбран",
  to_loading: "Машина едет на загрузку",
  loading: "Загрузка",
  in_transit: "В пути",
  customs: "Таможенное оформление",
  delivery: "Доставка",
  done: "Завершено",
  rated: "Оценка сторон",
};
export const FLOW: Status[] = ["published", "offers", "chosen", "to_loading", "loading", "in_transit", "customs", "delivery", "done", "rated"];
export const ACTIVE: Status[] = ["chosen", "to_loading", "loading", "in_transit", "customs", "delivery"];
export const isOpen = (s: Status) => s === "published" || s === "offers";

/** What the driver taps to move the trip forward. */
export const CARRIER_STEP: Partial<Record<Status, string>> = {
  chosen: "Выезжаю на загрузку",
  to_loading: "Я на месте, начали грузить",
  loading: "Загрузился, выезжаю",
  in_transit: "Приехал на таможню",
  customs: "Таможню прошёл, везу дальше",
  delivery: "Груз доставлен",
};

/** Client rates the carrier on these (spec §12). */
export const RATE_CARRIER = ["Соблюдение сроков", "Сохранность груза", "Связь", "Машина как в описании"];
/** Carrier rates the client on these (spec §12). */
export const RATE_CLIENT = ["Загрузка вовремя", "Груз как в описании", "Оплата вовремя", "Связь"];
