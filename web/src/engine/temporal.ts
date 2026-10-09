import type { Temporal as TemporalTypes } from "@js-temporal/polyfill";

const native = (
  globalThis as typeof globalThis & { Temporal?: typeof TemporalTypes }
).Temporal;

// Use one implementation consistently within each page or conversion worker.
// Keep the pinned implementation available for engines without native Temporal.
export const temporal =
  native &&
  [
    native.Instant,
    native.PlainDate,
    native.PlainDateTime,
    native.PlainTime,
    native.ZonedDateTime,
    native.Duration,
    native.Now?.instant,
  ].every((part) => typeof part === "function")
    ? native
    : (await import("@js-temporal/polyfill")).Temporal;
