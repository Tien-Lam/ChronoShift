import { createElement, StrictMode } from "react";
import { renderToString } from "react-dom/server";

// Browser-only imports are inert during build-time rendering. The browser
// bundle still gets its real emitted URL and CSS from Vite.
Bun.plugin({
  name: "initial-shell-imports",
  setup(build) {
    build.onLoad(
      { filter: /^date-control-url$/, namespace: "virtual" },
      () => ({
        exports: { dateControlUrl: "" },
        loader: "object",
      }),
    );
    build.onLoad({ filter: /\.css$/ }, () => ({ contents: "", loader: "js" }));
  },
});

export async function initialShell(base: string) {
  const { default: App } = await import("../web/src/App.tsx");
  return renderToString(
    createElement(
      StrictMode,
      null,
      createElement(App, { booting: true, base }),
    ),
  );
}
