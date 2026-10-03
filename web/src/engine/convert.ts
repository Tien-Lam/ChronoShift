import { dayFirst, monthFirst } from "./parser";
import type { ParsedComponents } from "chrono-node";
import { Temporal } from "@js-temporal/polyfill";
import {
  AMBIGUOUS,
  FIXED,
  REGIONAL,
  explicitZones,
  offsetMinutes,
  offsetZone,
  resolveCity,
  validZone,
  zoneName,
} from "./zones";
import type { ZoneChoice } from "./zones";
import { civilInstants } from "./time";
import type { Conversion, ConversionOptions, TimeResult } from "./types";

import { MAX_INPUT } from "./limits";
export { MAX_INPUT } from "./limits";
const timezoneHints = {
  ...FIXED,
  ...Object.fromEntries(
    Object.entries(AMBIGUOUS).map(([k, v]) => [k, v[0][0]]),
  ),
  ...Object.fromEntries(Object.keys(REGIONAL).map((k) => [k, 0])),
};

function componentDate(c: ParsedComponents): Temporal.PlainDate {
  return Temporal.PlainDate.from(
    { year: c.get("year")!, month: c.get("month")!, day: c.get("day")! },
    { overflow: "reject" },
  );
}
function paragraph(text: string, index: number): number {
  return (text.slice(0, index).match(/\n\s*\n/g) || []).length;
}

