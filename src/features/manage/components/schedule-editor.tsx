"use client";

import { Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type JSX } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { HoursStep } from "@/features/business-registration/components/hours-step";
import { ServicesStep } from "@/features/business-registration/components/services-step";
import { StaffStep } from "@/features/business-registration/components/staff-step";
import {
  fieldId,
  validateStep,
  type RegistrationDraft,
  type StepErrors,
} from "@/features/business-registration/registration";
import {
  saveHoursAction,
  saveServicesAction,
  saveStaffAction,
  type SaveStaffActionResult,
} from "@/features/manage/actions";
import { useLocale, useT } from "@/i18n/client";

export type EditorSection = "hours" | "services" | "staff";

type ScheduleEditorProps = { slug: string; section: EditorSection; initial: RegistrationDraft };

/**
 * Газрын нэг хэсгийг бүртгэлийн маягтын алхам, дүрмээр нь засна.
 * "Хадгалах" дарахаас өмнө юу ч хадгалагдахгүй; өөрчлөлттэй табыг хаахад асууна.
 */
export function ScheduleEditor({ slug, section, initial }: ScheduleEditorProps): JSX.Element {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const words = t.dashboard.editor;
  // Ачаалсан утга: сервер дахин render хийхэд ижил утгатай ч шинэ `initial` ирдэг.
  const [stored] = useState(initial);
  const [draft, setDraft] = useState(initial);
  // Алдаанууд хадгалах гэж оролдсоны дараа гарч, цаашид бичих явцыг дагана.
  const [tried, setTried] = useState(false);
  const [saving, startSaving] = useTransition();
  const dirty = draft !== stored;
  const errors: StepErrors = tried ? validateStep(section, draft) : {};

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent): void => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const send = (): Promise<SaveStaffActionResult> => {
    if (section === "hours") {
      return saveHoursAction({ slug, hours: draft.hours, slotMinutes: draft.slotMinutes });
    }
    if (section === "services") return saveServicesAction({ slug, services: draft.services });
    return saveStaffAction({
      slug,
      staff: draft.staff.map((member) => ({
        position: member.position ?? null,
        name: member.name,
      })),
    });
  };

  const save = (): void => {
    const first = Object.keys(validateStep(section, draft))[0];
    if (first) {
      setTried(true);
      requestAnimationFrame(() => {
        const field = document.getElementById(fieldId(first));
        field?.focus({ preventScroll: true });
        field?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }
    startSaving(async () => {
      const result = await send();
      if (result.ok) {
        toast.success(words.saved);
        router.push(`/dashboard/${slug}`);
      } else if ("names" in result) {
        toast.error(words.errors.has_bookings(result.names.join(", ")));
      } else if (result.error === "invalid" || result.error === "not_found") {
        toast.error(words.errors[result.error]);
      } else {
        toast.error(t.manage.error);
      }
    });
  };

  return (
    <div>
      <p className="mt-6 rounded-md bg-surface-muted px-4 py-3 text-sm text-muted-foreground">
        {words.notes[section]}
      </p>

      {section === "hours" ? (
        <HoursStep draft={draft} update={setDraft} errors={errors} t={t} />
      ) : null}
      {section === "services" ? (
        <ServicesStep draft={draft} update={setDraft} errors={errors} t={t} locale={locale} />
      ) : null}
      {section === "staff" ? (
        <StaffStep draft={draft} update={setDraft} errors={errors} t={t} />
      ) : null}

      <div className="sticky bottom-0 mt-8 flex justify-end gap-2 border-t border-border bg-background py-4">
        <Button variant="ghost" asChild>
          <Link href={`/dashboard/${slug}`}>{words.discard}</Link>
        </Button>
        <Button loading={saving} disabled={!dirty} onClick={save}>
          <Save data-icon="start" />
          {words.save}
        </Button>
      </div>
    </div>
  );
}
