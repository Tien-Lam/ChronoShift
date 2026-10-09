import { resolve } from "node:path";

/** Inline only Vite's initial local CSS; dynamic imports keep their own CSS. */
export async function inlineStyles(html: string, base: string, root = "dist") {
  const styles: string[] = [];
  const links = [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*>/g)];
  for (const [link] of links) {
    const href = link.match(/\bhref="([^"]+)"/)?.[1];
    if (!href?.startsWith(`${base}assets/`) || !href.endsWith(".css"))
      throw new Error("Initial stylesheet must be a local build asset");
    const relative = href.slice(base.length);
    const path = resolve(root, relative);
    if (!path.startsWith(resolve(root) + "/"))
      throw new Error("Stylesheet escaped the build directory");
    const css = await Bun.file(path).text();
    if (/<\/style/i.test(css)) throw new Error("Invalid inline stylesheet");
    styles.push(css);
    html = html.replace(link, () => `<style data-app-styles>${css}</style>`);
  }
  return { html, styles };
}
