"use client";

import type * as Leaflet from "leaflet";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState, type JSX } from "react";

import {
  escapeHtml,
  loadLeaflet,
  tileLayer,
  type LeafletModule,
} from "@/components/shared/map/leaflet";
import { CITY_CENTER } from "@/features/business/locations";
import { cn } from "@/lib/utils";

export type MapPlace = {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  /** /api/business-images/<id>, or null for a lettered pin. */
  logoUrl: string | null;
};

type BusinessMapProps = {
  places: readonly MapPlace[];
  selected?: string | null;
  onSelect?: (slug: string) => void;
  /** Describes the map for screen readers; the list next to it carries the details. */
  label: string;
  className?: string;
};

type MapState = {
  L: LeafletModule;
  map: Leaflet.Map;
  tiles: Leaflet.TileLayer;
  markers: Map<string, Leaflet.Marker>;
};

function pinIcon(L: LeafletModule, place: MapPlace, selected: boolean): Leaflet.DivIcon {
  const face = place.logoUrl
    ? `<img src="${escapeHtml(place.logoUrl)}" alt="" />`
    : `<b>${escapeHtml(place.name.trim().charAt(0).toUpperCase() || "?")}</b>`;
  return L.divIcon({
    className: "map-pin-wrap",
    html: `<span class="map-pin${selected ? " is-selected" : ""}">${face}</span>`,
    iconSize: [44, 52],
    iconAnchor: [22, 50],
  });
}

/**
 * Businesses as pins on a map of Ulaanbaatar. Choosing a pin calls
 * `onSelect`; the page shows the details beside it. The page scrolls past
 * the map until it is clicked, then the mouse wheel zooms it.
 */
export function BusinessMap({
  places,
  selected = null,
  onSelect,
  label,
  className,
}: BusinessMapProps): JSX.Element {
  const container = useRef<HTMLDivElement>(null);
  const state = useRef<MapState | null>(null);
  const [ready, setReady] = useState(false);
  const { resolvedTheme } = useTheme();
  const theme: "light" | "dark" = resolvedTheme === "dark" ? "dark" : "light";
  const themeRef = useRef(theme);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    themeRef.current = theme;
    onSelectRef.current = onSelect;
  });

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    void loadLeaflet().then((L) => {
      if (cancelled || !container.current) return;
      const map = L.map(container.current, {
        center: [CITY_CENTER.lat, CITY_CENTER.lng],
        zoom: 12,
        scrollWheelZoom: false,
        zoomControl: true,
      });
      map.once("click focus", () => map.scrollWheelZoom.enable());
      const tiles = tileLayer(L, themeRef.current).addTo(map);
      state.current = { L, map, tiles, markers: new Map() };
      setReady(true);
    });
    return () => {
      cancelled = true;
      state.current?.map.remove();
      state.current = null;
    };
  }, []);

  // Light or dark tiles with the site theme.
  useEffect(() => {
    const current = state.current;
    if (!ready || !current) return;
    current.tiles.remove();
    current.tiles = tileLayer(current.L, theme).addTo(current.map);
  }, [theme, ready]);

  // Pins: rebuilt when the places change, then the view fits them all.
  useEffect(() => {
    const current = state.current;
    if (!ready || !current) return;
    const { L, map, markers } = current;
    markers.forEach((marker) => marker.remove());
    markers.clear();
    for (const place of places) {
      const marker = L.marker([place.lat, place.lng], {
        icon: pinIcon(L, place, false),
        title: place.name,
        alt: place.name,
        keyboard: true,
        riseOnHover: true,
      })
        .on("click", () => onSelectRef.current?.(place.slug))
        .addTo(map);
      markers.set(place.slug, marker);
    }
    if (places.length === 1) {
      map.setView([places[0]!.lat, places[0]!.lng], 15);
    } else if (places.length > 1) {
      map.fitBounds(L.latLngBounds(places.map((place) => [place.lat, place.lng])), {
        padding: [40, 40],
        maxZoom: 15,
      });
    }
  }, [places, ready]);

  // The chosen pin stands out and comes into view.
  useEffect(() => {
    const current = state.current;
    if (!ready || !current) return;
    for (const place of places) {
      const marker = current.markers.get(place.slug);
      if (!marker) continue;
      const isSelected = place.slug === selected;
      marker.setIcon(pinIcon(current.L, place, isSelected));
      marker.setZIndexOffset(isSelected ? 1000 : 0);
      if (isSelected) current.map.panTo(marker.getLatLng(), { animate: true });
    }
  }, [selected, places, ready]);

  return (
    <div
      ref={container}
      role="region"
      aria-label={label}
      className={cn("map-surface z-0 overflow-hidden rounded-xl border border-border", className)}
    />
  );
}
