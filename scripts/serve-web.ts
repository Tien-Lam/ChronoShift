import { resolve, extname } from "node:path";
import { testReleases } from "./test-releases";
// Same-origin static preview. Test versions exist only when explicitly enabled.
const root = resolve("dist"),
  base = process.env.BASE_PATH || "/",
  testMode = process.env.CHRONOSHIFT_TEST_SERVER === "1";
const fixtures = testMode ? await testReleases(root) : undefined;
// Match the generated production policy, including the exact initial CSS hash.
const policy = (await Bun.file(resolve(root, "_headers")).text()).match(
  /^  Content-Security-Policy: (.+)$/m,
)?.[1];
if (!policy)
  throw new Error("Build headers contain no content security policy");
let publishedVersion: string | undefined;
let interruptedRequests = 0;
const mime: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
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
      if (version === "current") {
        publishedVersion = undefined;
        return new Response(null, { status: 204 });
      }
      if (
        !fixtures?.releases.has(version) &&
        version !== "broken" &&
        version !== "first-interrupted" &&
        ![
          "offline-stale",
          "offline-corrupt",
          "offline-delayed",
          "offline-interrupted",
          "offline-filtered",
          "first-no-claim",
          "conversion-unavailable",
          "second-retired",
          "second-stalled",
        ].includes(version)
      )
        return new Response("Unknown test release", { status: 400 });
      publishedVersion = version;
      return new Response(null, { status: 204 });
    }
    if (!["GET", "HEAD"].includes(request.method))
      return new Response("Paste shared text into Time to Local.", {
        status: 405,
      });
    if (!url.pathname.startsWith(base))
      return new Response("Not found", { status: 404 });
    const relative = url.pathname.slice(base.length) || "index.html";
    const path = resolve(root, relative);
    if (!path.startsWith(root + "/"))
      return new Response("Not found", { status: 404 });
    const version = publishedVersion;
    const releaseVersion =
      version === "first-no-claim"
        ? "first"
        : version?.startsWith("second-")
          ? "second"
          : version;
    // Pages replaces the deployment tree: previously published hashed assets
    // need not remain fetchable even though old controlling caches retain them.
    if (
      version === "second-retired" &&
      relative.startsWith("assets/test-") &&
      !relative.startsWith("assets/test-second-")
    )
      return new Response("Retired asset", { status: 404 });
    if (
      version === "conversion-unavailable" &&
      /^assets\/convert-[^/]+\.js$/.test(relative)
    )
      return new Response("Simulated conversion loading failure", {
        status: 503,
      });
    const variant =
      fixtures?.immutable.get(relative) ??
      fixtures?.releases
        .get(version === "first-interrupted" ? "first" : releaseVersion || "")
        ?.get(relative);
    const file = Bun.file(path);
    if (variant === undefined && !(await file.exists()))
      return new Response("Not found", { status: 404 });
    if (
      (version === "broken" || version === "first-interrupted") &&
      relative.endsWith(".css")
    )
      return new Response("Simulated partial update", { status: 503 });
    if (version === "offline-delayed" && relative === "icon.svg")
      await Bun.sleep(600);
    if (version === "second-stalled" && relative === "release.json")
      await Bun.sleep(1000);
    if (relative === "release.json") {
      if (
        version === "offline-corrupt" ||
        (version === "offline-stale" &&
          !url.searchParams.has("chronoshift-release"))
      )
        return new Response('{"sourceCommit":"stale"}', {
          headers: { "Content-Type": "application/json" },
        });
      if (version === "offline-interrupted") {
        if (++interruptedRequests >= 2) publishedVersion = undefined;
        return new Response("Interrupted first install", { status: 503 });
      }
    }
    let body: BodyInit = variant ?? file;
    if (version === "first-no-claim" && relative === "sw.js")
      body = (variant ?? (await file.text())).replace(
        "event.data.claimUncontrolled===true",
        "false",
      );
    // A network content filter can change HTML while every runtime file stays
    // intact. Exercise the real worker fetch, not just a DOM-only mutation.
    if (version === "offline-filtered" && relative === "index.html")
      body = (variant ?? (await file.text())).replace(
        "<head>",
        "<head><!-- content-filter-injected -->",
      );
    if (
      version &&
      !version.startsWith("offline-") &&
      relative === "sw.js" &&
      variant === undefined
    )
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
        "Content-Security-Policy": policy,
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      },
    });
  },
});
console.log(`Time to Local preview: ${server.url}${base.slice(1)}`);
