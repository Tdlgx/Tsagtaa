import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, JSX } from "react";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  [
    "group/card relative isolate flex flex-col gap-(--card-spacing) rounded-lg border border-border bg-surface py-(--card-spacing) text-foreground",
    "[--card-spacing:--spacing(6)] data-[size=sm]:[--card-spacing:--spacing(4)]",
  ],
  {
    variants: {
      variant: {
        /** Ихэнх карт: нарийн шугам + арай ядан мэдрэгдэх сүүдэр. */
        default: "shadow-sm",
        /** Өөр гадаргуу дотор байрласан: огт сүүдэргүй. */
        flat: "",
        /** Хөвөгч самбарууд (popover, sheet). */
        elevated: "shadow-md",
        /** Дарагддаг карт 2px дээш өргөгдөнө; гүнзгий сүүдэр аажуухан гарна (зөвхөн тунгалаг байдал). */
        interactive: [
          "shadow-sm transition-transform duration-250 ease-soft is-hover:-translate-y-0.5",
          "after:pointer-events-none after:absolute after:-inset-px after:-z-10 after:rounded-[inherit] after:opacity-0 after:shadow-md after:transition-opacity after:duration-250 after:ease-soft is-hover:after:opacity-100",
          "has-focus-visible:ring-3 has-focus-visible:ring-ring",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type CardProps = ComponentProps<"div"> &
  VariantProps<typeof cardVariants> & {
    size?: "default" | "sm";
  };

function Card({ className, variant, size = "default", ...props }: CardProps): JSX.Element {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "grid auto-rows-min items-start gap-1 px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto]",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: ComponentProps<"h3">): JSX.Element {
  return (
    <h3
      data-slot="card-title"
      className={cn("text-base font-semibold text-foreground", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: ComponentProps<"p">): JSX.Element {
  return (
    <p
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      data-slot="card-content"
      className={cn("flex flex-col gap-3 px-(--card-spacing)", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center gap-3 px-(--card-spacing)", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cardVariants,
  type CardProps,
};
