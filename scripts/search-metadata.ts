import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  SITE_DESCRIPTION,
  SITE_STRUCTURED_DATA,
  SITE_TITLE,
  SITE_URL,
} from "../web/src/site.ts";

export function searchMetadata(html: string) {
  const metadata = renderToStaticMarkup(
    createElement(
      Fragment,
      null,
      createElement("meta", { name: "description", content: SITE_DESCRIPTION }),
      createElement("link", { rel: "canonical", href: SITE_URL }),
      createElement("meta", { property: "og:type", content: "website" }),
      createElement("meta", {
        property: "og:site_name",
        content: "Time to Local",
      }),
      createElement("meta", { property: "og:title", content: SITE_TITLE }),
      createElement("meta", {
        property: "og:description",
        content: SITE_DESCRIPTION,
      }),
      createElement("meta", { property: "og:url", content: SITE_URL }),
    ),
  );
  return html.replace(
    "<!-- search-metadata -->",
    () =>
      `${metadata}<script type="application/ld+json">${SITE_STRUCTURED_DATA}</script>`,
  );
}

export const ROBOTS = `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`;
export const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}</loc></url>
</urlset>
`;
