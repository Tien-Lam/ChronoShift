# Updating chrono.js

ChronoShift bundles [chrono-node](https://github.com/wanasit/chrono) as a single JavaScript file that runs in QuickJS via [Zipline](https://github.com/nicholasgasior/nicholasgasior). The bundle lives at `app/src/main/assets/chrono.js`.

## How It Works

Chrono.js is a JavaScript NLP library for parsing natural-language dates and times. Since Android can't run Node.js, ChronoShift embeds a QuickJS engine (provided by Zipline) and loads the bundled script at runtime.

The entry point script wraps chrono-node's `parse()` function and exposes a `chronoParse(text)` function that returns JSON. `ChronoExtractor` calls this function via `QuickJs.evaluate()`.

## Rebuilding the Bundle

```bash
npm install chrono-node
npx esbuild entry.js --bundle --format=iife --minify --outfile=app/src/main/assets/chrono.js
```

The `entry.js` file defines the `chronoParse` global function that bridges chrono-node's API to the JSON format `ChronoResultParser` expects.

### Output Format

`chronoParse()` returns a JSON array of objects:

```json
[
  {
    "text": "3pm EST",
    "start": {
      "year": 2026, "month": 4, "day": 11,
      "hour": 15, "minute": 0, "second": 0,
      "timezoneOffset": -300,
      "isCertain": { "year": false, "month": false, "day": false, "hour": true, "timezone": true }
    }
  }
]
```

Key fields consumed by `ChronoResultParser`:
- `timezoneOffset` — minutes from UTC (e.g., -300 = UTC-5). Converted to IANA zone via `offsetToTimezone()`.
- `isCertain` — controls date propagation. When `day` is uncertain, `ChronoResultParser` propagates the date from context.

## Zipline Notes

- Zipline provides QuickJS with 16KB-aligned native libraries (required for modern Android).
- Runtime dependency: `app.cash.zipline:zipline`
- Test dependency: `app.cash.zipline:zipline-jvm` (JVM-only QuickJS for unit tests)
- The QuickJS engine is initialized once (`ChronoExtractor.initEngine()`) and reused for all evaluations.
