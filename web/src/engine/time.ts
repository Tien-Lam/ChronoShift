import type { Temporal as TemporalTypes } from "@js-temporal/polyfill";
import { temporal as Temporal } from "./temporal";
import { zoneName } from "./zones";
import type { ConversionOptions, DisplayTime, TimeResult } from "./types";

export function civilInstants(
  dateTime: TemporalTypes.PlainDateTime,
  zone: string,
): { instants: string[]; nonexistent: boolean } {
  const fields = {
    timeZone: zone,
    year: dateTime.year,
    month: dateTime.month,
    day: dateTime.day,
    hour: dateTime.hour,
    minute: dateTime.minute,
    second: dateTime.second,
    millisecond: dateTime.millisecond,
  };
  const earlier = Temporal.ZonedDateTime.from(fields, {
    disambiguation: "earlier",
    overflow: "reject",
  });
  const later = Temporal.ZonedDateTime.from(fields, {
    disambiguation: "later",
    overflow: "reject",
  });
  if (
    !earlier.toPlainDateTime().equals(dateTime) ||
    !later.toPlainDateTime().equals(dateTime)
  )
    return { instants: [], nonexistent: true };
  return {
    instants: [
      ...new Set([
        earlier.toInstant().toString(),
        later.toInstant().toString(),
      ]),
    ],
    nonexistent: false,
  };
}
export function formatResult(
  result: TimeResult,
  options: ConversionOptions,
): DisplayTime {
  const locale = options.locale || "en-AU";
  if (result.dateOnly) {
    return {
      time: "",
      date: Temporal.PlainDate.from(result.dateOnly).toLocaleString(locale, {
        dateStyle: "full",
      }),
      zone: "Date only",
      dateShift: 0,
    };
  }
  const instant = Temporal.Instant.from(result.instant!);
  const target = instant.toZonedDateTimeISO(options.targetZone);
  const source = instant.toZonedDateTimeISO(result.sourceZone);
  const date = new Date(Number(instant.epochMilliseconds));
  // Intl cannot format offset-only zones on every supported browser. Shift to UTC for those.
  const fixed = /^[+-]/.test(options.targetZone);
  const displayDate = fixed
    ? new Date(
        Number(instant.epochMilliseconds) + target.offsetNanoseconds / 1e6,
      )
    : date;
  const timeZone = fixed ? "UTC" : options.targetZone;
  return {
    time: new Intl.DateTimeFormat(locale, {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
      ...(target.second || target.millisecond
        ? { second: "2-digit" as const }
        : {}),
      ...(target.millisecond ? { fractionalSecondDigits: 3 as const } : {}),
      ...(options.hourCycle && options.hourCycle !== "auto"
        ? { hour12: options.hourCycle === "12" }
        : {}),
    }).format(displayDate),
    date: new Intl.DateTimeFormat(locale, {
      timeZone,
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(displayDate),
    zone: `${target.offset === "+00:00" ? "UTC" : "UTC" + target.offset}${options.targetZone.includes("/") ? " " + zoneName(options.targetZone) : ""}`,
    dateShift: source.toPlainDate().until(target.toPlainDate()).days,
  };
}
export function rangeLabel(result: TimeResult): string {
  return result.endpoint === "start"
    ? "From"
    : result.endpoint === "end"
      ? "To"
      : "";
}
export function copyText(
  result: TimeResult,
  options: ConversionOptions,
): string {
  const d = formatResult(result, options);
  const range = rangeLabel(result);
  return `${range ? range + ": " : ""}${d.time ? d.time + " · " : ""}${d.date} · ${d.zone}\n${result.original} — ${result.sourceLabel}${result.interpretation ? " (" + result.interpretation + ")" : ""}${result.assumptions.length ? "\n" + result.assumptions.join("; ") : ""}`;
}
