"use client";

import { Camera, LoaderCircle } from "lucide-react";
import { useRef, useState, type ChangeEvent, type JSX } from "react";
import { toast } from "sonner";

import { BrandMark } from "@/components/shared/brand-mark";
import { toAvatar } from "@/features/profile/avatar-image";
import { saveProfile, type Profile } from "@/features/profile/profile-store";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

/**
 * Профайлын зураг: зураг байвал түүнийг, үгүй бол нэрийн эхний үсгийг (эсвэл
 * брэндийн тэмдгийг) харуулна. Камерын тэмдэг зураг сонгогчийг нээх ба утсан дээр
 * камер ч санал болгоно.
 */
export function ProfileAvatar({ profile }: { profile: Profile }): JSX.Element {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const words = t.profile.photo;

  const onFile = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    // Дараа нь ижил файлыг дахин сонгох боломжтой болгоно.
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    const result = await toAvatar(file);
    setBusy(false);
    if (result === "notImage" || result === "tooLarge" || result === "failed") {
      toast.error(words[result]);
      return;
    }
    saveProfile({ avatar: result });
    toast.success(words.saved, { description: words.hint });
  };

  return (
    <div className="relative">
      <span className="flex size-20 items-center justify-center overflow-hidden rounded-xl bg-brand-ink font-heading text-3xl font-medium text-primary ring-4 ring-surface">
        {profile.avatar ? (
          // Энэ төхөөрөмж дээр үүсгэсэн data URL; next/image энд юу ч нэмэхгүй.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar}
            alt=""
            className="size-full animate-in object-cover duration-300 ease-soft fade-in"
          />
        ) : profile.name ? (
          profile.name.charAt(0).toUpperCase()
        ) : (
          <BrandMark className="size-9" />
        )}
      </span>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label={profile.avatar ? words.change : words.add}
        title={profile.avatar ? words.change : words.add}
        className={cn(
          "absolute -right-2 -bottom-2 flex size-9 items-center justify-center rounded-full border-2 border-surface bg-primary text-primary-foreground shadow-sm transition-transform duration-150 ease-soft outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:scale-105",
          busy && "cursor-wait",
        )}
      >
        {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Camera className="size-4" />}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(event) => void onFile(event)}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />
    </div>
  );
}

/** "Зураг хасах", зураг байх үед нэрийн доор харагдана. */
export function RemoveAvatarButton(): JSX.Element {
  const t = useT();
  return (
    <button
      type="button"
      onClick={() => {
        saveProfile({ avatar: "" });
        toast(t.profile.photo.removed);
      }}
      className="mt-1 rounded-sm text-xs font-medium text-muted-foreground underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:text-danger-foreground is-hover:underline"
    >
      {t.profile.photo.remove}
    </button>
  );
}
