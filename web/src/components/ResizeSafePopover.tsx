import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  Popover,
  PopoverContext,
  type PopoverProps,
} from "react-aria-components/Popover";
import { useSlottedContext } from "react-aria-components/slots";

/** Preserve an open menu's horizontal anchor across mobile layout resizing.
 * React Aria deliberately freezes positioning when visualViewport.scale changes.
 * A stale horizontal position can itself cause that scale change by overflowing
 * the new layout viewport. Only layout resizing enables this bounded repair;
 * normal opening, scrolling, vertical placement, and pinch zoom remain native.
 */
export function ResizeSafePopover(props: PopoverProps) {
  const context = useSlottedContext(PopoverContext, props.slot);
  const triggerRef = props.triggerRef ?? context?.triggerRef;
  const popover = useRef<HTMLElement>(null);
  const [horizontal, setHorizontal] = useState<CSSProperties>();
  const open = !props.inert;

  useEffect(() => {
    if (!open) {
      setHorizontal(undefined);
      return;
    }
    let layoutWidth = document.documentElement.clientWidth;
    let resized = false;
    let frame = 0;
    const repair = () => {
      const width = document.documentElement.clientWidth;
      if (width !== layoutWidth) resized = true;
      layoutWidth = width;
      const anchor = triggerRef?.current;
      const surface = popover.current;
      if (!resized || !anchor || !surface) return;
      const bounds = anchor.getBoundingClientRect();
      const surfaceWidth = surface.getBoundingClientRect().width;
      const padding = props.containerPadding ?? 12;
      const left =
        window.scrollX +
        Math.max(
          padding,
          Math.min(bounds.left, width - surfaceWidth - padding),
        );
      setHorizontal((previous) =>
        previous?.left === left ? previous : { left, right: "auto" },
      );
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(repair);
    };
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    if (triggerRef?.current) observer.observe(triggerRef.current);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
    };
  }, [open, triggerRef, props.containerPadding]);

  return (
    <Popover
      {...props}
      ref={popover}
      style={(state) => ({
        ...(typeof props.style === "function"
          ? props.style(state)
          : props.style),
        ...horizontal,
      })}
    />
  );
}
