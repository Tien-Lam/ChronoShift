# Merge Philosophy

**Show all interpretations, don't guess.** When a timestamp is ambiguous, ChronoShift shows every valid conversion and lets the user pick the right one.

## Why

Timezone abbreviations are notoriously ambiguous. "CST" can mean US Central Standard Time (UTC-6), China Standard Time (UTC+8), or Cuba Standard Time (UTC-5). Guessing wrong is worse than showing options — a user scheduling a meeting across timezones needs the correct conversion, not a coin flip.

## How Merging Works

`ResultMerger` combines results from all extractors using a three-tier match:

### 1. Exact Match (same instant + same timezone)

If two results resolve to the same `Instant` and have the same `sourceTimezone`, they're true duplicates. The merge keeps one and combines the method labels (e.g., "ML Kit + Chrono + LiteRT").

### 2. Fuzzy Match (same local time + same date)

If two results have the same hour, minute, and date (`isSameLocalTime`), the merge applies these rules:

- **One has a timezone, the other doesn't** — the one with timezone wins (upgrades the null-tz result).
- **Both have timezones, same instant** — they agree, merge them.
- **Both have timezones, different instants** — they represent different interpretations. Keep both as separate results.

### 3. No Match

The result is new — add it to the list.

## Ambiguity Expansion

After all extractors have run and results are merged, `ChronoResultParser.expandAmbiguous()` checks each result's timezone abbreviation. If it maps to multiple IANA zones (via `TimezoneAbbreviations`), the single result is expanded into one result per possible zone.

For example, "3 PM CST" becomes:
- 3:00 PM UTC-6 Chicago (US Central)
- 3:00 PM UTC+8 Shanghai (China Standard)

Zone-based abbreviations like CT, ET, PT, MT are also supported and expand to their standard/daylight variants.

## What Doesn't Merge

- **Same local time, different dates** — kept separate. `isSameLocalTime` checks date to prevent cross-date silent merges.
- **Same instant, different timezones** — kept separate. "3 PM EST" and "4 PM EDT" resolve to the same instant but represent different source context, so both are shown.
- **Date-only results** — filtered out when real time results exist from any extractor. Kept only when they're the sole result (better than nothing).
