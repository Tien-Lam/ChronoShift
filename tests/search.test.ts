import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { ROBOTS, searchMetadata, SITEMAP } from "../scripts/search-metadata";
import { WEB_CSP } from "../scripts/csp";
import { initialShell } from "../scripts/initial-shell";

test("initial HTML explains the converter and contains valid head-only search metadata", async () => {
  const shell = await initialShell("/");
  const html = searchMetadata(
    (await Bun.file("web/index.html").text()).replace(
      "<!-- converter-shell -->",
      () => shell,
    ),
  );
  const head = html.match(/<head>([\s\S]*?)<\/head>/)![1];
  expect(head).not.toMatch(/<\/?(?:div|main|section|p)\b/);
  expect(html).not.toContain("<!-- converter-shell -->");
  expect(html).toContain('data-app-ready="false"');
  expect(html).toContain('aria-busy="true"');
  expect(html).toContain("Preparing converter…");
  expect(html).not.toContain("In UTC");
  expect(html).toContain("Enable JavaScript to use the converter.");
  expect(html).toContain("How to convert dates and times");
  expect(head).toContain('rel="canonical" href="https://timetolocal.com/"');
  const data = head.match(
    /<script type="application\/ld\+json">(.*?)<\/script>/,
  )![1];
  expect(JSON.parse(data)).toEqual({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Time to Local",
    url: "https://timetolocal.com/",
  });
  expect(WEB_CSP).toContain(
    `'sha256-${createHash("sha256").update(data).digest("base64")}'`,
  );
  expect(WEB_CSP).not.toContain("'unsafe-inline'");
});

test("discovery lists the canonical homepage without fragment or private query URLs", () => {
  expect(ROBOTS).toContain("User-agent: *\nAllow: /\n");
  expect(ROBOTS).toContain("Sitemap: https://timetolocal.com/sitemap.xml");
  expect(SITEMAP.match(/<loc>(.*?)<\/loc>/g)).toEqual([
    "<loc>https://timetolocal.com/</loc>",
  ]);
  expect(SITEMAP).toContain(
    'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
  );
});
