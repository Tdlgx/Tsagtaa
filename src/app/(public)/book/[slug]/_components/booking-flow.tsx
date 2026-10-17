"use client";

import { ArrowLeft, ArrowRight, CircleAlert, Clock, Info, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent, type JSX, type ReactNode } from "react";

import { BookingSuccess } from "@/app/(public)/book/[slug]/_components/booking-success";
import { PointsBox } from "@/app/(public)/book/[slug]/_components/points-box";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldHint, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createBookingAction, type CreateBookingInput } from "@/features/booking/actions";
import { isTaken, type TakenSlot } from "@/features/booking/availability";
import { formatPhone, normalizePhone, type Booking } from "@/features/booking/booking";
import { addBooking } from "@/features/booking/booking-store";
import { BookingStepper } from "@/features/booking/components/booking-stepper";
import { TimeSlot, TimeSlotGroup } from "@/features/booking/components/time-slot";
import type { SampleBusiness } from "@/features/business/sample-businesses";
import {
  DAY_END,
  DAY_START,
  TIMES_OF_DAY,
  toClock,
  toMinutes,
  type SearchClock,
  type SearchDay,
} from "@/features/business/search";
import { maxRedeemable, type LoyaltySettings } from "@/features/points/points";
import { readProfile, saveProfile } from "@/features/profile/profile-store";
import { localizeBusiness } from "@/features/business/localize";
import { getInitial, getSampleStaff, type StaffMember } from "@/features/staff/sample-staff";
import { useLocale, useT } from "@/i18n/client";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatMNT } from "@/lib/currency";
import { cn } from "@/lib/utils";

const ANY_STAFF = "any";

/** Avatar tints, cycled per person so faces are told apart at a glance. */
const AVATAR_TONES = [
  "bg-primary-soft text-primary-strong",
  "bg-sun-soft text-sun-strong",
  "bg-success-soft text-success-foreground",
] as const;

type SlotStatus = "available" | "booked" | "past";
type DaySlot = { time: string; start: number; status: SlotStatus };

/** Points rules, and the signed-in customer (null when signed out). */
export type BookingPoints = {
  settings: LoyaltySettings;
  customer: { name: string; phone: string; balance: number } | null;
};

type BookingFlowProps = {
  /** Stored (Mongolian) data: what the booking saves. Display text is localized here. */
  business: SampleBusiness;
  initial: { day: SearchDay; time: string; serviceIndex: number | null };
  /** Server time when the page was rendered: hides times that already passed today. */
  clock: Pick<SearchClock, "nowMinutes" | "todayLabel" | "tomorrowLabel">;
  /** Times already booked in the database, per person. */
  taken: readonly TakenSlot[];
  /** null: points are off or could not be loaded. */
  points: BookingPoints | null;
};

/**
 * The 4-step booking: service → who → time → contact details. Every choice
 * stays editable from the summary, and a time picked on the search page
 * arrives preselected.
 */
