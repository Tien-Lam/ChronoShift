import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App";

export function mount(root: HTMLElement) {
  const booting = root.hasAttribute("data-initial-shell");
  const app = (
    <StrictMode>
      <App booting={booting} />
    </StrictMode>
  );
  if (booting) hydrateRoot(root, app);
  else createRoot(root).render(app);
}
