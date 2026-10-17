"use client";

import { ArrowLeft, ArrowRight, CircleAlert, CloudCheck, RotateCcw, Send } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type JSX } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingStepper } from "@/features/booking/components/booking-stepper";
import { registerBusinessAction } from "@/features/business-registration/actions";
import { BasicsStep } from "@/features/business-registration/components/basics-step";
import { CategoryStep } from "@/features/business-registration/components/category-step";
import { HoursStep } from "@/features/business-registration/components/hours-step";
import {
  Completeness,
  ListingPreview,
} from "@/features/business-registration/components/listing-preview";
import {
  RegistrationSuccess,
  type RegisteredBusiness,
} from "@/features/business-registration/components/registration-success";
import {
  EMPTY_OWNER,
  getOwnerErrors,
  type OwnerErrors,
  type OwnerFields,
} from "@/features/business-registration/components/owner-fields";
import { ReviewStep } from "@/features/business-registration/components/review-step";
import { ServicesStep } from "@/features/business-registration/components/services-step";
import {
  addStaff,
  nextBayName,
  StaffStep,
} from "@/features/business-registration/components/staff-step";
import {
  clearDraft,
  hasProgress,
  takeFirstTourVisit,
  updateDraft,
  useDraft,
} from "@/features/business-registration/draft-store";
import {
  firstInvalidStep,
  STEPS,
  validateStep,
  type RegistrationDraft,
  type RegistrationInput,
  type StepErrors,
} from "@/features/business-registration/registration";
import { useLocale, useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

/** "service:abc:name" → the input's id "reg-service-abc-name". */
const fieldId = (key: string): string => `reg-${key.replaceAll(":", "-")}`;

/**
 * Six-step business registration. The form lives in an autosaved draft, so
 * every keystroke survives a reload; each step is checked before moving on,
 * and the server checks everything again when it is sent.
 */
export function RegistrationWizard(): JSX.Element {
  const draft = useDraft();
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [errors, setErrors] = useState<StepErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  // The owner's sign-in. Kept in memory only, never in the autosaved draft.
  const [owner, setOwner] = useState<OwnerFields>(EMPTY_OWNER);
  const [ownerErrors, setOwnerErrors] = useState<OwnerErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<RegisteredBusiness | null>(null);
  // Known once the saved draft is read: was there earlier work to continue?
  const [restored, setRestored] = useState<boolean | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const ready = draft !== null;

  if (draft && restored === null) setRestored(hasProgress(draft));

  // The first visit starts the guided tour once the form is on screen.
  useEffect(() => {
    if (ready && takeFirstTourVisit()) router.replace(`${pathname}?tour=1`, { scroll: false });
  }, [ready, pathname, router]);

  if (done) {
    return (
      <RegistrationSuccess
        business={done}
        onAnother={() => {
          setDone(null);
          setConsent(false);
          setRestored(false);
        }}
      />
    );
  }

  if (!draft) return <WizardSkeleton label={t.register.loading} />;

  const words = t.register;
  const step = Math.min(draft.step, STEPS.length - 1);
  const stepKey = STEPS[step] ?? "category";
  const isLast = step === STEPS.length - 1;
  // Once a step has shown its problems, re-check as the owner types so fixed ones disappear.
  const shown = Object.keys(errors).length > 0 ? validateStep(stepKey, draft) : {};

  const scrollToTop = (): void => {
    requestAnimationFrame(() => {
      const top = topRef.current?.getBoundingClientRect().top ?? 0;
      if (top < 0) topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      headingRef.current?.focus({ preventScroll: true });
    });
  };

  const showErrors = (next: StepErrors): void => {
    setErrors(next);
    const first = Object.keys(next)[0];
    if (!first) return;
    requestAnimationFrame(() => {
      const field = document.getElementById(fieldId(first));
      field?.focus({ preventScroll: true });
      field?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const goTo = (next: number, prepare?: (d: RegistrationDraft) => RegistrationDraft): void => {
    updateDraft((d) => (prepare ? prepare({ ...d, step: next }) : { ...d, step: next }));
    setErrors({});
    setBanner(null);
    scrollToTop();
  };

  const goNext = (): void => {
    const problems = validateStep(stepKey, draft);
    if (Object.keys(problems).length > 0) {
      showErrors(problems);
      return;
    }
    // Arriving at the staff step with nobody listed: a car wash gets its
    // first bay, anyone else an empty row ready to type into.
    if (STEPS[step + 1] === "staff" && draft.staff.length === 0) {
      goTo(step + 1);
      addStaff(draft.category === "car-wash" ? nextBayName(draft, t) : "");
      return;
    }
    goTo(step + 1);
  };

  const submit = async (): Promise<void> => {
    const invalid = firstInvalidStep(draft);
    const invalidKey = STEPS[invalid];
    if (invalid !== -1 && invalidKey) {
      goTo(invalid);
      setBanner(words.errors.fixBefore);
      showErrors(validateStep(invalidKey, draft));
      return;
    }
    const problems = getOwnerErrors(owner, t);
    setOwnerErrors(problems);
    const firstOwnerField = Object.keys(problems)[0];
    if (firstOwnerField) {
      document.getElementById(`reg-owner-${firstOwnerField}`)?.focus();
      return;
    }
    if (!consent || !draft.category || !draft.district) {
      setConsentError(true);
      document.getElementById("reg-consent")?.focus();
      return;
    }

    setSubmitting(true);
    setBanner(null);
    const result = await registerBusinessAction({
      requestId: draft.requestId,
      category: draft.category,
      name: draft.name.trim(),
      slug: draft.slug,
      district: draft.district,
      address: draft.address.trim(),
      phone: draft.phone,
      email: draft.email.trim(),
      registerNumber: draft.registerNumber.trim(),
      description: draft.description.trim(),
      slotMinutes: draft.slotMinutes,
      hours: draft.hours,
      services: draft.services.map((service) => ({ ...service, name: service.name.trim() })),
      staff: draft.staff.map((member) => ({ ...member, name: member.name.trim() })),
      ownerName: owner.name.trim(),
      password: owner.password,
      consent: true,
    } satisfies RegistrationInput);
    setSubmitting(false);

    if (result.ok) {
      setDone({ name: draft.name.trim(), slug: result.slug, category: draft.category });
      setOwner(EMPTY_OWNER);
      clearDraft();
      return;
    }

    switch (result.error) {
      case "slug_taken": {
        // Someone took the address a moment ago: offer the free one in its place.
        const suggestion = result.suggestion ?? "";
        goTo(1, (d) => ({ ...d, slug: suggestion || d.slug, slugEdited: true }));
        setBanner(words.errors.slugTaken(suggestion));
        break;
      }
      case "register_taken":
        goTo(1);
        setBanner(words.errors.registerTaken);
        break;
      case "owner_password":
        setOwnerErrors({ password: words.errors.ownerPassword });
        document.getElementById("reg-owner-password")?.focus();
        break;
      case "password":
        setOwnerErrors({ password: words.errors.password });
        document.getElementById("reg-owner-password")?.focus();
        break;
      case "invalid": {
        const back = result.step ?? 0;
        goTo(back);
        setBanner(words.errors.invalid);
        const key = STEPS[back];
        if (key) showErrors(validateStep(key, draft));
        break;
      }
      default:
        setBanner(words.errors.server);
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    // Enter on an earlier step means "next", not "send".
    if (isLast) void submit();
    else goNext();
  };

  const startOver = (): void => {
    if (!window.confirm(words.startOverConfirm)) return;
    clearDraft();
    setErrors({});
    setBanner(null);
    setConsent(false);
    setRestored(false);
    scrollToTop();
  };

  return (
    <div ref={topRef} className="scroll-mt-24">
      <div data-tour="reg-stepper">
        <BookingStepper
          currentStep={step}
          steps={STEPS.map((key) => words.steps[key])}
          labels={{
            progress: words.metaTitle,
            stepOf: words.stepOf,
            done: t.book.stepDoneSr,
            current: t.book.stepCurrentSr,
          }}
          onStepSelect={(index) => goTo(index)}
        />
      </div>

      {/* Phones: score and autosave above the form, since the side panel is hidden. */}
      <div className="mt-6 rounded-lg border border-border bg-surface p-4 lg:hidden">
        <div data-tour="reg-score">
          <Completeness draft={draft} t={t} compact />
        </div>
        <DraftStatus restored={restored} onStartOver={startOver} t={t} className="mt-3" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
        <form onSubmit={onSubmit} noValidate className="min-w-0" aria-labelledby="reg-step-title">
          <div
            key={step}
            data-tour="reg-step"
            className="animate-in duration-300 ease-soft fade-in slide-in-from-right-4"
          >
            <h2
              ref={headingRef}
              id="reg-step-title"
              tabIndex={-1}
              className="font-heading text-xl font-medium text-foreground outline-none"
            >
              {words.headings[stepKey]}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{words.leads[stepKey]}</p>

            {banner ? (
              <p
                role="alert"
                className="mt-4 flex animate-in items-start gap-2.5 rounded-md bg-danger-soft px-4 py-3 text-sm text-danger-foreground duration-250 fade-in"
              >
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                <span>{banner}</span>
              </p>
            ) : null}

            {stepKey === "category" ? <CategoryStep draft={draft} errors={shown} t={t} /> : null}
            {stepKey === "basics" ? <BasicsStep draft={draft} errors={shown} t={t} /> : null}
            {stepKey === "hours" ? <HoursStep draft={draft} errors={shown} t={t} /> : null}
            {stepKey === "services" ? (
              <ServicesStep draft={draft} errors={shown} t={t} locale={locale} />
            ) : null}
            {stepKey === "staff" ? (
              <StaffStep draft={draft} errors={shown} t={t} locale={locale} />
            ) : null}
            {stepKey === "review" ? (
              <ReviewStep
                draft={draft}
                t={t}
                consent={consent}
                consentError={consentError}
                owner={owner}
                ownerErrors={ownerErrors}
                onOwnerChange={(change) => {
                  setOwner((current) => ({ ...current, ...change }));
                  setOwnerErrors({});
                }}
                onConsentChange={(checked) => {
                  setConsent(checked);
                  if (checked) setConsentError(false);
                }}
                onEdit={(index) => goTo(index)}
              />
            ) : null}
          </div>

          {/* Action bar: sticks above the phone tab bar, sits inline on desktop. */}
          <div
            data-tour="reg-actions"
            className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 mt-8 md:bottom-4"
          >
            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface/90 p-2 pl-4 shadow-lg backdrop-blur-md">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {words.steps[stepKey]}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {words.stepOf(step + 1, STEPS.length)}
                </p>
              </div>
              {step > 0 ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => goTo(step - 1)}
                  aria-label={words.back}
                >
                  <ArrowLeft />
                </Button>
              ) : null}
              <Button type="submit" loading={submitting}>
                {isLast ? words.submit : words.next}
                {isLast ? <Send data-icon="end" /> : <ArrowRight data-icon="end" />}
              </Button>
            </div>
          </div>
        </form>

        <aside className="max-lg:hidden">
          <div className="sticky top-24 flex flex-col gap-6">
            <div data-tour="reg-preview">
              <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {words.previewTitle}
              </p>
              <ListingPreview draft={draft} t={t} />
            </div>
            <div data-tour="reg-score" className="rounded-xl border border-border bg-surface p-5">
              <Completeness draft={draft} t={t} />
            </div>
            <DraftStatus restored={restored} onStartOver={startOver} t={t} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function DraftStatus({
  restored,
  onStartOver,
  t,
  className,
}: {
  restored: boolean | null;
  onStartOver: () => void;
  t: ReturnType<typeof useT>;
  className?: string;
}): JSX.Element {
  return (
    <div
      data-tour="reg-draft"
      className={cn("flex items-center justify-between gap-3 text-xs", className)}
    >
      <p className="flex items-center gap-1.5 text-muted-foreground">
        <CloudCheck className="size-4 shrink-0 text-success-foreground" />
        {restored ? t.register.draftRestored : t.register.draftSaved}
      </p>
      <button
        type="button"
        onClick={onStartOver}
        className="flex shrink-0 items-center gap-1 rounded-sm font-medium text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring is-hover:text-foreground"
      >
        <RotateCcw className="size-3.5" />
        {t.register.startOver}
      </button>
    </div>
  );
}

function WizardSkeleton({ label }: { label: string }): JSX.Element {
  return (
    <div aria-busy="true">
      <span className="sr-only" role="status">
        {label}
      </span>
      <Skeleton className="h-8 rounded-full" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-7 w-2/3 rounded-md" />
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3, 4, 5].map((key) => (
              <Skeleton key={key} className="h-20 rounded-lg" />
            ))}
          </div>
        </div>
        <Skeleton className="h-80 rounded-xl max-lg:hidden" />
      </div>
    </div>
  );
}