export function BookingFlow({
  business: canonical,
  initial,
  clock,
  taken,
  points,
}: BookingFlowProps): JSX.Element {
  const locale = useLocale();
  const t = useT();
  const business = localizeBusiness(canonical, locale);
  const staff = getSampleStaff(canonical, locale);
  const words = t.staff[business.category];
  const steps = [t.book.steps.service, words.stepLabel, t.book.steps.time, t.book.steps.confirm];
  const [step, setStep] = useState(0);
  const [serviceIndex, setServiceIndex] = useState<number | null>(initial.serviceIndex);
  const [staffId, setStaffId] = useState(ANY_STAFF);
  const [day, setDay] = useState<SearchDay>(initial.day);
  const [time, setTime] = useState(initial.time);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; consent?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<Booking | null>(null);
  // Times lost to someone faster while this page was open; the refreshed page
  // brings them too, this just shows them without waiting for it.
  const [lost, setLost] = useState<TakenSlot[]>([]);
  const [slotTaken, setSlotTaken] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Points the customer chose to spend; trimmed below to what this service allows.
  const [pointsWanted, setPointsWanted] = useState(0);
  // One id per booking attempt: a double click or a retry is stored once.
  const [requestId] = useState(() => crypto.randomUUID());
  const router = useRouter();
  const topRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const service = serviceIndex === null ? null : (business.services[serviceIndex] ?? null);
  const chosenStaff = staff.find((member) => member.id === staffId) ?? null;
  const customer = points?.customer ?? null;
  const pointsUsed =
    points && customer && service
      ? Math.min(pointsWanted, maxRedeemable(service.price, customer.balance, points.settings))
      : 0;
  const total = service ? service.price - pointsUsed : null;
  const allTaken = [...taken, ...lost];

  /** On duty at `slotTime` and not booked for the whole service. */
  const isFree = (member: StaffMember, forDay: SearchDay, slotTime: string): boolean =>
    member.open[forDay].includes(slotTime) &&
    !isTaken(allTaken, member.id, forDay, toMinutes(slotTime), service?.duration ?? 0);

  const openFor = (memberId: string, forDay: SearchDay): readonly string[] => {
    const members = memberId === ANY_STAFF ? staff : staff.filter((m) => m.id === memberId);
    const times = new Set(
      members.flatMap((member) => member.open[forDay].filter((t) => isFree(member, forDay, t))),
    );
    return [...times];
  };

  const slotsFor = (forDay: SearchDay): DaySlot[] => {
    const open = new Set(openFor(staffId, forDay));
    const duration = service?.duration ?? 0;
    // Half-hour grid plus any off-grid open times, so the day reads as a full schedule.
    const grid = new Set<string>(open);
    for (let minute = DAY_START; minute < DAY_END; minute += 30) grid.add(toClock(minute));

    return [...grid]
      .map((slotTime): DaySlot => {
        const start = toMinutes(slotTime);
        const isPast = forDay === "today" && start <= clock.nowMinutes;
        const fits = start + duration <= DAY_END;
        const status: SlotStatus = isPast
          ? "past"
          : open.has(slotTime) && fits
            ? "available"
            : "booked";
        return { time: slotTime, start, status };
      })
      .sort((a, b) => a.start - b.start);
  };

  const daySlots = slotsFor(day);
  const freeCount = (forDay: SearchDay): number =>
    slotsFor(forDay).filter((slot) => slot.status === "available").length;
  const timeIsValid = daySlots.some((slot) => slot.time === time && slot.status === "available");

  const canContinue = [service !== null, true, timeIsValid, true][step] ?? false;

  const goTo = (next: number): void => {
    setStep(next);
    // Returning customers: fill in what the account or the profile already knows.
    if (next === steps.length - 1) {
      const profile = readProfile();
      const known = customer ?? profile;
      if (!name && known.name) setName(known.name);
      if (!phone && known.phone) setPhone(formatPhone(known.phone));
    }
    // Bring the step into view and move focus to its heading for screen readers.
    requestAnimationFrame(() => {
      const top = topRef.current?.getBoundingClientRect().top ?? 0;
      if (top < 0) topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      headingRef.current?.focus({ preventScroll: true });
    });
  };

  const chooseStaff = (id: string): void => {
    setStaffId(id);
    if (time && !openFor(id, day).includes(time)) setTime("");
  };

  const chooseDay = (next: SearchDay): void => {
    setDay(next);
    setTime("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    // Enter on an earlier step means "next", not "book".
    if (step < steps.length - 1) {
      if (canContinue) goTo(step + 1);
      return;
    }
    const normalized = normalizePhone(phone);
    const nextErrors = {
      name: name.trim().length < 2 ? t.book.errors.name : undefined,
      phone: normalized ? undefined : t.book.errors.phone,
      consent: consent ? undefined : t.book.errors.consent,
    };
    setErrors(nextErrors);
    // Take the customer to the first problem, clear of the sticky action bar.
    const firstInvalid = (["name", "phone", "consent"] as const).find((key) => nextErrors[key]);
    if (firstInvalid) {
      const field = document.getElementById(`booking-${firstInvalid}`);
      field?.focus({ preventScroll: true });
      field?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (
      nextErrors.name ||
      nextErrors.phone ||
      nextErrors.consent ||
      serviceIndex === null ||
      !normalized
    ) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    // The server checks everything again; the database guarantees the time is not taken twice.
    const result = await createBookingAction({
      requestId,
      slug: canonical.slug,
      serviceIndex,
      staffId,
      day,
      time,
      name: name.trim(),
      phone: normalized,
      note: note.trim(),
      consent: true, // checked above
      points: pointsUsed,
    } satisfies CreateBookingInput);
    setSubmitting(false);

    if (!result.ok) {
      if (result.error === "slot_taken" || result.error === "unavailable") {
        // Someone was faster. Mark the time as gone for the people who could
        // have taken it, refresh the schedule, and send the customer back to pick again.
        const start = toMinutes(time);
        const end = start + (service?.duration ?? 30);
        setLost((prev) => [
          ...prev,
          ...staff
            .filter((member) => staffId === ANY_STAFF || member.id === staffId)
            .map((member) => ({ staffId: member.id, day, start, end })),
        ]);
        setTime("");
        setSlotTaken(true);
        goTo(2);
        router.refresh();
        return;
      }
      if (result.error === "points") {
        // The balance changed (spent elsewhere): show the fresh one and let them choose again.
        setPointsWanted(0);
        setSubmitError(t.book.errors.points);
        router.refresh();
        return;
      }
      setSubmitError(result.error === "server" ? t.book.errors.server : t.book.errors.invalid);
      return;
    }

    const { booking } = result;
    addBooking(booking);
    // First booking on this device: remember the details for next time.
    if (!readProfile().phone) saveProfile({ name: booking.customerName, phone: normalized });
    setDone(booking);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (done) {
    return <BookingSuccess booking={done} />;
  }

  const dayLabel = day === "today" ? clock.todayLabel : clock.tomorrowLabel;
  const endTime = service && time ? toClock(toMinutes(time) + service.duration) : null;

  return (
    <div ref={topRef} className="mt-8 scroll-mt-24 md:mt-10">
      <BookingStepper
        currentStep={step}
        steps={steps}
        labels={{
          progress: t.book.progress,
          stepOf: t.book.stepOf,
          done: t.book.stepDoneSr,
          current: t.book.stepCurrentSr,
        }}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
        <form
          onSubmit={(event) => void submit(event)}
          noValidate
          className="min-w-0"
          aria-labelledby="booking-step-title"
        >
          {/* Re-keyed per step, so each one slides in. */}
          <div
            key={step}
            className="animate-in duration-300 ease-soft fade-in slide-in-from-right-4"
          >
            <h2
              ref={headingRef}
              id="booking-step-title"
              tabIndex={-1}
              className="font-heading text-xl font-medium text-foreground outline-none"
            >
              {
                [
                  t.book.headings.service,
                  words.heading,
                  t.book.headings.time,
                  t.book.headings.details,
                ][step]
              }
            </h2>

            {step === 0 ? (
              <ServiceStep
                services={business.services}
                t={t}
                value={serviceIndex}
                onChange={setServiceIndex}
              />
            ) : null}

            {step === 1 ? (
              <StaffStep
                staff={staff}
                anyLabel={words.anyLabel}
                t={t}
                value={staffId}
                countFor={(id) => openFor(id, day).length}
                dayWord={day === "today" ? t.common.todayWord : t.common.tomorrowWord}
                onChange={chooseStaff}
              />
            ) : null}

            {step === 2 ? (
              <div className="mt-6 flex flex-col gap-6">
                <fieldset>
                  <legend className="sr-only">{t.book.steps.time}</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {(["today", "tomorrow"] as const).map((option) => (
                      <label key={option} className="relative">
                        <input
                          type="radio"
                          name="day"
                          value={option}
                          checked={day === option}
                          onChange={() => chooseDay(option)}
                          className="peer sr-only"
                        />
                        <span className="flex cursor-pointer flex-col gap-0.5 rounded-lg border border-border bg-surface px-4 py-3 transition-colors duration-150 ease-soft peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background peer-focus-visible:ring-3 peer-focus-visible:ring-ring is-hover:border-muted-foreground">
                          <span className="text-sm font-semibold">
                            {option === "today" ? t.common.today : t.common.tomorrow}
                          </span>
                          <span className="text-xs opacity-75">
                            {option === "today" ? clock.todayLabel : clock.tomorrowLabel} ·{" "}
                            <span className="tabular-nums">
                              {t.book.dayOpen(freeCount(option))}
                            </span>
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {slotTaken ? (
                  <p
                    role="alert"
                    className="flex animate-in items-start gap-2.5 rounded-md bg-danger-soft px-4 py-3 text-sm text-danger-foreground duration-250 fade-in"
                  >
                    <CircleAlert className="mt-0.5 size-4 shrink-0" />
                    <span>
                      <span className="font-medium">{t.book.slotTakenTitle}</span>{" "}
                      {t.book.slotTakenText}
                    </span>
                  </p>
                ) : null}

                <SlotLegend t={t} />

                {daySlots.some((slot) => slot.status === "available") ? (
                  TIMES_OF_DAY.map((part) => {
                    const partSlots = daySlots.filter(
                      (slot) => slot.start >= part.from && slot.start < part.to,
                    );
                    if (partSlots.length === 0) return null;
                    return (
                      <TimeSlotGroup key={part.value} legend={t.search.parts[part.value]}>
                        {partSlots.map((slot) => (
                          <TimeSlot
                            key={slot.time}
                            name="time"
                            time={slot.time}
                            status={slot.status}
                            checked={time === slot.time}
                            onChange={() => {
                              setTime(slot.time);
                              setSlotTaken(false);
                            }}
                            unavailableLabel={
                              slot.status === "past" ? t.book.slotPastSr : t.book.slotBookedSr
                            }
                          />
                        ))}
                      </TimeSlotGroup>
                    );
                  })
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-surface p-6 text-center">
                    <p className="text-base font-medium text-foreground">
                      {t.book.noSlots(day === "today" ? t.common.todayWord : t.common.tomorrowWord)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t.book.noSlotsHint(words.anyLabel)}
                    </p>
                    {day === "today" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => chooseDay("tomorrow")}
                      >
                        {t.book.seeTomorrow}
                      </Button>
                    ) : null}
                  </div>
                )}

                {timeIsValid && endTime ? (
                  <p className="flex animate-in items-center gap-2 rounded-md bg-primary-soft px-4 py-3 text-sm text-primary-strong duration-250 fade-in">
                    <Clock className="size-4 shrink-0" />
                    <span className="tabular-nums">
                      {t.book.yourTime(dayLabel, `${time}–${endTime}`)}
                    </span>
                  </p>
                ) : null}
              </div>
            ) : null}

            {step === 3 ? (
              <div className="mt-6 flex flex-col gap-5">
                <Field>
                  <Label htmlFor="booking-name">{t.book.name}</Label>
                  <Input
                    id="booking-name"
                    name="name"
                    autoComplete="given-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "booking-name-error" : undefined}
                    placeholder={t.book.namePlaceholder}
                  />
                  <FieldError id="booking-name-error">{errors.name}</FieldError>
                </Field>
                <Field>
                  <Label htmlFor="booking-phone">{t.book.phone}</Label>
                  <Input
                    id="booking-phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={13}
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? "booking-phone-error" : "booking-phone-hint"}
                    placeholder="9911 2233"
                    className="tabular-nums"
                  />
                  {errors.phone ? (
                    <FieldError id="booking-phone-error">{errors.phone}</FieldError>
                  ) : (
                    <FieldHint id="booking-phone-hint">{t.book.phoneHint}</FieldHint>
                  )}
                </Field>
                <Field>
                  <Label htmlFor="booking-note">
                    {t.book.note}{" "}
                    <span className="font-normal text-muted-foreground">{t.common.optional}</span>
                  </Label>
                  <Textarea
                    id="booking-note"
                    name="note"
                    rows={3}
                    maxLength={300}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder={t.book.notePlaceholder}
                    aria-describedby="booking-note-hint"
                  />
                  <FieldHint id="booking-note-hint">{t.book.noteHint}</FieldHint>
                </Field>
                {/* Consent before processing (Law on Personal Data Protection); never pre-ticked. */}
                <Field>
                  <div className="flex items-start gap-3">
                    <input
                      id="booking-consent"
                      name="consent"
                      type="checkbox"
                      checked={consent}
                      onChange={(event) => {
                        setConsent(event.target.checked);
                        if (event.target.checked)
                          setErrors((prev) => ({ ...prev, consent: undefined }));
                      }}
                      aria-invalid={Boolean(errors.consent)}
                      aria-describedby={errors.consent ? "booking-consent-error" : undefined}
                      className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary-strong"
                    />
                    <p className="text-sm text-foreground">
                      <label htmlFor="booking-consent" className="cursor-pointer">
                        {t.book.consent}
                      </label>{" "}
                      <Link
                        href="/privacy"
                        target="_blank"
                        className="font-medium underline underline-offset-4 outline-none focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring"
                      >
                        {t.book.consentLink}
                      </Link>
                    </p>
                  </div>
                  <FieldError id="booking-consent-error">{errors.consent}</FieldError>
                </Field>
                {points && service ? (
                  <PointsBox
                    settings={points.settings}
                    balance={customer?.balance ?? null}
                    price={service.price}
                    value={pointsUsed}
                    onChange={setPointsWanted}
                    signInHref={`/login?next=${encodeURIComponent(
                      `/book/${canonical.slug}?service=${serviceIndex}&day=${day}&time=${time}`,
                    )}`}
                    t={t}
                  />
                ) : null}
                {submitError ? (
                  <p
                    role="alert"
                    className="flex items-start gap-2.5 rounded-md bg-danger-soft px-4 py-3 text-sm text-danger-foreground"
                  >
                    <CircleAlert className="mt-0.5 size-4 shrink-0" />
                    <span>{submitError}</span>
                  </p>
                ) : null}
                <p className="flex items-start gap-2.5 rounded-md border border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
                  <Info className="mt-0.5 size-4 shrink-0 text-primary-strong" />
                  <span>{t.book.payInfo}</span>
                </p>
              </div>
            ) : null}
          </div>

          {/* Action bar: sticks above the phone tab bar, sits inline on desktop. */}
          <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 mt-8 md:bottom-4">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface/90 p-2 pl-4 shadow-lg backdrop-blur-md">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {service ? service.name : t.book.chooseService}
                </p>
                <p className="truncate text-xs text-muted-foreground tabular-nums">
                  {[total === null ? null : formatMNT(total), timeIsValid ? time : null]
                    .filter(Boolean)
                    .join(" · ") || t.book.stepOf(step + 1, steps.length)}
                </p>
              </div>
              {step > 0 ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => goTo(step - 1)}
                  aria-label={t.book.previous}
                >
                  <ArrowLeft />
                </Button>
              ) : null}
              {step < steps.length - 1 ? (
                <Button disabled={!canContinue} onClick={() => goTo(step + 1)}>
                  {t.book.continue}
                  <ArrowRight data-icon="end" />
                </Button>
              ) : (
                <Button type="submit" loading={submitting}>
                  {t.book.confirm}
                </Button>
              )}
            </div>
          </div>
        </form>

        <Summary
          rows={[
            {
              label: t.book.steps.service,
              value: service?.name,
              detail: service ? t.common.minutes(service.duration) : undefined,
              onEdit: () => goTo(0),
            },
            {
              label: words.stepLabel,
              value: chosenStaff?.name ?? words.anyLabel,
              detail: chosenStaff?.role,
              onEdit: () => goTo(1),
            },
            {
              label: t.book.steps.time,
              value: timeIsValid && endTime ? `${time}–${endTime}` : undefined,
              detail: timeIsValid ? dayLabel : undefined,
              onEdit: service ? () => goTo(2) : undefined,
            },
          ]}
          total={total}
          discount={pointsUsed}
          t={t}
          currentStep={step}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

type ServiceStepProps = {
  services: SampleBusiness["services"];
  value: number | null;
  onChange: (index: number) => void;
  t: Dictionary;
};

function ServiceStep({ services, value, onChange, t }: ServiceStepProps): JSX.Element {
  return (
    <fieldset className="mt-6">
      <legend className="sr-only">{t.book.steps.service}</legend>
      <div className="flex flex-col gap-2">
        {services.map((service, index) => (
          <ChoiceCard
            key={service.name}
            name="service"
            checked={value === index}
            onChange={() => onChange(index)}
          >
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-base font-medium text-foreground">{service.name}</span>
                {index === 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sun-soft px-2 py-0.5 text-xs font-medium text-sun-strong">
                    <Sparkles className="size-3" />
                    {t.book.popular}
                  </span>
                ) : null}
              </span>
              <span className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums">
                <Clock className="size-4" />
                {t.common.minutes(service.duration)}
              </span>
            </span>
            <span className="text-base font-semibold text-foreground tabular-nums">
              {formatMNT(service.price)}
            </span>
          </ChoiceCard>
        ))}
      </div>
    </fieldset>
  );
}

type StaffStepProps = {
  staff: readonly StaffMember[];
  anyLabel: string;
  value: string;
  countFor: (id: string) => number;
  dayWord: string;
  onChange: (id: string) => void;
  t: Dictionary;
};

function StaffStep({
  staff,
  anyLabel,
  value,
  countFor,
  dayWord,
  onChange,
  t,
}: StaffStepProps): JSX.Element {
  return (
    <fieldset className="mt-6">
      <legend className="sr-only">{t.book.whoLegend}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        <ChoiceCard
          name="staff"
          checked={value === ANY_STAFF}
          onChange={() => onChange(ANY_STAFF)}
          className="sm:col-span-2"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-ink text-primary">
            <Users className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-medium text-foreground">{anyLabel}</span>
            <span className="block text-sm text-muted-foreground">
              {t.book.mostOpen} ·{" "}
              <span className="tabular-nums">{t.book.openCount(countFor(ANY_STAFF))}</span>{" "}
              {dayWord}
            </span>
          </span>
        </ChoiceCard>
        {staff.map((member, index) => (
          <ChoiceCard
            key={member.id}
            name="staff"
            checked={value === member.id}
            onChange={() => onChange(member.id)}
          >
            <span
              aria-hidden
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-full font-heading text-lg font-medium",
                AVATAR_TONES[index % AVATAR_TONES.length],
              )}
            >
              {getInitial(member.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-medium text-foreground">
                {member.name}
              </span>
              <span className="block text-sm text-muted-foreground">
                {member.role} ·{" "}
                <span className="tabular-nums">{t.book.openCount(countFor(member.id))}</span>
              </span>
            </span>
          </ChoiceCard>
        ))}
      </div>
    </fieldset>
  );
}

type ChoiceCardProps = {
  name: string;
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
  className?: string;
};

/** A radio button drawn as a card; the whole card is the click target. */
function ChoiceCard({
  name,
  checked,
  onChange,
  children,
  className,
}: ChoiceCardProps): JSX.Element {
  return (
    <label className={cn("relative block", className)}>
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        className={cn(
          "flex cursor-pointer items-center gap-4 rounded-lg border border-border bg-surface px-4 py-4 transition-[border-color,background-color,box-shadow] duration-150 ease-soft",
          "is-hover:border-muted-foreground",
          "peer-checked:border-primary-strong peer-checked:bg-primary-soft peer-checked:shadow-sm",
          "peer-focus-visible:ring-3 peer-focus-visible:ring-ring",
        )}
      >
        {children}
        {/* Radio dot: hollow when idle, filled lime with an ink centre when chosen. */}
        <span
          aria-hidden
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150 ease-soft",
            checked ? "border-primary-strong bg-primary" : "border-input",
          )}
        >
          <span
            className={cn(
              "size-2 rounded-full bg-primary-foreground transition-transform duration-150 ease-soft",
              checked ? "scale-100" : "scale-0",
            )}
          />
        </span>
      </span>
    </label>
  );
}

