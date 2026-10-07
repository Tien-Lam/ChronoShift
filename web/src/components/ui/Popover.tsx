// Derived from shadcn/ui's React Aria Popover. See docs/developer/ui-gallery.md.
import {
  Popover as PopoverPrimitive,
  type PopoverProps,
} from "react-aria-components/Popover";
import type { RefAttributes } from "react";
import { composeRenderProps } from "react-aria-components/composeRenderProps";

/** Content-sized shell; position and lifecycle remain with the owning control. */
export function Popover({
  className,
  placement = "bottom",
  offset = 8,
  crossOffset = 0,
  ...props
}: PopoverProps & RefAttributes<HTMLElement>) {
  return (
    <PopoverPrimitive
      data-slot="popover-content"
      placement={placement}
      offset={offset}
      crossOffset={crossOffset}
      className={composeRenderProps(className, (name) =>
        ["ui-popover", name].filter(Boolean).join(" "),
      )}
      {...props}
    />
  );
}
