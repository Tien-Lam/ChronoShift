import { resolve } from "node:path";
import type { Plugin } from "vite";

/** Give retries the actual immutable chunk URL without guessing a bundle name. */
export function dateControlChunk(): Plugin {
  const id = "virtual:date-control-url";
  const resolvedId = "\0" + id;
  let building = false;
  let base = "/";
  let reference: string;
  return {
    name: "date-control-chunk",
    configResolved(config) {
      building = config.command === "build";
      base = config.base;
    },
    buildStart() {
      if (building)
        reference = this.emitFile({
          type: "chunk",
          id: resolve("web/src/components/DateChoice.tsx"),
          name: "DateChoice",
          preserveSignature: "strict",
        });
    },
    resolveId(source) {
      if (source === id) return resolvedId;
    },
    load(source) {
      if (source !== resolvedId) return;
      return building
        ? `export const dateControlUrl = import.meta.ROLLUP_FILE_URL_${reference};`
        : `export const dateControlUrl = ${JSON.stringify(base + "src/components/DateChoice.tsx")};`;
    },
  };
}