function SlotLegend({ t }: { t: Dictionary }): JSX.Element {
  const items = [
    { label: t.book.slotLegend.open, className: "border border-border bg-surface" },
    { label: t.book.slotLegend.booked, className: "border border-border bg-hatch" },
    { label: t.book.slotLegend.past, className: "bg-surface-muted" },
  ];
  return (
    <ul aria-hidden className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <span className={cn("h-3 w-5 rounded-full", item.className)} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

type SummaryRow = {
  label: string;
  value: string | undefined;
  detail?: string;
  onEdit?: () => void;
};

type SummaryProps = {
  rows: readonly SummaryRow[];
  total: number | null;
  /** Paid in points, already taken off `total`. */
  discount: number;
  currentStep: number;
  t: Dictionary;
};

/** Receipt of the choices so far. Sticky on desktop; on phones it follows the form. */
function Summary({ rows, total, discount, currentStep, t }: SummaryProps): JSX.Element {
  return (
    <aside aria-label={t.book.summary.label} className="lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {t.book.summary.title}
        </p>
        <dl className="mt-4 flex flex-col">
          {rows.map((row, index) => (
            <div
              key={row.label}
              className="relative flex gap-3 border-b border-dashed border-border py-3 first:pt-0"
            >
              <span
                aria-hidden
                className={cn(
                  "mt-1.5 size-2.5 shrink-0 rounded-full transition-colors duration-250 ease-soft",
                  row.value
                    ? "bg-primary ring-2 ring-primary-strong/30"
                    : index === currentStep
                      ? "bg-sun"
                      : "bg-border",
                )}
              />
              <div className="min-w-0 flex-1">
                <dt className="text-xs text-muted-foreground">{row.label}</dt>
                <dd className="text-sm font-medium text-foreground">
                  {row.value ?? <span className="font-normal text-muted-foreground">—</span>}
                  {row.detail ? (
                    <span className="block text-xs font-normal text-muted-foreground tabular-nums">
                      {row.detail}
                    </span>
                  ) : null}
                </dd>
              </div>
              {row.value && row.onEdit && index !== currentStep ? (
                <button
                  type="button"
                  onClick={row.onEdit}
                  className="self-start rounded-sm text-xs font-medium text-primary-strong underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
                >
                  {t.common.edit}
                </button>
              ) : null}
            </div>
          ))}
        </dl>
        {discount > 0 ? (
          <div className="mt-4 flex animate-in items-baseline justify-between text-sm duration-250 fade-in">
            <span className="text-muted-foreground">{t.points.book.summaryLine}</span>
            <span className="font-medium text-primary-strong tabular-nums">
              −{formatMNT(discount)}
            </span>
          </div>
        ) : null}
        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">{t.book.summary.total}</span>
          <span className="font-heading text-xl font-medium text-foreground tabular-nums">
            {total === null ? "—" : formatMNT(total)}
          </span>
        </div>
      </div>
    </aside>
  );
}
