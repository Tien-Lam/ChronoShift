import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
const root = resolve(import.meta.dir, "../../..");
async function inventory(dir: string): Promise<string[]> {
  return (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((entry) =>
        entry.isDirectory()
          ? inventory(join(dir, entry.name))
          : [join(dir, entry.name)],
      ),
    )
  ).flat();
}
export default async function setup() {
  const started = new Date().toISOString();
  const url = `http://127.0.0.1:${process.env.PLAYWRIGHT_PORT}/`;
  const rows = [];
  for (const path of (await inventory(join(root, "dist"))).sort()) {
    const relative = path.slice(join(root, "dist").length + 1);
    const response = await fetch(new URL(relative, url), { cache: "no-store" });
    const hash = (bytes: ArrayBuffer) =>
      new Bun.CryptoHasher("sha256").update(bytes).digest("hex");
    const fileHash = hash(await Bun.file(path).arrayBuffer());
    const servedHash = hash(await response.arrayBuffer());
    rows.push({
      path: relative,
      status: response.status,
      fileHash,
      servedHash,
    });
    if (!response.ok || fileHash !== servedHash)
      throw Error(`Served identity mismatch: ${relative}`);
  }
  await Bun.write(
    join(
      import.meta.dir,
      "controls",
      process.env.ZONE_CONTROL_BLOCK!,
      "served.json",
    ),
    JSON.stringify(
      { started, ended: new Date().toISOString(), url, rows },
      null,
      2,
    ),
  );
}
