import { join } from "node:path";
const forbidden = [
  /local-development-only/,
  /Local UI gallery/,
  /fault-paste/,
  /Actions committed:/,
  /__gallery/,
];
for await (const path of new Bun.Glob("**/*").scan("dist")) {
  if (!/\.(?:html|js|css|json|txt)$/.test(path)) continue;
  const text = await Bun.file(join("dist", path)).text();
  if (forbidden.some((pattern) => pattern.test(text)))
    throw new Error(`Development gallery leaked into ${path}`);
}
console.log(
  "Production/offline assets exclude the development gallery and fault controls.",
);
