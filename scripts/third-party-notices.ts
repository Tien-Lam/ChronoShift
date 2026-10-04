import { join } from "node:path";
const app = await Bun.file("package.json").json();
const queue = Object.keys(app.dependencies).sort(),
  seen = new Set<string>(),
  sections: string[] = [];
while (queue.length) {
  const name = queue.shift()!;
  if (seen.has(name)) continue;
  seen.add(name);
  const root = join("node_modules", name),
    pkg = await Bun.file(join(root, "package.json")).json();
  queue.push(...Object.keys(pkg.dependencies || {}));
  const candidates = [
    "LICENSE",
    "LICENSE.txt",
    "LICENSE.md",
    "license",
    "COPYING",
  ];
  let license = "";
  for (const file of candidates) {
    if (await Bun.file(join(root, file)).exists()) {
      license = await Bun.file(join(root, file)).text();
      break;
    }
  }
  if (!license)
    throw new Error(`Review and include the distribution notice for ${name}`);
  const notice = (await Bun.file(join(root, "NOTICE")).exists())
    ? await Bun.file(join(root, "NOTICE")).text()
    : "";
  sections.push(
    `${name} ${pkg.version} (${pkg.license})\n${"-".repeat(72)}\n${license}${notice ? "\n" + notice : ""}`,
  );
}
await Bun.write(
  "web/public/third-party-notices.txt",
  `ChronoShift production dependencies\nGenerated from the frozen dependency graph; includes bundled runtime libraries.\n\n${sections.join("\n\n")}\n`,
);
console.log(`Included notices for ${seen.size} production packages.`);
