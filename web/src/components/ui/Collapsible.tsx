// Derived from shadcn/ui's React Aria Collapsible. See docs/developer/ui-gallery.md.
import {
  Disclosure,
  DisclosurePanel,
  type DisclosureProps,
  type DisclosurePanelProps,
} from "react-aria-components/Disclosure";
import { Button, type ButtonProps } from "react-aria-components/Button";
import type { RefAttributes } from "react";

export function Collapsible(props: DisclosureProps) {
  return <Disclosure data-slot="collapsible" {...props} />;
}
export function CollapsibleTrigger(
  props: ButtonProps & RefAttributes<HTMLButtonElement>,
) {
  return <Button slot="trigger" data-slot="collapsible-trigger" {...props} />;
}
export function CollapsibleContent(
  props: DisclosurePanelProps & RefAttributes<HTMLDivElement>,
) {
  return <DisclosurePanel data-slot="collapsible-content" {...props} />;
}
