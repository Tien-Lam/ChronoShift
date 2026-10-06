import { useEffect, useRef, type ReactNode } from "react";

import { useRetainedOpen } from "./useRetainedOpen";

/** Keep geometry intrinsic while fading. Closing content becomes inert at once. */
export function Disclosure({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  const retained = useRetainedOpen(open, 220);
  const content = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open && content.current?.contains(document.activeElement))
      trigger.current?.focus();
  }, [open]);
  return (
    <div className="options" data-expanded={open}>
      <button
        ref={trigger}
        className="options-trigger"
        type="button"
        aria-label="Adjust interpretation & format (More options)"
        aria-expanded={open}
        aria-controls="interpretation-options"
        onClick={() => onOpenChange(!open)}
      >
        <span className="disclosure-chevron" aria-hidden="true">
          ›
        </span>
        Adjust interpretation &amp; format
      </button>
      <div
        ref={content}
        id="interpretation-options"
        className="option-fields"
        hidden={!open && !retained}
        inert={!open}
        aria-hidden={!open}
      >
        {children}
      </div>
    </div>
  );
}
