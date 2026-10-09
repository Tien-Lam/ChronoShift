import { resolve } from "node:path";
import type { Plugin } from "vite";

/** Keep the framework out of the initial loader; every chunk stays precached. */
export function mountChunk(): Plugin {
  const id = "virtual:mount-url";
  const resolvedId = "\0" + id;
  let building = false;
  let base = "/";
  let reference: string;
  return {
    name: "mount-chunk",
    configResolved(config) {
      building = config.command === "build";
      base = config.base;
    },
    buildStart() {
      if (building)
        reference = this.emitFile({
          type: "chunk",
          id: resolve("web/src/mount.tsx"),
          name: "Mount",
          preserveSignature: "strict",
        });
    },
    resolveId(source) {
      if (source === id) return resolvedId;
    },
    load(source) {
      if (source !== resolvedId) return;
      return building
        ? `export const mountUrl = import.meta.ROLLUP_FILE_URL_${reference};`
        : `export const mountUrl = ${JSON.stringify(base + "src/mount.tsx")};`;
    },
  };
}
