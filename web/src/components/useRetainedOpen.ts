import { useEffect, useState } from "react";

/** Retain intrinsic layout for an opacity exit; requested state owns interaction. */
export function useRetainedOpen(open: boolean, duration: number) {
  const [retained, setRetained] = useState(open);
  useEffect(() => {
    if (open) {
      setRetained(true);
      return;
    }
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => setRetained(false);
    if (media.matches) finish();
    const timer = setTimeout(finish, media.matches ? 0 : duration);
    const changed = () => {
      if (media.matches) finish();
    };
    media.addEventListener("change", changed);
    return () => {
      clearTimeout(timer);
      media.removeEventListener("change", changed);
    };
  }, [open, duration]);
  return open || retained;
}