function choicesFor(
  text: string,
  suffix: string,
  c: ParsedComponents,
  fallback: string,
  warnings: string[],
): ZoneChoice[] {
  const combined = text + suffix;
  const numeric = combined.match(/\b(?:UTC|GMT)\s*[+-]\d{1,2}(?::?\d{2})?\b/i);
  if (numeric && !explicitZones(numeric[0])?.length) {
    warnings.push(
      `Invalid timezone offset ${numeric[0]}. Correct it and try again.`,
    );
    return [];
  }
  const unknownIana = combined.match(
    /\b(?:[A-Z][A-Za-z_+-]*\/)+[A-Za-z_+-]+\b/,
  );
  if (unknownIana && !validZone(unknownIana[0])) {
    warnings.push(
      `Unknown timezone ${unknownIana[0]}. Correct it and try again.`,
    );
    return [];
  }
  const explicit = explicitZones(combined);
  if (explicit) return explicit;
  const city = suffix.match(/^\s+(?:in|at)\s+([\p{L}][\p{L} .'-]{1,40})/iu);
  if (city) {
    const query = city[1]
      .replace(
        /\s+(?:on|tomorrow|today|and|then|but|please|for|with|because)\b.*$/i,
        "",
      )
      .replace(/[.,]+$/, "")
      .trim();
    const resolved = resolveCity(query);
    if (!resolved.zones.length) {
      warnings.push(
        `Couldn't identify the city “${query}”. Correct or remove the city, then choose a source timezone in More options.`,
      );
      return [];
    }
    return resolved.zones.map((zone) => ({
      zone,
      label: zoneName(zone),
      ...(resolved.corrected
        ? {
            assumption: `City interpreted as ${zoneName(zone)}; check this match`,
          }
        : {}),
    }));
  }
  const bare = suffix.match(/^\s+([\p{L}][\p{L} .'-]{1,40})/u);
  if (bare) {
    const words = bare[1]
      .replace(/[.,]+$/, "")
      .trim()
      .split(/\s+/);
    for (let length = Math.min(words.length, 4); length > 0; length--) {
      const resolved = resolveCity(words.slice(0, length).join(" "));
      if (!resolved.corrected && resolved.zones.length)
        return resolved.zones.map((zone) => ({ zone, label: zoneName(zone) }));
    }
  }
  // Offsets parsed from ISO strings or numeric offsets have no geographic identity.
  if (c.isCertain("timezoneOffset")) {
    const zone = offsetZone(c.get("timezoneOffset")!);
    return [{ zone, label: zoneName(zone) }];
  }
  const unknownAbbr = suffix.match(/^\s+([A-Z]{2,5})\b/);
  if (unknownAbbr && !["AM", "PM"].includes(unknownAbbr[1])) {
    warnings.push(
      `Unknown timezone ${unknownAbbr[1]}. Correct or remove it, then choose a source timezone.`,
    );
    return [];
  }
  return [
    {
      zone: fallback,
      label: zoneName(fallback),
      assumption: `Source timezone assumed: ${zoneName(fallback)}`,
    },
  ];
}

export function convert(text: string, options: ConversionOptions): Conversion {
  if (text.length > MAX_INPUT)
    throw new Error(
      "Keep the message under 10,000 characters. Shorten it and try again.",
    );
  if (!validZone(options.sourceZone) || !validZone(options.targetZone))
    throw new Error("Choose a valid timezone and try again.");
  if (!text.trim()) return { results: [], warnings: [] };
  let now = options.now || Temporal.Now.instant().toString();
  if (options.referenceDate)
    now = Temporal.PlainDate.from(options.referenceDate)
      .toZonedDateTime({ timeZone: options.sourceZone, plainTime: "12:00" })
      .toInstant()
      .toString();
  const parser = options.dateOrder === "dmy" ? dayFirst : monthFirst;
  const ref = {
    instant: new Date(now),
    timezone: offsetMinutes(options.sourceZone, now),
  };
  const parsed = parser.parse(text, ref, { timezones: timezoneHints });
  const warnings: string[] = [],
    results: TimeResult[] = [];
  const invalidOffsets = [
    ...text.matchAll(/\b(?:UTC|GMT)\s*[+-]\d{1,2}(?::?\d{2})?\b/gi),
  ].filter((m) => !explicitZones(m[0])?.length);
  invalidOffsets.forEach((m) =>
    warnings.push(`Invalid timezone offset ${m[0]}. Correct it and try again.`),
  );
  const vague = [
    ...text.matchAll(
      /\b(?:(?:half|quarter)\s+(?:past|to)\s+(?:noon|midnight|\d{1,2}(?:\s*[ap]m)?)|\d{1,2}ish)\b/gi,
    ),
  ];
  vague.forEach((m) =>
    warnings.push(
      `“${m[0]}” needs a clear clock time. Replace it with a time such as 3:30pm.`,
    ),
  );
  if (/\b(?:EOD|COB)\b/i.test(text))
    warnings.push(
      "EOD/COB does not specify a clock time. Replace it with the intended time.",
    );
  let contextDate: Temporal.PlainDate | undefined,
    contextText = "",
    contextParagraph = -1,
    previousEnd = 0;
  const hasTime = parsed.some((r) => r.start.isCertain("hour"));

  for (let i = 0; i < parsed.length; i++) {
    const r = parsed[i],
      block = paragraph(text, r.index);
    if (
      invalidOffsets.some(
        (m) =>
          r.index <= m.index! + m[0].length &&
          r.index + r.text.length >= m.index!,
      )
    )
      continue;
    if (
      vague.some(
        (m) =>
          r.index < m.index! + m[0].length &&
          r.index + r.text.length > m.index!,
      )
    )
      continue;
    if (
      block !== contextParagraph ||
      /[.!?]\s+[A-Z]/.test(text.slice(previousEnd, r.index))
    ) {
      contextDate = undefined;
      contextText = "";
      contextParagraph = block;
    }
    previousEnd = r.index + r.text.length;
    const date = componentDate(r.start),
      explicitDate = r.start.isCertain("day");
    if (explicitDate) {
      contextDate = date;
      contextText = r.text;
    }
    if (!r.start.isCertain("hour") && !r.start.isCertain("minute")) {
      if (!hasTime)
        results.push({
          id: `date-${r.index}`,
          group: `date-${r.index}`,
          original: r.text,
          sourceIndex: r.index,
          dateOnly: date.toString(),
          sourceZone: options.sourceZone,
          sourceLabel: "Date only",
          assumptions: r.start.isCertain("year")
            ? []
            : [`Year assumed: ${date.year}`],
          occurrences: 1,
        });
      continue;
    }
    const suffixEnd = Math.min(
      parsed[i + 1]?.index ?? text.length,
      r.index + r.text.length + 100,
    );
    const suffix = text
      .slice(r.index + r.text.length, suffixEnd)
      .split(/\n|[;!?]|,(?!\s*\d)/)[0];
    const original = (
      r.text +
      (/^\s+(?:(?:in|at)\s+|(?:[A-Z][A-Za-z_+-]*\/))/.test(suffix)
        ? suffix
        : "")
    ).trim();
    const endpoints: [ParsedComponents, "start" | "end" | undefined][] = [
      [r.start, r.end ? "start" : undefined],
      ...(r.end ? [[r.end, "end"] as [ParsedComponents, "end"]] : []),
    ];
    const zones = [...r.text.matchAll(/\b(?:[A-Z]{2,5})\b/g)].filter(
      (m) => !!explicitZones(m[0]),
    );
    for (const [c, endpoint] of endpoints) {
      // If both endpoints carry a different abbreviation, resolve each independently.
      const zoneText =
        r.end && zones.length > 1
          ? zones[endpoint === "end" ? zones.length - 1 : 0][0]
          : r.text;
      const choices = choicesFor(
        zoneText,
        suffix,
        c,
        options.sourceZone,
        warnings,
      );
      for (const choice of choices) {
        const zoneRef = {
          instant: new Date(now),
          timezone: offsetMinutes(choice.zone, now),
        };
        const local = parser.parse(r.text, zoneRef, {
          timezones: timezoneHints,
        })[0];
        const components = local
          ? endpoint === "end" && local.end
            ? local.end
            : local.start
          : c;
        let selectedDate = componentDate(components),
          assumptions = choice.assumption ? [choice.assumption] : [];
        if (!explicitDate && contextDate) {
          const header = parser.parse(contextText, zoneRef, {
            timezones: timezoneHints,
          })[0];
          const context = header ? componentDate(header.start) : contextDate;
          selectedDate = context.add({
            days: componentDate(local?.start || r.start).until(selectedDate)
              .days,
          });
          assumptions.push(`Date from message context: ${context}`);
        } else if (!explicitDate) {
          assumptions.push(`Date assumed: ${selectedDate}`);
        } else if (!c.isCertain("year"))
          assumptions.push(`Year assumed: ${selectedDate.year}`);
        const dt = selectedDate.toPlainDateTime({
          hour: components.get("hour") || 0,
          minute: components.get("minute") || 0,
          second: components.get("second") || 0,
          millisecond: components.get("millisecond") || 0,
        });
        const resolved = civilInstants(dt, choice.zone);
        if (resolved.nonexistent) {
          warnings.push(
            `${dt.toString().replace("T", " ")} doesn't exist in ${choice.label} because the clocks move forward. Edit the time or choose a source timezone.`,
          );
          continue;
        }
        for (let n = 0; n < resolved.instants.length; n++) {
          const instant = resolved.instants[n];
          results.push({
            id: `${r.index}-${endpoint || "time"}-${choice.zone}-${n}`,
            group: `${r.index}-${endpoint || "time"}`,
            original,
            sourceIndex: r.index,
            endpoint,
            instant,
            sourceZone: choice.zone,
            sourceLabel: choice.label,
            interpretation:
              resolved.instants.length > 1
                ? `${choice.interpretation ? choice.interpretation + " · " : ""}${n === 0 ? "First" : "Second"} occurrence (clocks move back)`
                : choice.interpretation,
            assumptions,
            occurrences: 1,
          });
        }
      }
    }
  }
  for (const match of text.matchAll(/\b(1[4-9]\d{8}|[2-9]\d{9})\b/g)) {
    const instant = Temporal.Instant.fromEpochMilliseconds(+match[0] * 1000);
    const year = instant.toZonedDateTimeISO("UTC").year;
    if (year < 2015 || year > 2035) continue;
    results.push({
      id: `unix-${match.index}`,
      group: `unix-${match.index}`,
      original: match[0],
      sourceIndex: match.index!,
      instant: instant.toString(),
      sourceZone: "UTC",
      sourceLabel: "Unix seconds · UTC",
      assumptions: [],
      occurrences: 1,
    });
  }
  const merged = new Map<string, TimeResult>();
  for (const r of results.sort((a, b) => a.sourceIndex - b.sourceIndex)) {
    const source = r.sourceZone === "+00:00" ? "UTC" : r.sourceZone;
    const key = `${r.instant || r.dateOnly}|${source}|${r.endpoint || ""}`;
    const previous = merged.get(key);
    if (previous) {
      if (
        previous.assumptions.some((a) =>
          a.startsWith("Source timezone assumed:"),
        ) &&
        !r.assumptions.some((a) => a.startsWith("Source timezone assumed:"))
      )
        merged.set(key, { ...r, occurrences: previous.occurrences + 1 });
      else previous.occurrences++;
    } else merged.set(key, r);
  }
  if (merged.size > 200)
    throw new Error(
      "This message has more than 200 time interpretations. Convert a smaller section.",
    );
  return { results: [...merged.values()], warnings: [...new Set(warnings)] };
}
