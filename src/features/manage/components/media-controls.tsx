"use client";

import { ImagePlus, Save, Trash2, Upload } from "lucide-react";
import { useRef, useState, useTransition, type ChangeEvent, type JSX } from "react";
import { toast } from "sonner";

import { LocationPicker } from "@/components/shared/map/location-picker";
import { Button } from "@/components/ui/button";
import type { LatLng } from "@/features/business/locations";
import {
  deleteImageAction,
  setLocationAction,
  uploadImageAction,
  type ActionResult,
} from "@/features/manage/actions";
import { useT } from "@/i18n/client";
import type { Dictionary } from "@/i18n/dictionaries";
import { resizeImage } from "@/lib/resize-image";
import { cn } from "@/lib/utils";

export type MediaImage = { id: string; width: number; height: number };

const errorText = (result: ActionResult, t: Dictionary): string => {
  if (result.ok) return "";
  const errors = t.media.errors as Record<string, string>;
  return errors[result.error] ?? t.manage.error;
};

/* Лого ба зураг ---------------------------------------------------------------- */

type MediaManagerProps = {
  slug: string;
  logo: MediaImage | null;
  photos: readonly MediaImage[];
  maxPhotos: number;
};

/**
 * Газрын лого болон `maxPhotos` хүртэлх зураг. Зургийг илгээхээс өмнө browser дээр
 * жижигрүүлдэг (байршлын мэдээллийг нь хасна) тул 10 MB утасны зураг ч хэдэн зуун
 * KB болж хуулагдана.
 */
export function MediaManager({ slug, logo, photos, maxPhotos }: MediaManagerProps): JSX.Element {
  const t = useT();
  const words = t.media;
  const [busy, setBusy] = useState<"logo" | "photo" | null>(null);
  const [, start] = useTransition();
  const logoInput = useRef<HTMLInputElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  const upload = async (kind: "logo" | "photo", file: File): Promise<boolean> => {
    const resized = await resizeImage(file, kind === "logo" ? { maxSide: 256 } : { maxSide: 1600 });
    if (typeof resized === "string") {
      toast.error(words.errors[resized]);
      return false;
    }
    const form = new FormData();
    form.set("slug", slug);
    form.set("kind", kind);
    form.set("width", String(resized.width));
    form.set("height", String(resized.height));
    form.set("file", resized.blob, kind === "logo" ? "logo" : "photo");
    const result = await uploadImageAction(form);
    if (!result.ok) toast.error(errorText(result, t));
    return result.ok;
  };

  const onPick = (kind: "logo" | "photo") => async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    if (files.length === 0) return;
    setBusy(kind);
    // Зураг: багтах хэмжээгээр, нэг нэгээр нь.
    const room = kind === "logo" ? 1 : Math.max(0, maxPhotos - photos.length);
    let added = 0;
    for (const file of files.slice(0, room)) {
      if (await upload(kind, file)) added += 1;
    }
    if (kind === "photo" && files.length > room) toast(words.limitNote(maxPhotos));
    setBusy(null);
    if (added > 0) toast.success(kind === "logo" ? words.logoSaved : words.photosAdded(added));
  };

  const remove = (imageId: string): void => {
    start(async () => {
      const result = await deleteImageAction({ slug, imageId });
      if (result.ok) toast(words.removed);
      else toast.error(errorText(result, t));
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- өөрсдийн жижиг, cache-тэй зургууд
            <img
              src={`/api/business-images/${logo.id}`}
              alt={words.logoAlt}
              className="size-full object-contain"
            />
          ) : (
            <ImagePlus className="size-6 text-muted-foreground" />
          )}
        </span>
        <div className="flex flex-col items-start gap-1.5">
          <p className="text-sm font-medium text-foreground">{words.logo}</p>
          <p className="text-xs text-muted-foreground">{words.logoHint}</p>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              loading={busy === "logo"}
              onClick={() => logoInput.current?.click()}
            >
              <Upload data-icon="start" />
              {logo ? words.replace : words.upload}
            </Button>
            {logo ? (
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground is-hover:text-danger-foreground"
                onClick={() => remove(logo.id)}
                aria-label={words.removeLogo}
              >
                <Trash2 />
              </Button>
            ) : null}
          </div>
          <input
            ref={logoInput}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(event) => void onPick("logo")(event)}
          />
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium text-foreground">{words.photos}</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {photos.length}/{maxPhotos}
          </p>
        </div>
        <ul className="mt-2 grid grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <li key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element -- өөрсдийн жижиг, cache-тэй зургууд */}
              <img
                src={`/api/business-images/${photo.id}`}
                alt={words.photoAlt(index + 1)}
                className="size-full object-cover"
              />
              <button
                type="button"
                onClick={() => remove(photo.id)}
                aria-label={words.removePhoto(index + 1)}
                className="absolute top-1.5 right-1.5 flex size-8 items-center justify-center rounded-full bg-brand-ink/75 text-brand-ink-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:bg-danger"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
          {photos.length < maxPhotos ? (
            <li>
              <button
                type="button"
                onClick={() => photoInput.current?.click()}
                disabled={busy === "photo"}
                className={cn(
                  "flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-xs text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:border-muted-foreground",
                  busy === "photo" && "animate-pulse",
                )}
              >
                <ImagePlus className="size-5" />
                {busy === "photo" ? words.uploading : words.addPhoto}
              </button>
            </li>
          ) : null}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">{words.photosHint}</p>
        <input
          ref={photoInput}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => void onPick("photo")(event)}
        />
      </div>
    </div>
  );
}

/* Байршлын цэг --------------------------------------------------------------------------- */

export function LocationEditor({
  slug,
  initial,
}: {
  slug: string;
  initial: LatLng | null;
}): JSX.Element {
  const t = useT();
  const [value, setValue] = useState<LatLng | null>(initial);
  const [pending, start] = useTransition();
  const changed = value?.lat !== initial?.lat || value?.lng !== initial?.lng;

  return (
    <div className="flex flex-col gap-3">
      <p id="dashboard-location-label" className="sr-only">
        {t.location.label}
      </p>
      <LocationPicker value={value} onChange={setValue} labelId="dashboard-location-label" />
      <Button
        size="sm"
        className="self-start"
        disabled={!changed}
        loading={pending}
        onClick={() =>
          start(async () => {
            const result = await setLocationAction({ slug, location: value });
            if (result.ok) toast.success(t.location.saved);
            else toast.error(errorText(result, t));
          })
        }
      >
        <Save data-icon="start" />
        {t.location.save}
      </Button>
    </div>
  );
}
