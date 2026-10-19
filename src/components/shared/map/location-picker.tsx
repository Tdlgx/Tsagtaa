"use client";

import type * as Leaflet from "leaflet";
import { Crosshair, MapPin, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState, type JSX } from "react";

import { loadLeaflet, tileLayer, type LeafletModule } from "@/components/shared/map/leaflet";
import { Button } from "@/components/ui/button";
import {
  CITY_CENTER,
  isInServiceArea,
  roundLatLng,
  type LatLng,
} from "@/features/business/locations";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

type LocationPickerProps = {
  value: LatLng | null;
  onChange: (value: LatLng | null) => void;
  /** Labelled by this id (the field's label). */
  labelId?: string;
  className?: string;
};

type PickerState = {
  L: LeafletModule;
  map: Leaflet.Map;
  tiles: Leaflet.TileLayer;
  marker: Leaflet.Marker | null;
};

const PIN_HTML = '<span class="map-pin is-selected"><b>●</b></span>';

/**
 * Where the place is: tap the map or drag the pin, or use this device's
 * location. Points outside Ulaanbaatar are refused with a note, the same
 * rule the database enforces.
 */
export function LocationPicker({
  value,
  onChange,
  labelId,
  className,
}: LocationPickerProps): JSX.Element {
  const t = useT();
  const words = t.location;
  const container = useRef<HTMLDivElement>(null);
  const state = useRef<PickerState | null>(null);
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState<"outside" | "denied" | "unsupported" | null>(null);
  const [locating, setLocating] = useState(false);
  const { resolvedTheme } = useTheme();
  const theme: "light" | "dark" = resolvedTheme === "dark" ? "dark" : "light";
  const latest = useRef({ value, onChange, theme });

  useEffect(() => {
    latest.current = { value, onChange, theme };
  });

  const choose = (point: LatLng): void => {
    if (!isInServiceArea(point)) {
      setNote("outside");
      return;
    }
    setNote(null);
    latest.current.onChange(roundLatLng(point));
  };
  const chooseRef = useRef(choose);
  useEffect(() => {
    chooseRef.current = choose;
  });

  useEffect(() => {
    let cancelled = false;
    void loadLeaflet().then((L) => {
      if (cancelled || !container.current) return;
      const start = latest.current.value ?? CITY_CENTER;
      const map = L.map(container.current, {
        center: [start.lat, start.lng],
        zoom: latest.current.value ? 16 : 12,
        scrollWheelZoom: false,
      });
      map.once("click focus", () => map.scrollWheelZoom.enable());
      map.on("click", (event: Leaflet.LeafletMouseEvent) =>
        chooseRef.current({ lat: event.latlng.lat, lng: event.latlng.lng }),
      );
      const tiles = tileLayer(L, latest.current.theme).addTo(map);
      state.current = { L, map, tiles, marker: null };
      setReady(true);
    });
    return () => {
      cancelled = true;
      state.current?.map.remove();
      state.current = null;
    };
  }, []);

  useEffect(() => {
    const current = state.current;
    if (!ready || !current) return;
    current.tiles.remove();
    current.tiles = tileLayer(current.L, theme).addTo(current.map);
  }, [theme, ready]);

  // The pin follows the value: placed, moved or removed.
  useEffect(() => {
    const current = state.current;
    if (!ready || !current) return;
    const { L, map } = current;
    if (!value) {
      current.marker?.remove();
      current.marker = null;
      return;
    }
    if (!current.marker) {
      current.marker = L.marker([value.lat, value.lng], {
        draggable: true,
        keyboard: true,
        title: words.pin,
        icon: L.divIcon({
          className: "map-pin-wrap",
          html: PIN_HTML,
          iconSize: [44, 52],
          iconAnchor: [22, 50],
        }),
      })
        .on("dragend", (event) => {
          const position = (event.target as Leaflet.Marker).getLatLng();
          chooseRef.current({ lat: position.lat, lng: position.lng });
          // Snap back if the drag ended outside the city.
          const kept = latest.current.value;
          if (kept) (event.target as Leaflet.Marker).setLatLng([kept.lat, kept.lng]);
        })
        .addTo(map);
    } else {
      current.marker.setLatLng([value.lat, value.lng]);
    }
  }, [value, ready, words.pin]);

  const locate = (): void => {
    if (!("geolocation" in navigator)) {
      setNote("unsupported");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const point = { lat: position.coords.latitude, lng: position.coords.longitude };
        choose(point);
        if (isInServiceArea(point)) state.current?.map.setView([point.lat, point.lng], 17);
      },
      () => {
        setLocating(false);
        setNote("denied");
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        ref={container}
        role="application"
        aria-labelledby={labelId}
        aria-describedby="location-picker-hint"
        className="map-surface z-0 h-60 overflow-hidden rounded-lg border border-input sm:h-72"
      />
      <p id="location-picker-hint" className="text-xs text-muted-foreground">
        {value ? (
          <span className="flex items-center gap-1.5 tabular-nums">
            <MapPin className="size-3.5 text-primary-strong" />
            {words.chosen(value.lat.toFixed(5), value.lng.toFixed(5))}
          </span>
        ) : (
          words.hint
        )}
      </p>
      {note ? (
        <p role="alert" className="text-xs text-danger-foreground">
          {words.notes[note]}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" loading={locating} onClick={locate}>
          <Crosshair data-icon="start" />
          {words.useMine}
        </Button>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setNote(null);
              onChange(null);
            }}
          >
            <X data-icon="start" />
            {words.clear}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
