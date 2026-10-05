# Reporter path correction

The six-case run passed without retries. Playwright resolved the JSON reporter's
relative output filename against the configuration directory, producing
`docs/qa/copy-focus-2026-10-05/hosted/report.json` beneath this directory.
Root copied those exact raw bytes to `report.json` here, preserving the original.
The configuration now uses an absolute URL-derived output path. This is a
collection correction after execution, not a rerun or change to assertions.
