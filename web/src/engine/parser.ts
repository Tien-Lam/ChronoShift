import { en } from "chrono-node";
import type { Chrono } from "chrono-node";
import { AMBIGUOUS, FIXED, REGIONAL } from "./zones";
const abbreviations = Object.keys({ ...FIXED, ...AMBIGUOUS, ...REGIONAL }).join(
  "|",
);
function extend(parser: Chrono): Chrono {
  // Bounded extensions cover audited shorthand without treating room numbers
  // or prices as times. Native Chrono refiners still merge dates and zones.
  parser.parsers.unshift({
    pattern: () =>
      new RegExp(
        `\\b([01]\\d|2[0-3])([0-5]\\d)\\s*(?:hours\\b|Zulu\\b|(?=(?:${abbreviations})\\b))`,
        "i",
      ),
    extract: (_context, match) => ({
      hour: +match[1],
      minute: +match[2],
      second: 0,
    }),
  });
  parser.parsers.unshift({
    pattern: () => /\b(1[0-2]|[1-9])([ap])\b(?=\s+[A-Z]{2,5}\b)/i,
    extract: (_context, m) => ({
      hour: (+m[1] % 12) + (m[2].toLowerCase() === "p" ? 12 : 0),
      minute: 0,
      second: 0,
      meridiem: m[2].toLowerCase() === "p" ? 1 : 0,
    }),
  });
  parser.parsers.unshift({
    pattern: () =>
      /\bbetween\s+(1[0-2]|[1-9])(?::([0-5]\d))?\s+and\s+(1[0-2]|[1-9])(?::([0-5]\d))?\s*([ap])m\b/i,
    extract: (context, m) => {
      const pm = m[5].toLowerCase() === "p" ? 12 : 0;
      return context.createParsingResult(
        m.index!,
        m[0],
        { hour: (+m[1] % 12) + pm, minute: +(m[2] || 0), meridiem: pm ? 1 : 0 },
        { hour: (+m[3] % 12) + pm, minute: +(m[4] || 0), meridiem: pm ? 1 : 0 },
      );
    },
  });
  return parser;
}
export const monthFirst = extend(en.casual.clone()),
  dayFirst = extend(en.GB.clone());
