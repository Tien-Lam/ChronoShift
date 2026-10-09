import { temporal as Temporal } from "./temporal";

export const FIXED: Record<string, number> = {
  UTC: 0,
  GMT: 0,
  ZULU: 0,
  EST: -300,
  EDT: -240,
  CDT: -300,
  MST: -420,
  MDT: -360,
  PST: -480,
  PDT: -420,
  AKST: -540,
  AKDT: -480,
  HST: -600,
  NST: -210,
  NDT: -150,
  WET: 0,
  WEST: 60,
  CET: 60,
  CEST: 120,
  EET: 120,
  EEST: 180,
  MSK: 180,
  JST: 540,
  KST: 540,
  HKT: 480,
  SGT: 480,
  PHT: 480,
  ICT: 420,
  WIB: 420,
  PKT: 300,
  NPT: 345,
  AEST: 600,
  AEDT: 660,
  ACST: 570,
  ACDT: 630,
  AWST: 480,
  NZST: 720,
  NZDT: 780,
  WAT: 60,
  CAT: 120,
  EAT: 180,
  SAST: 120,
  BRT: -180,
  ART: -180,
};
export const AMBIGUOUS: Record<string, [number, string][]> = {
  CST: [
    [-360, "US Central Standard"],
    [480, "China Standard"],
  ],
  IST: [
    [330, "India Standard"],
    [60, "Irish Standard"],
  ],
  BST: [
    [60, "British Summer"],
    [360, "Bangladesh Standard"],
  ],
  AST: [
    [-240, "Atlantic Standard"],
    [180, "Arabia Standard"],
  ],
};
export const REGIONAL: Record<string, string> = {
  PT: "America/Los_Angeles",
  ET: "America/New_York",
  CT: "America/Chicago",
  MT: "America/Denver",
  AT: "America/Halifax",
};
const aliases: Record<string, string> = {
  nyc: "America/New_York",
  "new york": "America/New_York",
  dc: "America/New_York",
  la: "America/Los_Angeles",
  sf: "America/Los_Angeles",
  "san francisco": "America/Los_Angeles",
  "san diego": "America/Los_Angeles",
  seattle: "America/Los_Angeles",
  portland: "America/Los_Angeles",
  "las vegas": "America/Los_Angeles",
  boston: "America/New_York",
  miami: "America/New_York",
  atlanta: "America/New_York",
  philadelphia: "America/New_York",
  dallas: "America/Chicago",
  houston: "America/Chicago",
  austin: "America/Chicago",
  minneapolis: "America/Chicago",
  "salt lake city": "America/Denver",
  mumbai: "Asia/Kolkata",
  delhi: "Asia/Kolkata",
  bangalore: "Asia/Kolkata",
  beijing: "Asia/Shanghai",
  osaka: "Asia/Tokyo",
  "cape town": "Africa/Johannesburg",
  rio: "America/Sao_Paulo",
  melbourne: "Australia/Melbourne",
  brisbane: "Australia/Brisbane",
  "abu dhabi": "Asia/Dubai",
  barcelona: "Europe/Madrid",
  milan: "Europe/Rome",
  munich: "Europe/Berlin",
  hawaii: "Pacific/Honolulu",
  pacific: "America/Los_Angeles",
  eastern: "America/New_York",
  central: "America/Chicago",
  mountain: "America/Denver",
};
export const cityAliases = Object.keys(aliases);
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
export const zoneIds = [
  ...new Set([
    "UTC",
    ...Intl.supportedValuesOf("timeZone"),
    ...Object.values(aliases),
  ]),
].sort();
const cities = new Map<string, Set<string>>();
for (const zone of zoneIds) {
  if (!zone.includes("/")) continue;
  const name = norm(zone.split("/").at(-1)!.replaceAll("_", " "));
  cities.set(name, new Set([...(cities.get(name) || []), zone]));
}
for (const [city, zone] of Object.entries(aliases))
  cities.set(city, new Set([zone]));

