import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { Slot } from "radix-ui";
import type { ComponentProps, JSX } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "relative isolate inline-flex shrink-0 items-center justify-center rounded-full font-medium whitespace-nowrap select-none",
    // Hover: a tinted layer fades in. Only opacity animates (cheap for the GPU).
    "after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:rounded-[inherit] after:opacity-0 after:transition-opacity after:duration-150 after:ease-soft is-hover:after:opacity-100",
    // Press: a 2% shrink feels physical without moving the layout.
    "transition-transform duration-150 ease-soft is-active:scale-98",
    // Keyboard focus: clear ring with a background-colored gap.
    "outline-none is-focus:ring-3 is-focus:ring-ring is-focus:ring-offset-2 is-focus:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-sm after:bg-primary-hover",
        secondary: "bg-surface-muted text-foreground after:bg-border",
        outline: "border border-border bg-surface text-foreground shadow-sm after:bg-surface-muted",
        ghost: "text-foreground after:bg-surface-muted",
        destructive: "bg-danger text-surface shadow-sm after:bg-foreground/10",
        /** On a primary-colored band: the colors swap. */
        inverse: "bg-primary-foreground text-primary after:bg-primary-soft",
      },
      size: {
        // Icons sit 4px closer to the edge than text does: optically the padding then looks equal.
        sm: "h-9 gap-1.5 px-3 text-sm has-data-[icon=end]:pr-2 has-data-[icon=start]:pl-2 [&_svg]:size-4",
        md: "h-11 gap-2 px-5 text-sm has-data-[icon=end]:pr-4 has-data-[icon=start]:pl-4 [&_svg]:size-4",
        lg: "h-13 gap-2 px-6 text-base has-data-[icon=end]:pr-5 has-data-[icon=start]:pl-5 [&_svg]:size-5",
        "icon-sm": "size-9 [&_svg]:size-4",
        icon: "size-11 [&_svg]:size-5",
        "icon-lg": "size-13 [&_svg]:size-6",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element (e.g. a Next.js <Link>) with button styles. */
    asChild?: boolean;
    /** Shows a spinner, keeps the button's width and blocks clicks. */
    loading?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  type = "button",
  children,
  ...props
}: ButtonProps): JSX.Element {
  const classes = cn(buttonVariants({ variant, size }), className);

  if (asChild) {
    return (
      <Slot.Root data-slot="button" className={classes} {...props}>
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      data-slot="button"
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
      {...props}
    >
      {loading ? <LoaderCircle className="absolute animate-spin" /> : null}
      {/* Content stays in the layout (just transparent) so the width never jumps. */}
      <span className={cn("inline-flex items-center gap-[inherit]", loading && "opacity-0")}>
        {children}
      </span>
    </button>
  );
}

export { Button, buttonVariants, type ButtonProps };
