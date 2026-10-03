import { resolve, extname } from "node:path";
// Same-origin static preview. Test versions exist only when explicitly enabled.
const root = resolve("dist"),
  base = process.env.BASE_PATH || "/",
  testMode = process.env.CHRONOSHIFT_TEST_SERVER === "1";
const mime: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
};
const server = Bun.serve({
  hostname: "127.0.0.1",
  port: process.env.PORT || 4173,
  async fetch(request) {
    const url = new URL(request.url);
    if (!["GET", "HEAD"].includes(request.method))
      return new Response("Paste shared text into ChronoShift.", {
        status: 405,
      });
    if (!url.pathname.startsWith(base))
      return new Response("Not found", { status: 404 });
    const relative = url.pathname.slice(base.length) || "index.html";
    const path = resolve(root, relative);
    if (!path.startsWith(root + "/"))
      return new Response("Not found", { status: 404 });
    const file = Bun.file(path);
    if (!(await file.exists()))
      return new Response("Not found", { status: 404 });
    const version = testMode
      ? request.headers
          .get("cookie")
          ?.match(/(?:^|; )test-version=([^;]+)/)?.[1]
      : undefined;
    if (version === "broken" && relative.endsWith(".css"))
      return new Response("Simulated partial update", { status: 503 });
    let body: BodyInit = file;
    if (version && relative === "sw.js")
      body = (await file.text()).replace(
        /const VERSION = '[^']+';/,
        `const VERSION = 'test-${version}';`,
      );
    return new Response(request.method === "HEAD" ? null : body, {
      headers: {
        "Content-Type": mime[extname(path)] || "application/octet-stream",
        "Cache-Control": relative.startsWith("assets/")
          ? "public, max-age=31536000, immutable"
          : "no-cache",
        "Content-Security-Policy":
          "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; worker-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      },
    });
  },
});
console.log(`ChronoShift preview: ${server.url}${base.slice(1)}`);
