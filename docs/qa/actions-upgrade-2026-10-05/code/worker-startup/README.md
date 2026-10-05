# Local production-worker cost probe

Preparation observed 2026-10-05 09:54:09 UTC onward. Actual measurement window
09:55:51.646–09:55:54.069 UTC; summary generated09:56:39.960 UTC. Report writing
began09:57:01 UTC and completed09:57:38 UTC. Explicit cwd
`/Users/tien/Developer/ChronoShift`.

Retaining a completed idle worker measurably reduces this local request cost.
The absolute paired mean saving is **15.50–26.25ms per request**, not a measured
whole-app or CI speedup. No application/test source, build, CI, installation or
peer verdict was involved.

| Engine | Fresh mean / median | Idle mean / median | Paired mean saving |
| --- | ---: | ---: | ---: |
| Chromium153.0.8010.12 | 17.89 /17.90ms | 0.52 /0.45ms | 17.38ms |
| Firefox155.0 | 28.17 /28.00ms | 1.92 /1.00ms | 26.25ms |
| WebKit26.6 | 16.33 /16.00ms | 0.83 /1.00ms | 15.50ms |

Each engine ran serially on local macOS ARM64, Bun1.4.0/Playwright1.63.0,
en-AU/Australia-Sydney, 900×640 at1× raster, normal motion. Actual origin was
`http://127.0.0.1:59311`. A minimal same-origin document avoids App rendering,
debounce and offline bootstrap; service workers are explicitly blocked. The
ordinary preview server serves the unchanged production module worker.

There are12 matched fresh and12 idle requests per engine, alternating which
condition runs first. Four independently specified temporal fixtures repeat
three times per condition: fixed spring EST, regional summer PT, quarter-hour
offset, and relative Tokyo. Every instant list, date-only list and warning list
must equal the fixture's independent oracle. All72 measured requests and the six
separately retained bootstrap/prime requests passed exactly. No expected result
was derived from the engine. Fresh workers terminate after each response; one
completed worker is reused serially. Initial browser/HTTP/module bootstrap and
idle-worker prime are excluded from the paired summary but retained in raw data.

Both conditions use the same page's `performance.now()` clock. Fresh elapsed
includes constructor-to-response; idle elapsed includes postMessage-to-response.
The difference combines worker startup, module/network/cache and JIT effects;
it does not isolate CPU or the module-import portion. Firefox/WebKit timer
quantization produces some zero-ms idle samples, which are retained rather than
inventing sub-millisecond precision. Per-request deadlines are5 seconds;
listeners/timers, workers, browser contexts and the owned server are cleaned up.

Before/after disk hashes and actual served-worker bytes agree. Built source is
`35e11bac657a0c379fda48af9b454e674d2ea854`, base `/`:

- worker-C690IjaR.js: `e17b01198be6045d352561d10fe1f6004eb83d106b13f16ef027f0ec36230704`
- App index-B3d9YDa-.js: `764439adde23302a0e40ff2c221e8fe13055671a6285ac16d528344cf06befc9`
- independent temporal fixtures: `3a3e9fffbe98156e39ff8dc29ed527745df5583624077908e207c0faeb71a9a9`
- raw measurement: `6bfbce7727f09ae3971e53a72a1e87a0e88e507dee7e19321350ff470d54f4fb`

[Probe source](measure.ts), [raw requests/environment/identity](raw.json),
[summary](summary.json), [summary calculation](summarize.ts) and [run log](run.log)
are retained. Inputs are synthetic fixture text; no application input was sent
in a request or stored by a production feature.

This confirms a small absolute local latency owner. The saved eef data does not
count production worker creations, and constrained Linux can behave differently.
Neither multiplying these local means by fill-call counts nor the roughly
93–97% isolated relative reduction establishes the required49-plus seconds of
whole-pair improvement. Active cancellation, stale completion, update/release
ownership, offline behavior, DOM assertion polling and all273 cases remain
unmeasured by this probe. TIE-375's complete-pair target remains open.
