import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { inlineStyles } from "../scripts/inline-styles";
import { webCsp } from "../scripts/csp";

test("root and subpath CSS keep exact bytes and a bounded policy", async () => {
  const root = await mkdtemp(join(tmpdir(), "time-to-local-styles-"));
  try {
    const css = '.message::before{content:"$&"}body{color:green}';
    await Bun.write(join(root, "assets/app.css"), css);
    for (const base of ["/", "/ChronoShift/"]) {
      const source = `<head><link rel="stylesheet" crossorigin href="${base}assets/app.css"></head>`;
      const result = await inlineStyles(source, base, root);
      expect(result.html).toBe(
        `<head><style data-app-styles>${css}</style></head>`,
      );
      expect(result.styles).toEqual([css]);
      const hash = createHash("sha256").update(css).digest("base64");
      expect(webCsp(result.styles)).toContain(`'sha256-${hash}'`);
      expect(webCsp(result.styles)).not.toContain("unsafe-inline");
      expect(await Bun.file(join(root, "assets/app.css")).text()).toBe(css);
    }
    await expect(
      inlineStyles(
        '<link rel="stylesheet" href="https://example.com/a.css">',
        "/",
        root,
      ),
    ).rejects.toThrow();
    await expect(
      inlineStyles(
        '<link rel="stylesheet" href="/assets/../../a.css">',
        "/",
        root,
      ),
    ).rejects.toThrow();
    await Bun.write(
      join(root, "assets/app.css"),
      "</style><script>bad</script>",
    );
    await expect(
      inlineStyles('<link rel="stylesheet" href="/assets/app.css">', "/", root),
    ).rejects.toThrow();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
