import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { JSX } from "react";

import { Container } from "@/components/layout/container";
import {
  EMPTY_DRAFT,
  type DayHours,
  type RegistrationDraft,
  type SlotMinutes,
} from "@/features/business-registration/registration";
import type { BusinessCategorySlug } from "@/features/business/categories";
import { ScheduleEditor, type EditorSection } from "@/features/manage/components/schedule-editor";
import {
  getManagedBusiness,
  isSamplePlace,
  type ManagedBusiness,
} from "@/features/manage/manage-db";
import { getI18n } from "@/i18n/server";
import { requireBusinessAccess } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

const SECTIONS: readonly EditorSection[] = ["hours", "services", "staff"];

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.dashboard.editor.metaTitle, robots: { index: false } };
}

/** Хадгалсан мэдээллийг бүртгэлийн маягтын хэлбэрт оруулна, ингэснээр маягтын алхмууд засварлаж чадна. */
function toDraft(business: ManagedBusiness): RegistrationDraft {
  const hours = Array.from({ length: 7 }, (_, index): DayHours => {
    const day = business.hours.find((item) => item.weekday === index + 1);
    return day
      ? { open: true, opens: day.opens, closes: day.closes }
      : { open: false, opens: "09:00", closes: "18:00" };
  });
  return {
    ...EMPTY_DRAFT,
    category: business.category as BusinessCategorySlug,
    hours,
    hoursEdited: true,
    slotMinutes: business.slotMinutes as SlotMinutes,
    services: business.services.map((service, index) => ({ id: `service-${index}`, ...service })),
    staff: business.staff.map((member) => ({
      id: `staff-${member.position}`,
      name: member.name,
      position: member.position,
    })),
  };
}

/** Газрын цагийн хуваарь, үйлчилгээ, ажилтныг нэг табаар нь эзэмшигч, менежер засах хуудас. */
export default async function EditPlace(
  props: PageProps<"/dashboard/[slug]/edit">,
): Promise<JSX.Element> {
  const { slug } = await props.params;
  await requireBusinessAccess(slug, `/dashboard/${slug}/edit`);
  const business = await getManagedBusiness(slug);
  if (!business) notFound();

  const { t } = await getI18n();
  const { tab } = await props.searchParams;
  const section = SECTIONS.find((item) => item === tab) ?? "hours";
  const words = t.dashboard.editor;
  const labels: Record<EditorSection, string> = {
    hours: t.dashboard.hours,
    services: t.dashboard.services,
    staff: t.dashboard.staff,
  };

  return (
    <Container className="py-8 md:py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/dashboard/${slug}`}
          className="inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {words.back}
        </Link>
        <h1 className="mt-4 font-heading text-heading font-medium text-foreground">
          {business.name}
        </h1>
        <p className="text-sm text-muted-foreground">{words.title}</p>

        {isSamplePlace(slug) ? (
          <p className="mt-6 rounded-md bg-surface-muted px-4 py-3 text-sm text-foreground">
            {words.samplePlace}
          </p>
        ) : (
          <>
            <nav
              aria-label={words.tabsLabel}
              className="mt-6 inline-flex rounded-full border border-border bg-surface p-0.5"
            >
              {SECTIONS.map((option) => (
                <Link
                  key={option}
                  href={`/dashboard/${slug}/edit?tab=${option}`}
                  aria-current={section === option ? "page" : undefined}
                  className={cn(
                    "flex h-8 items-center rounded-full px-3.5 text-xs font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring",
                    section === option
                      ? "bg-foreground text-background"
                      : "text-muted-foreground is-hover:text-foreground",
                  )}
                >
                  {labels[option]}
                </Link>
              ))}
            </nav>
            {/* Шинэ таб өөр табын хадгалаагүй засвараас биш, хадгалагдсан утгаас эхэлнэ. */}
            <ScheduleEditor
              key={section}
              slug={slug}
              section={section}
              initial={toDraft(business)}
            />
          </>
        )}
      </div>
    </Container>
  );
}
