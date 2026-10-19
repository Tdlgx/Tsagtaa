"use client";

import type * as Leaflet from "leaflet";

import "leaflet/dist/leaflet.css";

export type LeafletModule = typeof Leaflet;

/** Leaflet touches `window` when imported, so it is loaded in the browser only. */
export async function loadLeaflet(): Promise<LeafletModule> {
  const mod = await import("leaflet");
  return (mod as unknown as { default?: LeafletModule }).default ?? mod;
}

/*
 * Map tiles: OpenStreetMap's own, with no key or billing. Their usage policy
 * asks for the credit line (kept in the corner) and moderate traffic; a busy
 * production site should move to a paid tile host. OSM has one light style,
 * so dark mode inverts the tiles with a CSS filter (`.map-tiles-dark`).
 */
const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export function tileLayer(L: LeafletModule, theme: "light" | "dark"): Leaflet.TileLayer {
  return L.tileLayer(TILES, {
    attribution: ATTRIBUTION,
    maxZoom: 19,
    className: theme === "dark" ? "map-tiles-dark" : "",
  });
}

/** Text for a marker's HTML: everything escaped, so a business name cannot inject markup. */
export function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!,
  );
}
