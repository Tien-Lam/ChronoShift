import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App";
import "./style.css";

const root = document.getElementById("root")!;
const booting = root.hasAttribute("data-initial-shell");
const app = (
  <StrictMode>
    <App booting={booting} />
  </StrictMode>
);
if (booting) hydrateRoot(root, app);
else createRoot(root).render(app);
