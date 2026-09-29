import type { BodyId, CustomsWhere, KindId, LoadId, PackId, Status } from "./catalog";
import type { PlaceQ } from "./geo";

export type Role = "client" | "carrier";

/** Scores follow RATE_CARRIER / RATE_CLIENT order. Always tied to a finished shipment. */
export type Review = { id: string; by: string; route: string; date: string; scores: number[]; text?: string };

export type Client = { id: string; name: string; company?: string; phone: string; verified: boolean; deals: number; years: number; rating: number; ratingCount: number; reviews: Review[] };
export type Carrier = { id: string; name: string; type: "driver" | "company" };
export type Driver = {
  id: string; carrierId: string; name: string; phone: string; verified: boolean; years: number; trips: number;
  directions: string[]; rating: number; ratingCount: number; reviews: Review[];
};

export type Truck = {
  id: string; carrierId: string; driverId: string;
  kind: KindId; body: BodyId; make: string; model: string; year: number; plate: string; cnPlate?: boolean;
  capacity: number; volume: number; dims: [number, number, number];
  loading: LoadId[]; extras: string[]; temp?: [number, number];
  photos: number; verified: boolean | "pending";
  /** Spec §14: border-crossing readiness. Real limits still need legal checking. */
  intl: { chinaEntry: boolean; lastTrip?: string; nextEntry?: string; permits: string[] };
  state: "free" | "trip" | "off";
  at: string; freeFrom: string; goingTo: string[];
  postedAt?: number; fresh?: boolean;
};

/** by "carrier" = a driver's bid; by "client" = the client offered the load to a truck. */
export type Offer = { id: string; truckId: string; price: number; note?: string; at: number; status: "new" | "accepted" | "declined"; by: "carrier" | "client" };

export type Cargo = {
  id: string; clientId: string;
  from: string; fromPoint?: string; to: string; toPoint?: string;
  customs?: { where: CustomsWhere; post?: string };
  title: string; note?: string; category: string; weight: number; volume: number; places?: number; dims?: string; packaging?: PackId; stackable?: boolean;
  bodies: BodyId[]; temp?: [number, number]; loading?: LoadId[]; extras?: string[];
  date: string; flex: number; urgent?: boolean;
  priceMode: "fixed" | "offers"; price?: number;
  createdAt: number; status: Status; log: { s: Status; at: number }[];
  offers: Offer[];
  deal?: { truckId: string; price: number };
  byClient?: Review; byCarrier?: Review;
  fresh?: boolean;
};

export type Msg = { id: string; from: Role | "system"; text: string; at: number };
export type Chat = {
  id: string; clientId: string; carrierId: string; driverId: string; cargoId?: string;
  msgs: Msg[]; unread: Record<Role, number>; typing?: Role | null;
};

export type NotifKind = "match_cargo" | "match_truck" | "offer" | "accepted" | "declined" | "status" | "message" | "loading_soon" | "proposal" | "rate" | "verified";
export type Notif = { id: string; role: Role; kind: NotifKind; title: string; body: string; href: string; at: number; read: boolean };

export type TruckFilters = {
  date?: string; kinds: string[]; bodies: string[]; minCap?: number; minVol?: number;
  scope: "all" | "intl" | "domestic"; minRating?: number; verifiedOnly: boolean; sort: "match" | "near" | "rating";
};
export type CargoFilters = {
  radius?: number; date?: string; maxWeight?: number; maxVol?: number; categories: string[]; minPrice?: number;
  customs: string[]; fitTruck: boolean; sort: "new" | "price" | "near";
};
export type Saved = { id: string; role: Role; from?: PlaceQ; to?: PlaceQ; at: number };

export type User = {
  registered: boolean; role: Role; phone: string;
  clientName: string; company: string; carrierName: string; carrierType: "driver" | "company";
};

export type State = {
  v: 2;
  user: User;
  clients: Client[]; carriers: Carrier[]; drivers: Driver[]; trucks: Truck[]; cargo: Cargo[];
  chats: Chat[]; notifs: Notif[]; saved: Saved[];
  q: {
    client: { from?: PlaceQ; to?: PlaceQ; f: TruckFilters };
    carrier: { from?: PlaceQ; to?: PlaceQ; truckId?: string; f: CargoFilters };
  };
  recent: string[];
  bigText: boolean;
  popped: number;
};

export const ME_CLIENT = "me-client";
export const ME_CARRIER = "me-carrier";
