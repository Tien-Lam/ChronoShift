import { readdir } from "node:fs/promises";
import { join } from "node:path";

// Preview-only release fixtures. Distinct immutable assets and incompatible
// worker protocols make mixed releases fail instead of hiding cache mistakes.
export async function testReleases(root: string) {
  const assets = (await readdir(join(root, "assets"))).filter((name) =>
    /\.(js|css)$/.test(name),
  );
  const originals = new Map(
    await Promise.all(
      [
        ...assets.map((name) => `assets/${name}`),
        "index.html",
        "sw.js",
        "release.json",
      ].map(
        async (path) =>
          [path, await Bun.file(join(root, path)).text()] as const,
      ),
    ),
  );
  const releases = new Map<string, Map<string, string>>();
  const immutable = new Map<string, string>();
  for (const version of ["first", "second", "third"]) {
    const names = new Map(
      assets.map((name) => [name, `test-${version}-${name}`]),
    );
    const release = new Map<string, string>();
    for (const [path, original] of originals) {
      let content = original;
      for (const [oldName, newName] of names)
        content = content.replaceAll(oldName, newName);
      if (path === "sw.js")
        content = content.replace(
          /const VERSION = '[^']+';/,
          `const VERSION = 'test-${version}';`,
        );
      else if (path === "release.json")
        content = JSON.stringify({
          ...JSON.parse(content),
          sourceCommit: `test-${version}`,
        });
      else if (path.startsWith("assets/worker-") && path.endsWith(".js"))
        content += `\nconst handler = self.onmessage; self.onmessage = event => { if (event.data.testProtocol !== '${version}') throw new Error('Mixed worker release'); handler(event); };`;
      else if (path.startsWith("assets/") && path.endsWith(".js"))
        content = `globalThis.Worker = class extends Worker { postMessage(message, ...args) { super.postMessage({...message, testProtocol: '${version}'}, ...args); } };\n${content}`;
      const target = path.startsWith("assets/")
        ? `assets/${names.get(path.slice(7))}`
        : path;
      release.set(target, content);
      if (target.startsWith("assets/")) immutable.set(target, content);
    }
    const base = JSON.parse(release.get("release.json")!).base as string;
    const sw = release.get("sw.js")!;
    const integrity = JSON.parse(
      sw.match(/const INTEGRITY = (.+);/)![1],
    ) as Record<string, string>;
    for (const path of Object.keys(integrity)) {
      const relative = path.slice(base.length);
      const bytes = release.has(relative)
        ? new TextEncoder().encode(release.get(relative)!)
        : await Bun.file(join(root, relative)).arrayBuffer();
      integrity[path] = new Bun.CryptoHasher("sha256")
        .update(bytes)
        .digest("hex");
    }
    release.set(
      "sw.js",
      sw.replace(
        /const INTEGRITY = .+;/,
        `const INTEGRITY = ${JSON.stringify(integrity)};`,
      ),
    );
    releases.set(version, release);
  }
  return { releases, immutable };
}
