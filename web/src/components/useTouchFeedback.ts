import { useEffect } from "react";

const controls = "button, summary, a[href], .choice-item, .calendar-day";

/** Retained native controls only: owned React Aria buttons use data-pressed.
 * Immediate touch feedback without taking ownership of clicks or scrolling. */
export function useTouchFeedback() {
  useEffect(() => {
    let press: {
      element: HTMLElement;
      pointerId: number;
      x: number;
      y: number;
    } | null = null;

    const clear = () => {
      press?.element.removeAttribute("data-touch-pressed");
      press = null;
    };
    const start = (event: PointerEvent) => {
      clear();
      if (event.pointerType !== "touch" || !event.isPrimary) return;
      const element =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>(controls)
          : null;
      if (
        !element ||
        element.matches(
          "[data-slot=button], [data-slot=collapsible-trigger]",
        ) ||
        element.matches(":disabled, [data-disabled], [aria-disabled='true']")
      )
        return;
      press = {
        element,
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      };
      element.setAttribute("data-touch-pressed", "");
    };
    const move = (event: PointerEvent) => {
      if (!press || event.pointerId !== press.pointerId) return;
      const box = press.element.getBoundingClientRect();
      if (
        Math.hypot(event.clientX - press.x, event.clientY - press.y) > 10 ||
        event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom
      )
        clear();
    };
    const end = (event: PointerEvent) => {
      if (event.pointerId === press?.pointerId) clear();
    };
    const options = { capture: true, passive: true };
    document.addEventListener("pointerdown", start, options);
    document.addEventListener("pointermove", move, options);
    document.addEventListener("pointerup", end, options);
    document.addEventListener("pointercancel", end, options);
    document.addEventListener("scroll", clear, options);
    document.addEventListener("contextmenu", clear, options);
    document.addEventListener("visibilitychange", clear, options);
    window.addEventListener("blur", clear);
    window.addEventListener("pagehide", clear);
    return () => {
      clear();
      document.removeEventListener("pointerdown", start, options);
      document.removeEventListener("pointermove", move, options);
      document.removeEventListener("pointerup", end, options);
      document.removeEventListener("pointercancel", end, options);
      document.removeEventListener("scroll", clear, options);
      document.removeEventListener("contextmenu", clear, options);
      document.removeEventListener("visibilitychange", clear, options);
      window.removeEventListener("blur", clear);
      window.removeEventListener("pagehide", clear);
    };
  }, []);
}
