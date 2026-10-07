// Derived from shadcn/ui's React Aria Button. See docs/developer/ui-gallery.md.
import type { RefAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Button, type ButtonProps } from "react-aria-components/Button";

export const actionVariants = cva("action-button", {
  variants: {
    variant: {
      quiet: "text-button",
      primary: "copy-button",
      outline: "action-outline",
      iconAction: "text-button action-icon",
    },
  },
  defaultVariants: { variant: "quiet" },
});

export type ActionButtonProps = Omit<ButtonProps, "className" | "onClick"> &
  RefAttributes<HTMLButtonElement> &
  VariantProps<typeof actionVariants> & { className?: string };

/** Operations stay with the caller. React Aria owns one onPress activation. */
export function ActionButton({
  className,
  variant = "quiet",
  ...props
}: ActionButtonProps) {
  return (
    <Button
      data-slot="button"
      data-variant={variant}
      className={actionVariants({ variant, className })}
      {...props}
    />
  );
}
