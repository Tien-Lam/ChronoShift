import type { ConversionOptions } from "./types";

// Install the handler before any asynchronous module loads. Module workers can
// receive their first request while the compatibility implementation is loading.
let engine: Promise<typeof import("./convert")> | undefined;
self.onmessage = async (
  event: MessageEvent<{ id: number; text: string; options: ConversionOptions }>,
) => {
  const { id, text, options } = event.data;
  try {
    engine ??= import("./convert");
    const { convert } = await engine;
    self.postMessage({ id, conversion: convert(text, options) });
  } catch (error) {
    self.postMessage({
      id,
      error:
        error instanceof Error
          ? error.message
          : "Could not convert this message. Please try again.",
    });
  }
};
