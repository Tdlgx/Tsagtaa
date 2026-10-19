import { CircleAlert, CircleCheck, CircleX, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { JSX } from "react";

import type { CheckLevel, ReviewCheck, ReviewReport } from "@/features/admin/review-checks";
import { formatPhone } from "@/features/booking/booking";
import { StatusBadge } from "@/features/manage/components/status-badge";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatMNT } from "@/lib/currency";
import { cn } from "@/lib/utils";

const LEVEL: Record<CheckLevel, { icon: LucideIcon; tone: string }> = {
  pass: { icon: CircleCheck, tone: "text-success-foreground" },
  warn: { icon: CircleAlert, tone: "text-sun-strong" },
  fail: { icon: CircleX, tone: "text-danger-foreground" },
};

const VERDICT_TONE = {
  ready: "bg-success-soft text-success-foreground",
  look: "bg-sun-soft text-sun-strong",
  fix: "bg-danger-soft text-danger-foreground",
} as const;

/** The score as a ring with the verdict next to it. */
export function ScoreBadge({
  report,
  t,
  size = "md",
}: {
  report: ReviewReport;
  t: Dictionary;
  size?: "md" | "lg";
}): JSX.Element {
  const colour =
    report.verdict === "ready"
      ? "var(--success)"
      : report.verdict === "look"
        ? "var(--sun)"
        : "var(--danger)";
  const counts = {
    warn: report.checks.filter((check) => check.level === "warn").length,
    fail: report.checks.filter((check) => check.level === "fail").length,
  };
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-full",
          size === "lg" ? "size-16" : "size-12",
        )}
        style={{
          background: `conic-gradient(${colour} ${report.score * 3.6}deg, var(--surface-muted) 0deg)`,
        }}
      >
        <span
          className={cn(
            "flex items-center justify-center rounded-full bg-surface font-heading font-medium text-foreground tabular-nums",
            size === "lg" ? "size-13 text-lg" : "size-9.5 text-sm",
          )}
        >
          {report.score}
        </span>
      </span>
      <span className="flex flex-col items-start gap-1">
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
            VERDICT_TONE[report.verdict],
          )}
        >
          {t.admin.review.verdict[report.verdict]}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {t.admin.review.counts(counts.fail, counts.warn)}
        </span>
      </span>
    </div>
  );
}

/** Each check as a line: icon, what was checked, what was found. Problems first. */
export function CheckList({ report, t }: { report: ReviewReport; t: Dictionary }): JSX.Element {
  const order: Record<CheckLevel, number> = { fail: 0, warn: 1, pass: 2 };
  const checks = [...report.checks].sort((a, b) => order[a.level] - order[b.level]);
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
      {checks.map((check) => {
        const { icon: Icon, tone } = LEVEL[check.level];
        return (
          <li key={check.id} className="flex items-start gap-3 px-4 py-3">
            <Icon className={cn("mt-0.5 size-5 shrink-0", tone)} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                {t.admin.review.checks[check.id]}
              </p>
              <p className="text-sm text-muted-foreground">{describe(check, t)}</p>
              {check.id === "duplicates" && check.matches.length > 0 ? (
                <ul className="mt-2 flex flex-col gap-1.5">
                  {check.matches.map((match) => (
                    <li
                      key={match.slug}
                      className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"
                    >
                      <Link
                        href={`/admin/places/${match.slug}`}
                        className="font-medium text-foreground underline underline-offset-4 outline-none focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring"
                      >
                        {match.name}
                      </Link>
                      <StatusBadge status={match.status} t={t} />
                      <span className="text-muted-foreground tabular-nums">
                        {[
                          t.admin.review.similar(Math.round(match.similarity * 100)),
                          match.samePhone ? t.admin.review.samePhone : null,
                          match.sameOwner ? t.admin.review.sameOwner : null,
                          match.sameRegister ? t.admin.review.sameRegister : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function describe(check: ReviewCheck, t: Dictionary): string {
  const words = t.admin.review.found;
  switch (check.id) {
    case "owner":
      return check.owner
        ? words.owner(check.owner.name, formatPhone(check.owner.phone))
        : words.noOwner;
    case "register":
      return check.kind ? words.register[check.kind] : words.register.none;
    case "duplicates":
      return check.matches.length === 0
        ? words.noDuplicates
        : check.level === "fail"
          ? words.duplicateStrong
          : words.duplicateWeak(check.matches.length);
    case "name":
      return check.issue ? words.name[check.issue] : words.name.ok;
    case "address":
      return check.level === "pass" ? words.addressOk : words.addressVague;
    case "hours":
      return check.openDays === 0
        ? words.noHours
        : check.odd.length > 0
          ? words.oddHours(check.odd.map((day) => t.register.weekdays[day - 1]).join(", "))
          : words.hoursOk(check.openDays);
    case "services":
      return check.count === 0
        ? words.noServices
        : check.free.length > 0
          ? words.freeServices(check.free.join(", "))
          : words.servicesOk(check.count);
    case "prices":
      return check.median === null
        ? words.pricesUnknown
        : check.outliers.length > 0
          ? words.priceOutliers(
              check.outliers.map((item) => `${item.name} ${formatMNT(item.price)}`).join(", "),
              formatMNT(check.median),
            )
          : words.pricesOk(formatMNT(check.median));
    case "fit":
      return check.tooLong.length > 0 ? words.tooLong(check.tooLong.join(", ")) : words.fitOk;
    case "staff":
      return check.count > 0 ? words.staffOk(check.count) : words.noStaff;
    case "description":
      return check.level === "pass" ? words.descriptionOk : words.descriptionShort;
    case "email":
      return check.level === "pass" ? words.emailOk(check.email) : words.emailBad(check.email);
    case "waiting":
      return words.waiting(check.hours);
    case "location":
      return check.set ? words.locationOk : words.noLocation;
    case "images":
      return check.logo || check.photos > 0
        ? words.imagesOk(check.photos, check.logo)
        : words.noImages;
  }
}
