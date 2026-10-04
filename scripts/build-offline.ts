import { readdir } from "node:fs/promises";
import { join } from "node:path";
const base = process.env.BASE_PATH || "/";
if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(base))
  throw new Error("BASE_PATH must be / or a path such as /ChronoShift/");
// Pages cannot set custom response headers. Enforce the static policy in HTML.
// Inject at build time so the development server can still use Vite's HMR.
const csp =
  "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'";
const html = await Bun.file("dist/index.html").text();
await Bun.write(
  "dist/index.html",
  html.replace(
    "<head>",
    `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}">\n    <meta name="referrer" content="no-referrer">`,
  ),
);
async function files(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((e) =>
      e.isDirectory()
        ? files(join(dir, e.name))
        : Promise.resolve([join(dir, e.name)]),
    ),
  );
  return nested.flat();
}
await Bun.write(
  "dist/release.json",
  JSON.stringify(
    { sourceCommit: process.env.GITHUB_SHA || "local", base },
    null,
    2,
  ),
);
const assets = (await files("dist"))
  .filter((p) => !p.endsWith("/sw.js") && !p.endsWith("/sw-template.js"))
  .sort();
const manifest = {
  id: base,
  name: "ChronoShift",
  short_name: "ChronoShift",
  description: "Convert times privately, even offline.",
  start_url: base,
  scope: base,
  display: "standalone",
  background_color: "#090c16",
  theme_color: "#090c16",
  icons: [
    {
      src: `${base}icon.svg`,
      sizes: "any",
      type: "image/svg+xml",
      purpose: "any",
    },
    ...[192, 512].map((size) => ({
      src: `${base}icon-${size}.png`,
      sizes: `${size}x${size}`,
      type: "image/png",
      purpose: "any maskable",
    })),
  ],
  share_target: {
    action: `${base}share`,
    method: "POST",
    enctype: "multipart/form-data",
    params: { title: "title", text: "text", url: "url" },
  },
};
await Bun.write("dist/manifest.webmanifest", JSON.stringify(manifest, null, 2));
const hash = new Bun.CryptoHasher("sha256");
for (const p of assets) {
  hash.update(p);
  hash.update(await Bun.file(p).arrayBuffer());
}
hash.update(base);
const template = await Bun.file("web/sw-template.js").text();
hash.update(template);
const version = hash.digest("hex").slice(0, 16);
await Bun.write(
  "dist/sw.js",
  template
    .replace("__VERSION__", version)
    .replace("__BASE__", JSON.stringify(base))
    .replace(
      "__PRECACHE__",
      JSON.stringify(assets.map((p) => base + p.slice(5))),
    ),
);
await Bun.file("dist/sw-template.js")
  .delete()
  .catch(() => {});
console.log(
  `Offline version ${version}: ${assets.length} local assets, ${base}`,
);
