import { defineConfig } from "vite";

export default defineConfig({
  root: "web",
  base: process.env.BASE_PATH || "/",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    target: "es2022",
    sourcemap: false,
  },
  worker: { format: "es" },
  preview: { port: 4173, strictPort: true },
});
