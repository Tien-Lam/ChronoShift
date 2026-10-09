import { mountUrl } from "virtual:mount-url";
import "./style.css";
import "./components/DateChoice.css";

const root = document.getElementById("root")!;
function start() {
  let expired = false;
  const fail = () => {
    if (expired) return;
    expired = true;
    const notice = document.createElement("p");
    notice.className = "startup-notice";
    notice.setAttribute("role", "alert");
    notice.textContent = "Unable to start the converter. ";
    const retry = document.createElement("button");
    retry.type = "button";
    retry.textContent = "Retry";
    // A fresh document clears failed module dependencies as well as the entry.
    // The initial interface is inert, so no editable draft is lost here.
    retry.addEventListener("click", () => location.reload());
    notice.append(retry);
    root.before(notice);
  };
  const timeout = setTimeout(fail, 12_000);
  void import(/* @vite-ignore */ new URL(mountUrl, location.href).href).then(
    (module: typeof import("./mount")) => {
      clearTimeout(timeout);
      if (!expired) module.mount(root);
    },
    () => {
      clearTimeout(timeout);
      fail();
    },
  );
}

// Give the build-time interface one paint opportunity before framework startup.
// Hidden documents must also start: their animation frames can be suspended.
let started = false;
let frame = 0;
function begin() {
  if (started) return;
  started = true;
  cancelAnimationFrame(frame);
  document.removeEventListener("visibilitychange", startIfHidden);
  start();
}
function startIfHidden() {
  if (document.visibilityState === "hidden") begin();
}
document.addEventListener("visibilitychange", startIfHidden);
if (document.visibilityState === "hidden") begin();
else
  frame = requestAnimationFrame(() => (frame = requestAnimationFrame(begin)));
