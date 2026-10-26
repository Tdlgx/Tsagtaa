"use client";

import type * as Leaflet from "leaflet";

import "leaflet/dist/leaflet.css";

export type LeafletModule = typeof Leaflet;

/** Leaflet import хийгдэхдээ `window`-д ханддаг тул зөвхөн browser-т ачаална. */
export async function loadLeaflet(): Promise<LeafletModule> {
  const mod = await import("leaflet");
  return (mod as unknown as { default?: LeafletModule }).default ?? mod;
}

/*
 * Газрын зургийн хавтан: OpenStreetMap-ийн өөрийнх, түлхүүр, төлбөргүй. Тэдний ашиглах
 * журам нь эх сурвалжийн мөрийг (булангид үлдээсэн) болон дунд зэргийн ачааллыг
 * шаарддаг; ачаалал ихтэй production сайт төлбөртэй хавтангийн үйлчилгээ рүү
 * шилжих ёстой. OSM нэг л цайвар стильтэй тул dark mode хавтангуудыг CSS filter-ээр
 * урвуулна (`.map-tiles-dark`).
 */
const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** OpenStreetMap-ийн хавтангийн давхарга; dark theme-д урвуулах класс нэмнэ. */
export function tileLayer(L: LeafletModule, theme: "light" | "dark"): Leaflet.TileLayer {
  return L.tileLayer(TILES, {
    attribution: ATTRIBUTION,
    maxZoom: 19,
    className: theme === "dark" ? "map-tiles-dark" : "",
  });
}

/** Тэмдэглэгээний HTML-д зориулсан текст: бүгд escape хийгдсэн тул бизнесийн нэр markup оруулж чадахгүй. */
export function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!,
  );
}
