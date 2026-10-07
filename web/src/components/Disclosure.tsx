import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "./ui/Collapsible";
import { useRef, type ReactNode } from "react";
import { ControlIcon } from "./ui/ControlIcon";

/** Commit intrinsic close geometry before another control can be pressed. */
export function Disclosure({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  const content = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <Collapsible
      className="options"
      isExpanded={open}
      onExpandedChange={(next) => {
        // Programmatic/virtual activation need not move focus before collapse.
        // Preserve the previous native disclosure's focused-child correction.
        if (!next && content.current?.contains(document.activeElement))
          trigger.current?.focus();
        onOpenChange(next);
      }}
    >
      <CollapsibleTrigger
        ref={trigger}
        className="options-trigger"
        type="button"
        aria-label="Adjust interpretation & format (More options)"
        aria-expanded={open}
        aria-controls="interpretation-options"
      >
        <ControlIcon name="chevron" className="disclosure-chevron" />
        More options
      </CollapsibleTrigger>
      <CollapsibleContent
        ref={content}
        id="interpretation-options"
        className="option-fields"
        hidden={!open}
        inert={!open}
        aria-hidden={!open}
      >
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
