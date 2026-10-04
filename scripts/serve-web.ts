import { resolve, extname } from "node:path";
import { testReleases } from "./test-releases";
// Same-origin static preview. Test versions exist only when explicitly enabled.
const root = resolve("dist"),
  base = process.env.BASE_PATH || "/",
  testMode = process.env.CHRONOSHIFT_TEST_SERVER === "1";
const fixtures = testMode ? await testReleases(root) : undefined;
let publishedVersion: string | undefined;
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
    if (
      testMode &&
      url.pathname === `${base}__test-release` &&
      request.method === "POST"
    ) {
      const version = await request.text();
      if (!fixtures?.releases.has(version))
        return new Response("Unknown test release", { status: 400 });
      publishedVersion = version;
      return new Response(null, { status: 204 });
    }
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
    const version =
      publishedVersion ??
      (testMode
        ? request.headers
            .get("cookie")
            ?.match(/(?:^|; )test-version=([^;]+)/)?.[1]
        : undefined);
    const variant =
      fixtures?.immutable.get(relative) ??
      fixtures?.releases.get(version || "")?.get(relative);
    const file = Bun.file(path);
    if (variant === undefined && !(await file.exists()))
      return new Response("Not found", { status: 404 });
    if (version === "broken" && relative.endsWith(".css"))
      return new Response("Simulated partial update", { status: 503 });
    let body: BodyInit = variant ?? file;
    if (version && relative === "sw.js" && variant === undefined)
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
