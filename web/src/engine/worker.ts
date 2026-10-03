import { convert } from "./convert";
import type { ConversionOptions } from "./types";

self.onmessage = (
  event: MessageEvent<{ id: number; text: string; options: ConversionOptions }>,
) => {
  const { id, text, options } = event.data;
  try {
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
