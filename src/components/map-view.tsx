"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LMap } from "leaflet";
import { CITIES, POIS, city } from "@/lib/geo";

type Leaflet = typeof import("leaflet");
export type MapGroup = { cityId: string; count: number };
/** Both sides of Хоргос sit 10 km apart — one pin on the map. */
export const mapCity = (id: string) => (id.startsWith("khorgos") ? "khorgos-kz" : id);
const MAJOR = new Set(["almaty", "astana", "shymkent", "karaganda", "aktobe", "atyrau", "urumqi"]);
export type Layers = { border: boolean; customs: boolean; hub: boolean };

const svg = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const ICONS = {
  border: svg('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>'),
  customs: svg('<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>'),
  hub: svg('<path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/><path d="M6 18h12"/><path d="M6 14h12"/><rect width="12" height="12" x="6" y="10"/>'),
};
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);

/** Leaflet map. Trucks and loads are grouped by city — no exact positions (spec §6). */
export function MapView({ groups, selected, onSelect, layers, onPoi }: {
  groups: MapGroup[]; selected?: string; onSelect: (cityId: string) => void; layers: Layers; onPoi?: (id: string) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LMap | null>(null);
  const lib = useRef<Leaflet | null>(null);
  const pins = useRef<LayerGroup | null>(null);
  const pois = useRef<LayerGroup | null>(null);
  const cb = useRef({ onSelect, onPoi });
  useEffect(() => { cb.current = { onSelect, onPoi }; });
  const [ready, setReady] = useState(false);
  const fitted = useRef("");

  useEffect(() => {
    let dead = false;
    import("leaflet").then((mod) => {
      if (dead || !el.current || map.current) return;
      const L = ((mod as unknown as { default?: Leaflet }).default ?? mod) as Leaflet;
      lib.current = L;
      const m = L.map(el.current, { zoomControl: false, minZoom: 3, maxZoom: 12 }).setView([45.5, 77], 5);
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}", { maxZoom: 16, attribution: "Карта © Esri" }).addTo(m);
      const zoomClass = () => { const z = m.getZoom(); el.current?.classList.toggle("z-far", z <= 5); el.current?.classList.toggle("z-mid", z > 5 && z < 8); };
      m.on("zoomend", zoomClass);
      zoomClass();
      L.control.zoom({ position: "bottomright" }).addTo(m);
      pois.current = L.layerGroup().addTo(m);
      pins.current = L.layerGroup().addTo(m);
      map.current = m;
      setReady(true);
    });
    return () => { dead = true; map.current?.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    const L = lib.current, m = map.current, layer = pins.current;
    if (!ready || !L || !m || !layer) return;
    layer.clearLayers();
    const withPins = new Set(groups.map((g) => g.cityId));
    CITIES.filter((c) => !withPins.has(c.id) && !c.id.startsWith("khorgos")).forEach((c) =>
      L.marker([c.lat, c.lon], { interactive: false, keyboard: false, icon: L.divIcon({ className: "", iconSize: [0, 0], html: `<div class="city-label ${MAJOR.has(c.id) ? "" : "minor"}">${esc(c.name)}</div>` }) }).addTo(layer));
    groups.forEach((g) => {
      const c = city(g.cityId);
      const label = g.cityId.startsWith("khorgos") ? "Хоргос, граница" : c.name;
      const mk = L.marker([c.lat, c.lon], {
        title: `${label}: ${g.count}`,
        icon: L.divIcon({ className: "", iconSize: [0, 0], html: `<div class="pin"><div class="pin-dot ${selected === g.cityId ? "sel" : ""}">${g.count}</div><div class="pin-label">${esc(label)}</div></div>` }),
      });
      mk.on("click", () => cb.current.onSelect(g.cityId));
      mk.addTo(layer);
    });
    const key = groups.map((g) => g.cityId).sort().join(",");
    if (groups.length && fitted.current !== key) {
      fitted.current = key;
      const near = groups.filter((g) => city(g.cityId).lon < 95); // the corridor; far-east China stays one pan away
      const pts = (near.length ? near : groups).map((g) => [city(g.cityId).lat, city(g.cityId).lon] as [number, number]);
      m.fitBounds(L.latLngBounds(pts).pad(0.3), { maxZoom: 7 });
    }
  }, [ready, groups, selected]);

  useEffect(() => {
    const L = lib.current, layer = pois.current;
    if (!ready || !L || !layer) return;
    layer.clearLayers();
    POIS.filter((p) => layers[p.kind]).forEach((p) => {
      const mk = L.marker([p.lat, p.lon], {
        title: p.name,
        icon: L.divIcon({ className: "", iconSize: [0, 0], html: `<div class="poi"><span class="poi-ic ${p.kind}">${ICONS[p.kind]}</span><span class="poi-name">${esc(p.name)}</span></div>` }),
      });
      mk.on("click", () => cb.current.onPoi?.(p.id));
      mk.addTo(layer);
    });
  }, [ready, layers]);

  return <div ref={el} className="h-full w-full" role="application" aria-label="Карта" />;
}