export function validZone(zone: string): boolean {
  try {
    Temporal.Instant.from("2026-01-01T00:00:00Z").toZonedDateTimeISO(zone);
    return true;
  } catch {
    return false;
  }
}
export function offsetZone(minutes: number): string {
  const sign = minutes < 0 ? "-" : "+";
  const value = Math.abs(minutes);
  return `${sign}${Math.floor(value / 60)
    .toString()
    .padStart(2, "0")}:${(value % 60).toString().padStart(2, "0")}`;
}
export function zoneName(zone: string): string {
  if (zone === "UTC") return "UTC";
  if (/^[+-]/.test(zone)) return `UTC${zone}`;
  return zone.split("/").at(-1)!.replaceAll("_", " ");
}
export function offsetMinutes(zone: string, now: string): number {
  return (
    Temporal.Instant.from(now).toZonedDateTimeISO(zone).offsetNanoseconds / 60e9
  );
}
export function editDistance(a: string, b: string): number {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++)
      next[j] = Math.min(
        next[j - 1] + 1,
        row[j] + 1,
        row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    row = next;
  }
  return row[b.length];
}
export function resolveCity(query: string): {
  zones: string[];
  corrected?: string;
} {
  const q = norm(query);
  const exact = cities.get(q);
  if (exact) return { zones: [...exact] };
  // Short names and prefix guesses are too easy to misinterpret.
  if (q.length < 5) return { zones: [] };
  const scored = [...cities.keys()]
    .map((name) => ({ name, distance: editDistance(q, name) }))
    .filter((x) => x.distance <= 1);
  if (scored.length !== 1) return { zones: [] };
  return { zones: [...cities.get(scored[0].name)!], corrected: scored[0].name };
}

export interface ZoneChoice {
  zone: string;
  label: string;
  interpretation?: string;
  assumption?: string;
}
export const IANA_TOKEN = /\b(?:[A-Z][A-Za-z0-9_+-]*\/)+[A-Za-z0-9_+-]+\b/;
export const OFFSET_TOKEN =
  /\b(?:UTC|GMT)\s*[+\-−][A-Za-z0-9+\-−:]*(?:\.\d+)?[A-Za-z0-9+\-−:]*/gi;
export function explicitZones(text: string): ZoneChoice[] | undefined {
  const iana = text.match(IANA_TOKEN);
  if (iana && validZone(iana[0]))
    return [{ zone: iana[0], label: zoneName(iana[0]) }];
  const token = text.match(OFFSET_TOKEN)?.[0];
  const numeric = token?.match(
    /^(?:UTC|GMT)\s*([+-])(\d{1,2})(?::?(\d{2}))?$/i,
  );
  if (token && !numeric) return [];
  if (numeric) {
    const minute = +(numeric[3] || 0),
      value = +numeric[2] * 60 + minute;
    if (minute < 60 && value <= 840) {
      const zone = offsetZone((numeric[1] === "-" ? -1 : 1) * value);
      return [{ zone, label: zoneName(zone) }];
    }
    return [];
  }
  for (const match of text.matchAll(/\b[A-Za-z]{2,5}\b/g)) {
    const abbr = match[0].toUpperCase();
    if (AMBIGUOUS[abbr])
      return AMBIGUOUS[abbr].map(([offset, interpretation]) => ({
        zone: offsetZone(offset),
        label: `${abbr} · ${interpretation}`,
        interpretation,
      }));
    if (FIXED[abbr] !== undefined)
      return [{ zone: offsetZone(FIXED[abbr]), label: abbr }];
    if (match[0] === abbr && REGIONAL[abbr])
      return [{ zone: REGIONAL[abbr], label: zoneName(REGIONAL[abbr]) }];
  }
  const region = text.match(
    /\b(?:US\s+)?(Pacific|Eastern|Central|Mountain)(?:\s+Time)?\b/i,
  );
  if (region) {
    const zone = aliases[region[1].toLowerCase()];
    return [{ zone, label: zoneName(zone) }];
  }
  return undefined;
}
