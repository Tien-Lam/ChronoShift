import { useRef, type ReactNode } from "react";

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
    <div className="options" data-expanded={open}>
      <button
        ref={trigger}
        className="options-trigger"
        type="button"
        aria-label="Adjust interpretation & format (More options)"
        aria-expanded={open}
        aria-controls="interpretation-options"
        onClick={() => {
          if (open && content.current?.contains(document.activeElement))
            trigger.current?.focus();
          onOpenChange(!open);
        }}
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
        hidden={!open}
        inert={!open}
        aria-hidden={!open}
      >
        {children}
      </div>
    </div>
  );
}
