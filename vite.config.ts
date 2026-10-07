import { defineConfig } from "vite";

export default defineConfig({
  root: "web",
  plugins: [
    {
      name: "local-development-gallery",
      apply: "serve",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.split("?")[0] !== "/__gallery/") return next();
          // No production entry, public asset or app import points at this route.
          void server
            .transformIndexHtml(
              "/__gallery/",
              '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Local UI gallery</title></head><body><div id="root"></div><script type="module" src="/src/dev/gallery.tsx"></script></body></html>',
            )
            .then((html) => {
              res.setHeader("Content-Type", "text/html; charset=utf-8");
              res.end(html);
            })
            .catch(next);
        });
      },
    },
  ],
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
