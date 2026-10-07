// Derived from shadcn/ui's React Aria Input. See docs/developer/ui-gallery.md.
import type { ComponentProps } from "react";
import { Input as InputPrimitive } from "react-aria-components/Input";
import { composeRenderProps } from "react-aria-components/composeRenderProps";

export function Input({
  className,
  type,
  ...props
}: ComponentProps<typeof InputPrimitive>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={composeRenderProps(className, (name) =>
        ["ui-input", name].filter(Boolean).join(" "),
      )}
      {...props}
    />
  );
}
